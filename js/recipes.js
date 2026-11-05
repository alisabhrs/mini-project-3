/* =========================================
   FRESH'D — WHAT CAN I MAKE?

   How this page works:
   1. Read the user's food from localStorage (via inventory.js).
   2. The user picks ONE ingredient from a dropdown.
   3. fetch() recipes that use that ingredient   (filter.php)
   4. fetch() full details for the first few     (lookup.php)
   5. Compare each recipe's ingredients with the inventory → match score
   6. Sort the recipes and turn them into HTML cards.
========================================= */

const API_URL = "https://www.themealdb.com/api/json/v1/1/";

// Each recipe needs its own lookup request, so we only look up
// this many. 1 search + 8 lookups = at most 9 requests per click.
const MAX_RECIPES = 8;

const form = document.getElementById("recipe-form");
const select = document.getElementById("ingredient-select");
const findButton = document.getElementById("find-button");
const statusBox = document.getElementById("recipe-status");
const results = document.getElementById("recipe-results");


/* -----------------------------------------
   1. INVENTORY
----------------------------------------- */

// All saved food that is NOT expired.
// (Expired food shouldn't be suggested for cooking.)
function getUsableInventory() {
  return window.FreshdInventory.get().filter(item => {
    const days = window.FreshdInventory.daysUntilExpiry(item);
    const isExpired = days !== null && days < 0;
    return item.name && !isExpired;
  });
}

// Sort helper: food expiring soonest comes first.
// Items with no expiration date go to the end.
function bySoonestExpiry(a, b) {
  const daysA = window.FreshdInventory.daysUntilExpiry(a) ?? Infinity;
  const daysB = window.FreshdInventory.daysUntilExpiry(b) ?? Infinity;
  return daysA - daysB;
}

// Fill the dropdown with the user's ingredients.
function fillDropdown(inventory) {
  const sorted = [...inventory].sort(bySoonestExpiry);
  const seen = [];

  sorted.forEach(item => {
    const name = item.name.trim();

    // Skip duplicates ("Eggs" saved twice)
    if (seen.includes(name.toLowerCase())) return;
    seen.push(name.toLowerCase());

    const option = document.createElement("option");
    option.value = name;
    option.textContent = window.FreshdInventory.isUseSoon(item)
      ? `${name} — use soon!`
      : name;

    select.append(option);
  });

  // Pre-select the item that expires soonest, if it has a date.
  if (sorted.length && window.FreshdInventory.daysUntilExpiry(sorted[0]) !== null) {
    select.value = sorted[0].name.trim();
  }
}


/* -----------------------------------------
   2. INGREDIENT MATCHING
----------------------------------------- */

// Make a word singular so "Eggs" matches "Egg".
function singular(word) {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";   // berries → berry
  if (word.endsWith("oes")) return word.slice(0, -2);         // tomatoes → tomato
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);                                 // eggs → egg
  }
  return word;
}

// "  Cherry Tomatoes " → ["cherry", "tomato"]
function toWords(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z]+/)          // split on spaces, commas, dashes…
    .filter(word => word)      // remove empty strings
    .map(singular);
}

// Do these two ingredient names mean the same food?
// Yes if every word of one name appears in the other.
//   "Cheese"  vs "Cheddar Cheese" → true
//   "Egg"     vs "Eggplant"       → false (whole words only)
function namesMatch(inventoryName, recipeName) {
  const a = toWords(inventoryName);
  const b = toWords(recipeName);
  if (a.length === 0 || b.length === 0) return false;

  return a.every(word => b.includes(word)) ||
         b.every(word => a.includes(word));
}

// TheMealDB stores ingredients in 20 separate fields:
// strIngredient1 … strIngredient20 (and strMeasure1 … strMeasure20).
// Turn them into one clean array, skipping empty slots and duplicates.
function getIngredients(meal) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const name = (meal["strIngredient" + i] || "").trim();
    const measure = (meal["strMeasure" + i] || "").trim();

    if (name === "") continue;

    const alreadyAdded = ingredients.some(
      ingredient => ingredient.name.toLowerCase() === name.toLowerCase()
    );
    if (!alreadyAdded) ingredients.push({ name, measure });
  }

  return ingredients;
}

// THE CALCULATION: compare one recipe with the user's inventory.
function scoreRecipe(meal, inventory) {
  const ingredients = getIngredients(meal);
  const have = [];
  const missing = [];
  let useSoonCount = 0;

  ingredients.forEach(ingredient => {
    const owned = inventory.find(item => namesMatch(item.name, ingredient.name));

    if (owned) {
      have.push(ingredient.name);
      if (window.FreshdInventory.isUseSoon(owned)) useSoonCount++;
    } else {
      missing.push(ingredient.name);
    }
  });

  // Match Score = owned ÷ total × 100   (e.g. 4 ÷ 5 × 100 = 80)
  const score = ingredients.length
    ? Math.round((have.length / ingredients.length) * 100)
    : 0;

  return { meal, ingredients, have, missing, score, useSoonCount };
}

// Highest score first. If two scores tie, the recipe that uses
// more "use soon" food wins.
function rankRecipes(scored) {
  return scored.sort((a, b) =>
    b.score - a.score || b.useSoonCount - a.useSoonCount
  );
}


/* -----------------------------------------
   3. TALKING TO THE API
----------------------------------------- */

// Fetch a URL and return its JSON. Throws an Error if anything fails.
async function getJSON(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    // fetch() itself fails when there is no internet connection.
    throw new Error("network");
  }

  // response.ok is false for HTTP errors like 404 or 500.
  if (!response.ok) {
    throw new Error("http " + response.status);
  }

  return response.json();
}

// Recipes that use one ingredient. Only gives id, name and photo.
async function searchByIngredient(name) {
  // TheMealDB uses underscores: "chicken breast" → "chicken_breast"
  const apiName = name.trim().toLowerCase().replace(/\s+/g, "_");
  let data = await getJSON(API_URL + "filter.php?i=" + encodeURIComponent(apiName));

  // Nothing for "eggs"? Try once more with "egg".
  const singularName = toWords(name).join("_");
  if (!Array.isArray(data.meals) && singularName && singularName !== apiName) {
    data = await getJSON(API_URL + "filter.php?i=" + encodeURIComponent(singularName));
  }

  // No results comes back as { meals: null }, so return [] instead.
  return Array.isArray(data.meals) ? data.meals : [];
}

// Full details (ingredients + instructions) for one recipe.
async function lookupRecipe(id) {
  const data = await getJSON(API_URL + "lookup.php?i=" + encodeURIComponent(id));
  return Array.isArray(data.meals) ? data.meals[0] : null;
}


/* -----------------------------------------
   4. SHOWING THINGS ON THE PAGE
----------------------------------------- */

// One message box for the empty, loading, error and invalid states.
function showStatus(type, title, message, links = []) {
  statusBox.replaceChildren();
  if (!type) return;

  const box = document.createElement("div");
  box.className = "status-box status-" + type;

  const heading = document.createElement("h2");
  heading.textContent = title;

  const text = document.createElement("p");
  text.textContent = message;

  box.append(heading, text);

  links.forEach(([href, label]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    box.append(link);
  });

  statusBox.append(box);
}

// Small helper: make a <ul> of tags.
function makeTagList(names, className, emptyText) {
  const list = document.createElement("ul");
  list.className = "tags " + className;

  if (names.length === 0) {
    const item = document.createElement("li");
    item.className = "none";
    item.textContent = emptyText;
    list.append(item);
  }

  names.forEach(name => {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  });

  return list;
}

// Turn one scored recipe into an HTML card.
// We use textContent (never innerHTML) so text from the API
// can't add unexpected HTML to the page.
function createRecipeCard(result) {
  const { meal, ingredients, have, missing, score, useSoonCount } = result;

  const card = document.createElement("article");
  card.className = "recipe-card";

  const image = document.createElement("img");
  image.alt = meal.strMeal;
  image.loading = "lazy";

  // Some API data could be missing a photo; show the Fresh'd logo instead.
  if (meal.strMealThumb) {
    image.src = meal.strMealThumb;
  } else {
    image.src = "images/freshd-logo.png";
    image.className = "no-photo";
  }

  const stamp = document.createElement("p");
  stamp.className = score === 100 ? "match-stamp full" : "match-stamp";
  const scoreText = document.createElement("strong");
  scoreText.textContent = score + "%";
  const stampLabel = document.createElement("span");
  stampLabel.textContent = "MATCH";
  stamp.append(scoreText, stampLabel);

  const body = document.createElement("div");
  body.className = "recipe-body";

  const meta = document.createElement("p");
  meta.className = "recipe-meta";
  meta.textContent = [
    meal.strCategory,
    `${have.length} of ${ingredients.length} ingredients`
  ].filter(Boolean).join(" · ");

  const title = document.createElement("h3");
  title.textContent = meal.strMeal;

  body.append(meta, title);

  if (useSoonCount > 0) {
    const badge = document.createElement("p");
    badge.className = "soon-badge";
    badge.textContent = `USES ${useSoonCount} ITEM${useSoonCount === 1 ? "" : "S"} TO EAT SOON`;
    body.append(badge);
  }

  const haveLabel = document.createElement("p");
  haveLabel.className = "list-label";
  haveLabel.textContent = "YOU HAVE";

  const needLabel = document.createElement("p");
  needLabel.className = "list-label";
  needLabel.textContent = `YOU NEED (${missing.length})`;

  body.append(
    haveLabel,
    makeTagList(have, "have", "None yet"),
    needLabel,
    makeTagList(missing, "need", "Nothing. You have it all!")
  );

  // "Show recipe" fold-out with amounts and instructions
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "SHOW RECIPE ↓";

  const amounts = document.createElement("ul");
  ingredients.forEach(ingredient => {
    const line = document.createElement("li");
    line.textContent = `${ingredient.measure} ${ingredient.name}`.trim();
    amounts.append(line);
  });

  details.append(summary, amounts);

  String(meal.strInstructions || "No instructions provided.")
    .split(/\r?\n/)
    .filter(paragraph => paragraph.trim())
    .forEach(paragraph => {
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      details.append(p);
    });

  body.append(details);
  card.append(image, stamp, body);
  return card;
}

function showRecipes(ranked, ingredientName) {
  results.replaceChildren();

  const note = document.createElement("p");
  note.className = "results-note";
  note.textContent =
    `${ranked.length} RECIPES WITH ${ingredientName.toUpperCase()}, BEST MATCH FIRST. ` +
    "MATCH % COMPARES INGREDIENT NAMES, NOT AMOUNTS.";
  results.append(note);

  ranked.forEach(result => results.append(createRecipeCard(result)));
}


/* -----------------------------------------
   5. WHEN THE USER CLICKS "FIND RECIPES"
----------------------------------------- */

async function findRecipes(ingredientName) {
  // LOADING STATE
  findButton.disabled = true;
  results.replaceChildren();
  showStatus("loading", "Finding recipes…", `Looking for recipes that use ${ingredientName}.`);

  try {
    const matches = await searchByIngredient(ingredientName);

    // EMPTY STATE (no results)
    if (matches.length === 0) {
      showStatus(
        "empty",
        `No recipes found for ${ingredientName}`,
        "TheMealDB doesn't have recipes listed under this ingredient. Try another one from the list."
      );
      return;
    }

    // Look up the first few recipes at the same time.
    // Promise.all waits until every lookup has finished.
    const first = matches.slice(0, MAX_RECIPES);
    const meals = await Promise.all(first.map(meal => lookupRecipe(meal.idMeal)));

    const inventory = getUsableInventory();
    const scored = meals
      .filter(meal => meal)                         // skip any missing recipe
      .map(meal => scoreRecipe(meal, inventory));

    // IN-USE STATE
    showStatus(null);
    showRecipes(rankRecipes(scored), ingredientName);

  } catch (error) {
    // ERROR STATE
    const offline = error.message === "network";
    showStatus(
      "error",
      offline ? "Can't reach the recipe service" : "The recipe service had a problem",
      offline
        ? "Check your internet connection, then press Find Recipes again."
        : `TheMealDB answered with an error (${error.message}). Wait a moment and try again.`
    );
    console.error("Recipe search failed:", error);

  } finally {
    // Runs after success OR error, so the button always comes back.
    findButton.disabled = false;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();   // stop the page from reloading

  const ingredientName = select.value;

  // INVALID INPUT STATE
  if (!ingredientName) {
    results.replaceChildren();
    showStatus("invalid", "Choose an ingredient first", "Pick something from your kitchen in the list, then press Find Recipes.");
    select.focus();
    return;
  }

  findRecipes(ingredientName);
});


/* -----------------------------------------
   6. START
----------------------------------------- */

const startingInventory = getUsableInventory();

if (startingInventory.length === 0) {
  // EMPTY STATE (no inventory)
  findButton.disabled = true;
  showStatus(
    "empty",
    "Your kitchen is empty",
    "Add some food to your fridge or pantry first, and Fresh'd will find recipes that use it.",
    [["fill-fridge.html", "+ FILL FRIDGE ↗"], ["fill-pantry.html", "+ FILL PANTRY ↗"]]
  );
} else {
  // EMPTY STATE (before searching)
  fillDropdown(startingInventory);
  showStatus("empty", "Ready when you are", "Pick an ingredient and press Find Recipes.");
}
