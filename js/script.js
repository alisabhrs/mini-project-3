
/* =========================================
   FRESH'D — HOMEPAGE JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------
     INTERACTIVE FRIDGE
  --------------------------------------- */

  const fridgeButton = document.getElementById(
    "home-fridge-button"
  );

  const fridgeImage = document.getElementById(
    "home-fridge-image"
  );

  const fridgeHint = document.querySelector(
    ".home-fridge-hint"
  );

  let fridgeOpen = false;

  if (fridgeButton && fridgeImage) {

    fridgeButton.addEventListener("click", () => {

      fridgeOpen = !fridgeOpen;

      // Change fridge image
      fridgeImage.src = fridgeOpen
        ? "images/fridge-opened.png"
        : "images/fridge-closed.png";

      // Accessibility
      fridgeButton.setAttribute(
        "aria-expanded",
        String(fridgeOpen)
      );

      fridgeButton.setAttribute(
        "aria-label",
        fridgeOpen
          ? "Close refrigerator"
          : "Open refrigerator"
      );

      fridgeImage.alt = fridgeOpen
        ? "Open silver refrigerator"
        : "Closed silver refrigerator";

      // Update instruction
      if (fridgeHint) {
        fridgeHint.textContent = fridgeOpen
          ? "↖ CLICK THE FRIDGE TO CLOSE IT"
          : "↖ CLICK THE FRIDGE TO OPEN IT";
      }

    });

  }

  /* ---------------------------------------
     SHARED GROCERY INVENTORY
  --------------------------------------- */

  function getInventory() {

    // Use the same inventory as Fill Fridge
    if (
      window.FreshdInventory &&
      typeof window.FreshdInventory.get === "function"
    ) {
      return window.FreshdInventory.get();
    }

    // Fallback if inventory.js is unavailable
    try {
      const saved = JSON.parse(
        localStorage.getItem("freshd-inventory-v1")
      );

      return Array.isArray(saved) ? saved : [];

    } catch (error) {
      console.error(
        "Could not load Fresh'd inventory:",
        error
      );

      return [];
    }
  }

  /* ---------------------------------------
     UPDATE KITCHEN RECEIPT
  --------------------------------------- */

  function updateKitchenReceipt() {

    const items = getInventory();

    const fridgeItems = items.filter(item =>
      String(item.storage || "").toLowerCase() === "fridge"
    );

    const freezerItems = items.filter(item =>
      String(item.storage || "").toLowerCase() === "freezer"
    );

    const fridgeCount = document.getElementById(
      "home-fridge-count"
    );

    const freezerCount = document.getElementById(
      "home-freezer-count"
    );

    const totalCount = document.getElementById(
      "home-total-count"
    );

    if (fridgeCount) {
      fridgeCount.textContent = fridgeItems.length;
    }

    if (freezerCount) {
      freezerCount.textContent = freezerItems.length;
    }

    if (totalCount) {
      totalCount.textContent = items.length;
    }

  }

  // Update when homepage first loads
  updateKitchenReceipt();

  // Update when returning to homepage
  window.addEventListener(
    "pageshow",
    updateKitchenReceipt
  );

  // Update if inventory changes in another tab
  window.addEventListener(
    "storage",
    updateKitchenReceipt
  );

});
