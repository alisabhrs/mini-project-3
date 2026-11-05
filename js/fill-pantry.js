
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const KEY = "freshd-inventory-v1";
  const OLD_KEY = "freshd-pantry-v1";
  const $ = id => document.getElementById(id);

  const form = $("pantry-form");
  const list = $("pantry-list");
  const stage = $("pantry-shelves");
  const error = $("pantry-error");
  const message = $("pantry-message");

  const nameInput = $("pantry-name");
  const categoryInput = $("pantry-category");
  const quantityInput = $("pantry-quantity");
  const unitInput = $("pantry-unit");
  const brandInput = $("pantry-brand");
  const dateTypeInput = $("pantry-date-type");
  const dateInput = $("pantry-date");

  const emoji = {
    "Grains & Pasta": "🍝",
    "Canned Goods": "🥫",
    "Snacks": "🍪",
    "Baking": "🧁",
    "Condiments": "🫙",
    "Beverages": "🧃",
    "Spices": "🌶️",
    "Other": "🥫"
  };

  let editingId = null;

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function getAll() {
    return read(KEY);
  }

  function saveAll(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function getPantry() {
    return getAll().filter(item =>
      String(item.storage || "").toLowerCase() === "pantry"
    );
  }

  // Import older pantry items into shared inventory once.
  function migrateOldPantry() {
    const oldItems = read(OLD_KEY);
    if (!oldItems.length) return;

    const all = getAll();
    const ids = new Set(all.map(item => String(item.id)));

    oldItems.forEach(item => {
      if (!ids.has(String(item.id))) {
        all.push({
          ...item,
          storage: "pantry"
        });
      }
    });

    saveAll(all);
    localStorage.removeItem(OLD_KEY);
  }

  function showError(text) {
    if (!error) return;
    error.textContent = text;
    error.hidden = !text;
  }

  function showMessage(text) {
    if (message) message.textContent = text;
  }

  function updateDateField() {
    const none = dateTypeInput.value === "none";
    const wrapper = $("pantry-date-wrap");

    if (wrapper) wrapper.hidden = none;

    dateInput.disabled = none;
    if (none) dateInput.value = "";
  }

  function resetForm() {
    editingId = null;
    form.reset();
    quantityInput.value = 1;

    const title = $("pantry-form-title");
    if (title) title.innerHTML = "ADD TO<br>YOUR PANTRY";

    const submit = $("pantry-submit");
    if (submit) submit.textContent = "+ ADD TO PANTRY ↗";

    const cancel = $("pantry-cancel");
    if (cancel) cancel.hidden = true;

    showError("");
    updateDateField();
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [y, m, d] = value.split("-").map(Number);
    const test = new Date(Date.UTC(y, m - 1, d));

    return (
      test.getUTCFullYear() === y &&
      test.getUTCMonth() === m - 1 &&
      test.getUTCDate() === d
    );
  }

  // Keep numbers between 0 and 1.
  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  // Calculate a starting position for new food items.
  function defaultPosition(index) {
    return {
      x: 0.12 + (index % 5) * 0.16,
      y: 0.16 + (Math.floor(index / 5) % 4) * 0.18
    };
  }

  function itemPosition(item, index) {
    const fallback = defaultPosition(index);

    const x = Number(item.pantryX);
    const y = Number(item.pantryY);

    return {
      x: Number.isFinite(x) ? clamp(x) : fallback.x,
      y: Number.isFinite(y) ? clamp(y) : fallback.y
    };
  }

  function savePosition(id, x, y) {
    const updated = getAll().map(item => {
      if (
        String(item.id) === String(id) &&
        String(item.storage).toLowerCase() === "pantry"
      ) {
        return {
          ...item,
          pantryX: x,
          pantryY: y
        };
      }

      return item;
    });

    saveAll(updated);
  }

  // FREE DRAGGING
  function enableFreeDrag(tile, item) {
    tile.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;

      event.preventDefault();

      const stageRect = stage.getBoundingClientRect();
      const tileRect = tile.getBoundingClientRect();

      const offsetX = event.clientX - tileRect.left;
      const offsetY = event.clientY - tileRect.top;

      tile.setPointerCapture(event.pointerId);
      tile.classList.add("dragging");

      function move(moveEvent) {
        const rect = stage.getBoundingClientRect();

        const maxX = Math.max(0, rect.width - tile.offsetWidth);
        const maxY = Math.max(0, rect.height - tile.offsetHeight);

        const px = clamp(
          moveEvent.clientX - rect.left - offsetX,
          0,
          maxX
        );

        const py = clamp(
          moveEvent.clientY - rect.top - offsetY,
          0,
          maxY
        );

        tile.style.left = `${px}px`;
        tile.style.top = `${py}px`;
      }

      function stop() {
        tile.classList.remove("dragging");

        const maxX = Math.max(1, stage.clientWidth - tile.offsetWidth);
        const maxY = Math.max(1, stage.clientHeight - tile.offsetHeight);

        const x = clamp(tile.offsetLeft / maxX);
        const y = clamp(tile.offsetTop / maxY);

        try {
          savePosition(item.id, x, y);
          showMessage("✓ PANTRY POSITION SAVED!");
        } catch {
          showMessage("COULD NOT SAVE PANTRY POSITION.");
        }

        tile.removeEventListener("pointermove", move);
        tile.removeEventListener("pointerup", stop);
        tile.removeEventListener("pointercancel", stop);
      }

      tile.addEventListener("pointermove", move);
      tile.addEventListener("pointerup", stop);
      tile.addEventListener("pointercancel", stop);
    });
  }

  function createPantryFood(item, index) {
    const tile = document.createElement("div");
    tile.className = "pantry-shelf-item";
    tile.title = `${item.name} — drag to organize`;

    const symbol = document.createElement("span");
    symbol.className = "pantry-shelf-emoji";
    symbol.textContent = emoji[item.category] || "🥫";

    const label = document.createElement("span");
    label.className = "pantry-shelf-name";
    label.textContent = item.name;

    tile.append(symbol, label);

    const position = itemPosition(item, index);

    // Coordinates are relative to available movement space.
    const availableX = Math.max(
      0,
      stage.clientWidth - 72
    );

    const availableY = Math.max(
      0,
      stage.clientHeight - 70
    );

    tile.style.left = `${position.x * availableX}px`;
    tile.style.top = `${position.y * availableY}px`;

    enableFreeDrag(tile, item);

    return tile;
  }

  function renderPantryStage(items) {
    if (!stage) return;

    stage.replaceChildren();

    // Remove old shelf layout entirely.
    items.forEach((item, index) => {
      stage.append(createPantryFood(item, index));
    });
  }

  // ADD OR EDIT ITEM
  form.addEventListener("submit", event => {
    event.preventDefault();
    showError("");

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const quantity = Number(quantityInput.value);
    const dateType = dateTypeInput.value;
    const date = dateType === "none" ? "" : dateInput.value;

    if (!name) {
      showError("PLEASE ENTER A FOOD NAME.");
      nameInput.focus();
      return;
    }

    if (!category) {
      showError("PLEASE CHOOSE A CATEGORY.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 9999
    ) {
      showError("QUANTITY MUST BE BETWEEN 1 AND 9999.");
      return;
    }

    if (date && !validDate(date)) {
      showError("PLEASE ENTER A VALID DATE.");
      return;
    }

    const all = getAll();

    const existing = all.find(item =>
      String(item.id) === String(editingId) &&
      item.storage === "pantry"
    );

    const item = {
      ...(existing || {}),
      id: existing?.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      category,
      quantity,
      unit: unitInput.value,
      brand: brandInput.value.trim(),
      storage: "pantry",
      dateType,
      date,
      createdAt: existing?.createdAt ?? Date.now()
    };

    const updated = existing
      ? all.map(food =>
          String(food.id) === String(editingId)
            ? item
            : food
        )
      : [...all, item];

    try {
      saveAll(updated);
    } catch {
      showError("COULD NOT SAVE. CHECK BROWSER STORAGE.");
      return;
    }

    const wasEditing = Boolean(existing);

    resetForm();
    render();

    showMessage(
      wasEditing
        ? "✓ PANTRY ITEM UPDATED!"
        : "✓ FOOD ADDED TO YOUR PANTRY!"
    );
  });

  function editItem(id) {
    const item = getPantry().find(food =>
      String(food.id) === String(id)
    );

    if (!item) return;

    editingId = item.id;

    nameInput.value = item.name || "";
    categoryInput.value = item.category || "Other";
    quantityInput.value = item.quantity || 1;
    unitInput.value = item.unit || "pcs";
    brandInput.value = item.brand || "";
    dateTypeInput.value = item.dateType || "expiration";
    dateInput.value = item.date || "";

    updateDateField();

    const title = $("pantry-form-title");
    if (title) title.innerHTML = "EDIT YOUR<br>PANTRY ITEM";

    const submit = $("pantry-submit");
    if (submit) submit.textContent = "✓ SAVE CHANGES";

    const cancel = $("pantry-cancel");
    if (cancel) cancel.hidden = false;

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    nameInput.focus({ preventScroll: true });
  }

  function removeItem(id) {
    const item = getPantry().find(food =>
      String(food.id) === String(id)
    );

    if (!item) return;

    if (!confirm(`Remove "${item.name}"?`)) return;

    const updated = getAll().filter(food =>
      String(food.id) !== String(id)
    );

    saveAll(updated);

    if (String(editingId) === String(id)) {
      resetForm();
    }

    render();
    showMessage("✓ ITEM REMOVED.");
  }

  function dateLabel(item) {
    if (!item.date || item.dateType === "none") {
      return "NO EXPIRY DATE";
    }

    if (item.dateType === "purchased") {
      return `PURCHASED: ${item.date}`;
    }

    if (item.dateType === "production") {
      return `PRODUCED: ${item.date}`;
    }

    return `BEST BEFORE: ${item.date}`;
  }

  function createListCard(item) {
    const card = document.createElement("article");
    card.className = "pantry-item";

    const symbol = document.createElement("div");
    symbol.className = "pantry-item-emoji";
    symbol.textContent = emoji[item.category] || "🥫";

    const details = document.createElement("div");

    const heading = document.createElement("h3");
    heading.textContent = item.name;

    const meta = document.createElement("p");
    meta.textContent = [
      `${item.quantity} ${item.unit || "pcs"}`,
      item.category,
      item.brand
    ].filter(Boolean).join(" · ");

    const date = document.createElement("p");
    date.textContent = dateLabel(item);

    details.append(heading, meta, date);

    const actions = document.createElement("div");
    actions.className = "pantry-item-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "EDIT";
    edit.addEventListener("click", () => editItem(item.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "REMOVE";
    remove.addEventListener("click", () => removeItem(item.id));

    actions.append(edit, remove);
    card.append(symbol, details, actions);

    return card;
  }

  function render() {
    const pantry = getPantry();

    const total = $("pantry-total");
    if (total) total.textContent = pantry.length;

    renderPantryStage(pantry);

    const searchInput = $("pantry-search");
    const filterInput = $("pantry-filter");
    const sortInput = $("pantry-sort");

    const search = (searchInput?.value || "")
      .trim()
      .toLowerCase();

    const filter = filterInput?.value || "all";

    const visible = pantry.filter(item => {
      const matchesCategory =
        filter === "all" || item.category === filter;

      const matchesSearch = [
        item.name,
        item.category,
        item.brand
      ].join(" ").toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });

    const sort = sortInput?.value || "newest";

    if (sort === "name") {
      visible.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else if (sort === "date") {
      visible.sort((a, b) => {
        const dateA =
          a.dateType === "expiration" && a.date
            ? a.date
            : "9999-12-31";

        const dateB =
          b.dateType === "expiration" && b.date
            ? b.date
            : "9999-12-31";

        return dateA.localeCompare(dateB);
      });
    } else {
      visible.sort((a, b) =>
        (b.createdAt || 0) - (a.createdAt || 0)
      );
    }

    const results = $("pantry-results");
    if (results) {
      results.textContent =
        `${visible.length} OF ${pantry.length} ITEMS`;
    }

    list.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "pantry-empty";

      const icon = document.createElement("span");
      icon.textContent = "🥫";

      const heading = document.createElement("h3");
      heading.textContent = pantry.length
        ? "NO MATCHING GROCERIES."
        : "YOUR PANTRY IS EMPTY!";

      const description = document.createElement("p");
      description.textContent = pantry.length
        ? "TRY ANOTHER SEARCH OR CATEGORY."
        : "ADD A GROCERY TO FILL YOUR PANTRY.";

      empty.append(icon, heading, description);
      list.append(empty);
      return;
    }

    visible.forEach(item => {
      list.append(createListCard(item));
    });
  }

  // SEARCH, FILTER AND SORT
  $("pantry-search")?.addEventListener("input", render);
  $("pantry-filter")?.addEventListener("change", render);
  $("pantry-sort")?.addEventListener("change", render);

  dateTypeInput.addEventListener("change", updateDateField);

  $("pantry-cancel")?.addEventListener("click", () => {
    resetForm();
    showMessage("EDIT CANCELLED.");
  });

  // RESET PANTRY WITHOUT REMOVING FRIDGE ITEMS
  $("pantry-reset")?.addEventListener("click", () => {
    const pantry = getPantry();

    if (!pantry.length) {
      showMessage("YOUR PANTRY IS ALREADY EMPTY.");
      return;
    }

    if (!confirm(
      "Clear ALL pantry groceries? Fridge items will be kept."
    )) {
      return;
    }

    const updated = getAll().filter(item =>
      String(item.storage || "").toLowerCase() !== "pantry"
    );

    saveAll(updated);
    resetForm();
    render();
    showMessage("✓ PANTRY CLEARED.");
  });

  window.addEventListener("storage", event => {
    if (event.key === KEY || event.key === null) {
      render();
    }
  });

  window.addEventListener("pageshow", render);

  // Keep positions aligned when the page resizes.
  window.addEventListener("resize", () => {
    renderPantryStage(getPantry());
  });

  try {
    migrateOldPantry();
  } catch (migrationError) {
    console.error("Pantry migration failed:", migrationError);
    showMessage("COULD NOT IMPORT OLD PANTRY DATA.");
  }

  updateDateField();
  render();
});
