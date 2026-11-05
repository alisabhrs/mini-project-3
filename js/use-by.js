
/* =========================================
   FRESH'D — USE BY
   Connected to Fill Fridge inventory
========================================= */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  // SAME STORAGE KEY AS FILL FRIDGE
  const STORAGE_KEY = "freshd-inventory-v1";

  const categoryEmoji = {
    fruit: "🍓",
    fruits: "🍓",
    vegetable: "🥦",
    vegetables: "🥦",
    dairy: "🥛",
    "dairy & eggs": "🥚",
    meat: "🥩",
    "meat & seafood": "🥩",
    seafood: "🐟",
    drinks: "🧃",
    frozen: "🧊",
    "frozen foods": "🧊",
    snacks: "🍪",
    grains: "🍞",
    other: "🥫"
  };

  let activeFilter = "all";

  /* ---------------------------------------
     SHARED INVENTORY
  --------------------------------------- */

  function getItems() {
    try {
      if (window.FreshdInventory) {
        return window.FreshdInventory.get();
      }

      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Could not load inventory:", error);
      return [];
    }
  }

  function saveItems(items) {
    try {
      if (window.FreshdInventory) {
        window.FreshdInventory.save(items);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(items)
        );
      }

      return true;
    } catch (error) {
      console.error("Could not save inventory:", error);
      alert("Could not save your changes.");
      return false;
    }
  }

  /* ---------------------------------------
     DATE HELPERS
  --------------------------------------- */

  function parseDate(value) {
    if (!value) return null;

    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function today() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function dayDifference(date) {
    // Calendar-day difference, avoiding DST issues.
    const now = today();

    const dateUTC = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const todayUTC = Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return Math.round(
      (dateUTC - todayUTC) / 86400000
    );
  }

  function getDateType(item) {
    return String(
      item.dateType || "expiration"
    ).toLowerCase();
  }

  function getExpiryDays(item) {
    if (getDateType(item) !== "expiration") {
      return null;
    }

    const date = parseDate(item.date);

    if (!date) return null;

    return dayDifference(date);
  }

  function getElapsedDays(item) {
    const type = getDateType(item);

    if (
      type !== "purchased" &&
      type !== "production"
    ) {
      return null;
    }

    const date = parseDate(item.date);

    if (!date) return null;

    return -dayDifference(date);
  }

  /* ---------------------------------------
     FRESHNESS STATUS
  --------------------------------------- */

  function getStatus(item) {
    const days = getExpiryDays(item);

    if (days === null) {
      return "undated";
    }

    if (days < 0) {
      return "expired";
    }

    if (days <= 3) {
      return "soon";
    }

    return "fresh";
  }

  function getStatusLabel(item) {
    const days = getExpiryDays(item);

    if (days !== null) {
      if (days < 0) {
        return `EXPIRED ${Math.abs(days)}D AGO`;
      }

      if (days === 0) {
        return "EXPIRES TODAY";
      }

      if (days <= 3) {
        return `${days}D LEFT`;
      }

      return "FRESH";
    }

    const type = getDateType(item);

    if (
      type === "purchased" ||
      type === "production"
    ) {
      return "CHECK FRESHNESS";
    }

    return "NO EXPIRY";
  }

  function getDateDescription(item) {
    const type = getDateType(item);
    const date = item.date;

    if (!date || type === "none") {
      return "No date recorded — check manually.";
    }

    if (type === "expiration") {
      return `Expiration date: ${date}`;
    }

    const elapsed = getElapsedDays(item);

    const label = type === "purchased"
      ? "Purchased"
      : "Produced";

    if (elapsed === null) {
      return `${label}: ${date}`;
    }

    if (elapsed < 0) {
      return `${label}: ${date} · Date is ${Math.abs(elapsed)} day(s) in the future`;
    }

    if (elapsed === 0) {
      return `${label}: ${date} · Today`;
    }

    return `${label}: ${date} · ${elapsed} day(s) ago`;
  }

  function getStorageAdvice(item) {
    const type = getDateType(item);

    if (
      type !== "purchased" &&
      type !== "production"
    ) {
      return "";
    }

    const elapsed = getElapsedDays(item);

    if (elapsed === null) {
      return "Check the package for its use-by date.";
    }

    if (elapsed < 0) {
      return "This date is in the future. Check the entry.";
    }

    const category = String(
      item.category || ""
    ).toLowerCase();

    const storage = String(
      item.storage || ""
    ).toLowerCase();

    if (storage === "freezer") {
      return "Frozen item: storage time depends on the food, packaging, and freezer temperature. Check its label.";
    }

    if (
      category === "fruit" ||
      category === "vegetables"
    ) {
      return "Fresh produce varies widely. Check for mold, damage, and the specific food's storage guidance.";
    }

    if (
      category === "meat" ||
      category === "meat & seafood"
    ) {
      return "Perishable food: check its label and recommended refrigeration period. Do not rely on appearance alone.";
    }

    if (
      category === "dairy" ||
      category === "dairy & eggs"
    ) {
      return "Check the package date and storage instructions. Freshness varies by product.";
    }

    return "Check the package date and recommended storage time for this specific food.";
  }

  /* ---------------------------------------
     FOOD CARD
  --------------------------------------- */

  function createFoodCard(item) {
    const card = document.createElement("article");
    card.className = "food-card";

    const emoji = document.createElement("div");
    emoji.className = "food-emoji";

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";
      image.style.width = "48px";
      image.style.height = "48px";
      image.style.objectFit = "contain";
      emoji.append(image);
    } else {
      emoji.textContent =
        categoryEmoji[
          String(item.category || "other").toLowerCase()
        ] || "🥫";
    }

    const details = document.createElement("div");
    details.className = "food-details";

    const title = document.createElement("h3");
    title.textContent = item.name || "Unnamed food";

    const meta = document.createElement("p");

    meta.textContent = [
      `${item.quantity || 1} ${item.unit || "pcs"}`,
      item.category || "Other",
      item.storage || "",
      item.brand || ""
    ].filter(Boolean).join(" · ");

    const dateText = document.createElement("p");
    dateText.textContent = getDateDescription(item);

    details.append(title, meta, dateText);

    const advice = getStorageAdvice(item);

    if (advice) {
      const adviceText = document.createElement("p");
      adviceText.textContent = `↳ ${advice}`;
      adviceText.style.color = "#d7c19a";
      adviceText.style.marginTop = "8px";
      details.append(adviceText);
    }

    const actions = document.createElement("div");
    actions.className = "food-actions";

    const badge = document.createElement("span");

    badge.className =
      `status-badge ${getStatus(item)}`;

    badge.textContent = getStatusLabel(item);

    const usedButton = document.createElement("button");
    usedButton.type = "button";
    usedButton.className = "used-button";
    usedButton.textContent = "✓ USED IT";

    usedButton.addEventListener("click", () => {
      const confirmed = confirm(
        `Remove "${item.name}" from your inventory?`
      );

      if (!confirmed) return;

      const items = getItems();

      const updated = items.filter(
        food => String(food.id) !== String(item.id)
      );

      if (saveItems(updated)) {
        render();
      }
    });

    actions.append(badge, usedButton);
    card.append(emoji, details, actions);

    return card;
  }

  /* ---------------------------------------
     RENDER COUNTERS AND FOOD LIST
  --------------------------------------- */

  function render() {
    const items = getItems();

    const counts = {
      expired: 0,
      soon: 0,
      fresh: 0,
      undated: 0
    };

    items.forEach(item => {
      counts[getStatus(item)]++;
    });

    // Main counters
    $("expired-count").textContent = counts.expired;
    $("soon-count").textContent = counts.soon;
    $("fresh-count").textContent = counts.fresh;
    $("undated-count").textContent = counts.undated;

    // Total
    $("total-count").textContent =
      `${items.length} ITEM${items.length === 1 ? "" : "S"}`;

    // Receipt
    $("receipt-total").textContent = items.length;
    $("receipt-expired").textContent = counts.expired;
    $("receipt-soon").textContent = counts.soon;

    $("receipt-attention").textContent =
      counts.expired + counts.soon;

    // Search
    const search = $("food-search").value
      .trim()
      .toLowerCase();

    // Filter
    const visible = items.filter(item => {
      const matchesFilter =
        activeFilter === "all" ||
        getStatus(item) === activeFilter;

      const searchable = [
        item.name,
        item.category,
        item.brand,
        item.storage
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        matchesFilter &&
        searchable.includes(search)
      );
    });

    // Sorting
    const priority = {
      expired: 0,
      soon: 1,
      fresh: 2,
      undated: 3
    };

    const sortType = $("sort-by").value;

    visible.sort((a, b) => {
      if (sortType === "name") {
        return String(a.name || "").localeCompare(
          String(b.name || "")
        );
      }

      if (sortType === "date") {
        return (
          (getExpiryDays(a) ?? Infinity) -
          (getExpiryDays(b) ?? Infinity)
        );
      }

      return (
        priority[getStatus(a)] -
        priority[getStatus(b)] ||
        (getExpiryDays(a) ?? Infinity) -
        (getExpiryDays(b) ?? Infinity)
      );
    });

    // Food list
    const list = $("useby-list");
    list.replaceChildren();

    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";

      const message = document.createElement("p");

      message.textContent = items.length
        ? "NO GROCERIES MATCH THIS FILTER."
        : "YOUR FRIDGE IS EMPTY. ADD SOME GROCERIES!";

      empty.append(message);

      if (items.length === 0) {
        const link = document.createElement("a");
        link.href = "fill-fridge.html";
        link.textContent = "+ ADD GROCERIES";
        empty.append(link);
      }

      list.append(empty);
    } else {
      visible.forEach(item => {
        list.append(createFoodCard(item));
      });
    }
  }

  /* ---------------------------------------
     FILTER BUTTONS
  --------------------------------------- */

  document.querySelectorAll(
    ".filters [data-filter]"
  ).forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      document.querySelectorAll(
        ".filters [data-filter]"
      ).forEach(btn => {
        const isActive = btn === button;

        btn.classList.toggle(
          "active",
          isActive
        );

        btn.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      });

      render();
    });
  });

  /* ---------------------------------------
     SEARCH + SORT + REFRESH
  --------------------------------------- */

  $("food-search").addEventListener(
    "input",
    render
  );

  $("sort-by").addEventListener(
    "change",
    render
  );

  window.addEventListener(
    "storage",
    render
  );

  window.addEventListener(
    "pageshow",
    render
  );

  // Initial display
  render();

})();
