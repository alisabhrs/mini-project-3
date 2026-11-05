/* FRESH'D — FILL FRIDGE */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const form = $("food-form");
  const list = $("stock-list");
  const fridgeImage = $("fridge-image");

  if (!form || !list || !fridgeImage) {
    console.error("Fresh'd: Required HTML elements are missing.");
    return;
  }

  const STORAGE_KEY = "freshd-inventory-v1";

  const fridgeImages = {
    closed: "images/fridge-closed.png",
    fridge: "images/fridge-opened.png",
    freezer: "images/freezer-opened.png",
    both: "images/fridge-and-freezer-opened.png"
  };

  const foodIcons = {
    Fruit: "🍓",
    Vegetables: "🥬",
    Dairy: "🥚",
    "Dairy & Eggs": "🥚",
    Meat: "🥩",
    "Meat & Seafood": "🥩",
    Drinks: "🥛",
    Frozen: "🧊",
    "Frozen Foods": "🧊",
    Snacks: "🍪",
    Other: "🥫"
  };

  const shelfPositions = {
    top: [50, 31],
    middle: [50, 44],
    bottom: [50, 55],
    freezer: [50, 80]
  };

  let items = loadItems();
  let mode = "add";
  let filter = "all";
  let view = "fridge";
  let editingId = null;

  function loadItems() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch {
      showError("Browser storage is full. Remove some items.");
      return false;
    }
  }

  function showError(text) {
    let error = $("form-error");

    if (!error) {
      error = document.createElement("p");
      error.id = "form-error";
      error.setAttribute("role", "alert");
      form.prepend(error);
    }

    error.textContent = text;
    error.hidden = !text;
  }

  function foodIcon(item) {
    return foodIcons[item.category] || "🥫";
  }

  function isFreezer(item) {
    return item.storage === "freezer" || item.shelf === "freezer";
  }

  
function expiryStatus(item) {
  if (!item.date || item.dateType === "none") {
    return "No date";
  }

  if (item.dateType === "purchased") {
    return "Bought " + item.date;
  }

  if (item.dateType === "production") {
    return "Produced " + item.date;
  }

  const [year, month, day] = item.date.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round(
    (expiry - today) / 86400000
  );

  if (days < 0) return "EXPIRED";
  if (days <= 3) return "USE SOON";

  return "Expires " + item.date;
  }

  function makeButton(text, onClick, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
  }

  /* ADD ITEMS / ORGANIZE */

  function setMode(nextMode) {
    mode = nextMode;

    const receipt = $("receipt-panel");
    const stock = $("stock-panel");
    const instructions = $("organize-instructions");

    if (receipt) receipt.hidden = mode === "organize";

    if (stock) {
      stock.classList.toggle("organize-mode", mode === "organize");
    }

    if (instructions) {
      instructions.hidden = mode !== "organize";
    }

    const addButton = $("add-mode-btn");
    const organizeButton = $("organize-mode-btn");

    if (addButton) {
      addButton.classList.toggle("active", mode === "add");
      addButton.setAttribute("aria-pressed", mode === "add");
    }

    if (organizeButton) {
      organizeButton.classList.toggle("active", mode === "organize");
      organizeButton.setAttribute(
        "aria-pressed",
        mode === "organize"
      );
    }

    render();
  }

  /* FRIDGE IMAGE SWITCHING */

  function setView(nextView) {
    if (!fridgeImages[nextView]) return;

    view = nextView;

    fridgeImage.style.opacity = "0.35";
    fridgeImage.src = fridgeImages[nextView];

    const descriptions = {
      closed: "Closed refrigerator",
      fridge: "Open refrigerator",
      freezer: "Open freezer",
      both: "Open refrigerator and freezer"
    };

    fridgeImage.alt = descriptions[nextView];

    document.querySelectorAll(
      ".fridge-view-buttons [data-view]"
    ).forEach(button => {
      const active = button.dataset.view === nextView;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active);
    });

    renderPlacedFood();
  }

  fridgeImage.style.transition = "opacity 220ms ease";

  fridgeImage.addEventListener("load", () => {
    fridgeImage.style.opacity = "1";
  });

  fridgeImage.addEventListener("error", () => {
    fridgeImage.style.opacity = "1";
    console.error("Missing fridge image:", fridgeImage.src);
  });

  /* STOCK LIST */

  function render() {
    const count = $("stock-count");

    if (count) {
      count.textContent = items.length;
    }

    list.replaceChildren();

    const visibleItems = items.filter(item => {
      if (filter === "all") return true;
      if (filter === "freezer") return isFreezer(item);
      return !isFreezer(item);
    });

    if (visibleItems.length === 0) {
      const empty = document.createElement("p");
      empty.className = "stock-empty";

      empty.textContent = items.length
        ? "No groceries in this section."
        : "YOUR FRIDGE IS EMPTY. ADD ITEMS TO GET STARTED!";

      list.append(empty);
    }

    visibleItems.forEach(item => {
      const row = document.createElement("div");
      row.className = "stock-item";
      row.dataset.storage = isFreezer(item)
        ? "freezer"
        : "fridge";

      row.draggable = mode === "organize";

      row.addEventListener("dragstart", event => {
        if (mode !== "organize") {
          event.preventDefault();
          return;
        }

        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      });

      const picture = document.createElement("span");
      picture.className = "food-emoji";

      if (item.image) {
        const image = document.createElement("img");
        image.src = item.image;
        image.alt = "";
        image.className = "food-picture";
        picture.append(image);
      } else {
        picture.textContent = foodIcon(item);
      }

      const details = document.createElement("div");
      details.className = "food-details";

      const name = document.createElement("strong");
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "food-meta";

      meta.textContent =
        `${item.quantity} ${item.unit || "pcs"} · ` +
        `${item.category} · ${expiryStatus(item)}` +
        (item.shelf ? ` · ${item.shelf.toUpperCase()}` : "");

      details.append(name, meta);

      const actions = document.createElement("div");
      actions.className = "food-actions";

      actions.append(
        makeButton(
          mode === "organize" ? "PLACE" : "SELECT",
          () => {
            if (mode === "organize") {
              placeItem(
                item.id,
                isFreezer(item) ? "freezer" : "middle"
              );
            } else {
              row.classList.toggle("selected");
            }
          }
        )
      );

      actions.append(
        makeButton("EDIT", () => editItem(item))
      );

      actions.append(
        makeButton("DELETE", () => {
          if (confirm(`Delete ${item.name}?`)) {
            items = items.filter(food => food.id !== item.id);
            saveItems();
            render();
          }
        })
      );

      row.append(picture, details, actions);
      list.append(row);
    });

    document.querySelectorAll(".filter-btn").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active);
    });

    renderPlacedFood();
  }

  /* FOOD IMAGES ON FRIDGE SHELVES */

  function renderPlacedFood() {
    const container = $("fridge-container");
    if (!container) return;

    let overlay = $("placed-foods");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "placed-foods";
      overlay.style.cssText =
        "position:absolute;inset:0;pointer-events:none;";

      container.append(overlay);
    }

    overlay.replaceChildren();

    if (view === "closed") return;

    const placedItems = items.filter(item => {
      if (!item.shelf) return false;
      if (view === "both") return true;
      if (view === "freezer") return item.shelf === "freezer";
      return item.shelf !== "freezer";
    });

    placedItems.forEach(item => {
      const [defaultX, defaultY] =
        shelfPositions[item.shelf] || shelfPositions.middle;

     
const food = makeButton(
  foodIcon(item),
  () => {},
  "placed-food"
);

// Allow food to be moved around inside the fridge
food.addEventListener("pointerdown", event => {
  if (mode !== "organize") return;

  event.preventDefault();

  const container = $("fridge-container");
  const rect = container.getBoundingClientRect();

  food.setPointerCapture(event.pointerId);

  const moveFood = moveEvent => {
    const x = Math.max(
      8,
      Math.min(
        92,
        ((moveEvent.clientX - rect.left) / rect.width) * 100
      )
    );

    const y = Math.max(
      8,
      Math.min(
        92,
        ((moveEvent.clientY - rect.top) / rect.height) * 100
      )
    );

    food.style.left = x + "%";
    food.style.top = y + "%";

    item.x = x;
    item.y = y;
  };

  const stopMoving = () => {
    food.removeEventListener("pointermove", moveFood);
    food.removeEventListener("pointerup", stopMoving);
    food.removeEventListener("pointercancel", stopMoving);

    saveItems();
  };

  food.addEventListener("pointermove", moveFood);
  food.addEventListener("pointerup", stopMoving);
  food.addEventListener("pointercancel", stopMoving);
});

      food.style.cssText = `
        position: absolute;
        left: ${item.x ?? defaultX}%;
        top: ${item.y ?? defaultY}%;
        transform: translate(-50%, -50%);
        font-size: 30px;
        background: transparent;
        border: 0;
        cursor: pointer;
        pointer-events: auto;
      `;

      food.title = item.name;

      if (item.image) {
        food.textContent = "";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;
        image.style.cssText =
          "width:48px;height:48px;object-fit:contain;";

        food.append(image);
        
food.style.touchAction = "none";
food.style.userSelect = "none";
food.draggable = false;

      }

      overlay.append(food);
    });
  }

  function placeItem(id, shelf, x, y) {
    const item = items.find(food => food.id === id);
    if (!item) return;

    item.shelf = shelf;
    item.storage = shelf === "freezer" ? "freezer" : "fridge";

    const position = shelfPositions[shelf] || shelfPositions.middle;

    item.x = x ?? position[0];
    item.y = y ?? position[1];

    if (!saveItems()) return;

    if (
      view === "closed" ||
      (shelf === "freezer" && view === "fridge") ||
      (shelf !== "freezer" && view === "freezer")
    ) {
      setView("both");
    }

    render();
  }

  /* EDIT GROCERIES */

  function editItem(item) {
    editingId = item.id;

    $("food-category").value = item.category;
    $("food-name").value = item.name;
    $("food-brand").value = item.brand || "";
    $("food-quantity").value = item.quantity;
   $("date-type").value = item.dateType || "expiration";
updateDateField();
$("food-date").value = item.date || "";
    $("storage").value = isFreezer(item) ? "freezer" : "fridge";

    const submit = form.querySelector('[type="submit"]');

    if (submit) {
      submit.textContent = "✓ SAVE CHANGES";
    }

    setMode("add");
    $("food-name").focus();
  }

  function resetForm() {
    form.reset();
    updateDateField();
    editingId = null;

    $("food-quantity").value = 1;

    const submit = form.querySelector('[type="submit"]');

    if (submit) {
      submit.textContent = "+ ADD TO FRIDGE";
    }

    showError("");
  }

  /* SUBMIT RECEIPT FORM */

  form.addEventListener("submit", event => {
    event.preventDefault();
    showError("");

    const name = $("food-name").value.trim();
    const quantity = Number($("food-quantity").value);
    const category = $("food-category").value;
    const storage = $("storage").value;

    if (
      !name ||
      !category ||
      !["fridge", "freezer"].includes(storage) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 9999
    ) {
      showError(
        "Enter a category, item name, and a whole-number quantity from 1 to 9999."
      );
      return;
    }

    const existing = items.find(item => item.id === editingId);

    const item = {
      id: existing?.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      category,
      brand: $("food-brand").value.trim(),
      quantity,
      unit: existing?.unit || "pcs",
      storage,
      date: $("date-type").value === "none"
  ? ""
  : $("food-date").value,

dateType: $("date-type").value,
      image: existing?.image || null,
      shelf: existing?.shelf || null,
      x: existing?.x ?? null,
      y: existing?.y ?? null
    };

    if (
      existing &&
      isFreezer(existing) !== (storage === "freezer")
    ) {
      item.shelf = null;
      item.x = null;
      item.y = null;
    }

    const previousItems = [...items];

    if (existing) {
      items = items.map(food =>
        food.id === existing.id ? item : food
      );
    } else {
      items.unshift(item);
    }

    if (!saveItems()) {
      items = previousItems;
      return;
    }

    resetForm();
    render();
    $("food-name").focus();
  });

  /* CONNECT ALL BUTTONS */

  $("add-mode-btn")?.addEventListener("click", () => {
    setMode("add");
  });

  $("organize-mode-btn")?.addEventListener("click", () => {
    setMode("organize");
  });

  $("add-another-btn")?.addEventListener("click", () => {
    setMode("add");
    $("food-name").focus();
  });

  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      render();
    });
  });

  document.querySelectorAll(
    ".fridge-view-buttons [data-view]"
  ).forEach(button => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });

  /* DRAG FOOD ONTO SHELVES */

  document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("dragover", event => {
      if (mode !== "organize" || view === "closed") return;

      event.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", event => {
      event.preventDefault();
      zone.classList.remove("drag-over");

      if (mode !== "organize" || view === "closed") return;

      const id = event.dataTransfer.getData("text/plain");
      const shelf = zone.dataset.shelf;

      if (!id || !shelfPositions[shelf]) return;

      const container = $("fridge-container");
      const rect = container.getBoundingClientRect();

      const x = Math.max(
        15,
        Math.min(85, (event.clientX - rect.left) / rect.width * 100)
      );

      const y = Math.max(
        15,
        Math.min(85, (event.clientY - rect.top) / rect.height * 100)
      );

      placeItem(id, shelf, x, y);
    });
  });

  /* CLEAR ALL STOCK */

  const stockPanel = $("stock-panel");

  if (stockPanel && !$("clear-stock-btn")) {
    const clearButton = makeButton(
      "CLEAR ALL STOCK",
      () => {
        if (!items.length) return;

        if (confirm("Delete all saved groceries?")) {
          items = [];
          saveItems();
          resetForm();
          render();
        }
      },
      "clear-stock-btn"
    );

    clearButton.id = "clear-stock-btn";
    stockPanel.append(clearButton);
  }

/* DATE TYPE CONTROLS */

const dateTypeSelect = $("date-type");
const dateInputContainer = $("date-input-container");
const dateLabel = $("date-label");
const foodDateInput = $("food-date");

function updateDateField() {
  if (!dateTypeSelect || !foodDateInput) return;

  const type = dateTypeSelect.value;

  const labels = {
    expiration: "EXPIRATION DATE",
    purchased: "PURCHASE DATE",
    production: "PRODUCTION DATE",
    none: "NO DATE"
  };

  if (dateLabel) {
    dateLabel.textContent = labels[type];
  }

  if (dateInputContainer) {
    dateInputContainer.hidden = type === "none";
  }

  foodDateInput.disabled = type === "none";

  if (type === "none") {
    foodDateInput.value = "";
  }
}

dateTypeSelect?.addEventListener("change", updateDateField);

updateDateField();

  /* INITIAL PAGE STATE */

  setView("fridge");
  setMode("add");
})();
