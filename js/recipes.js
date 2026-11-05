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
// this many recipes.
const MAX_RECIPES = 8;

// The free API searches ONE ingredient per request, so each pick is
// one search. 5 picks + 8 lookups keeps a click under ~20 requests.
const MAX_PICKS = 5;

const form = document.getElementById("recipe-form");
const ingredientBoxes = document.getElementById("ingredient-checkboxes");
const findButton = document.getElementById("find-button");
const statusBox = document.getElementById("recipe-status");
const results = document.getElementById("recipe-results");
const toolBoxes = document.getElementById("tool-checkboxes");
const toolSelect = document.getElementById("tool-select");

// The last recipes we downloaded. Kept so the page can re-score and
// re-filter them (when tools or inventory change) without fetching again.
let lastMeals = null;
let lastPicks = [];   // the ingredient names used for that search


/* -----------------------------------------
   KITCHEN TOOLS
   TheMealDB has no "equipment" field, so we look for these words in
   each recipe's instructions. It's a best guess, not a guarantee.
----------------------------------------- */

const TOOLS_KEY = "freshd-tools-v1";

const KITCHEN_TOOLS = [
  { id: "stove",      name: "Stove",          words: ["stove", "hob", "saucepan", "frying pan", "pan", "skillet", "wok", "simmer", "boil", "fry", "saute"] },
  { id: "oven",       name: "Oven",           words: ["oven", "bake", "baked", "baking", "roast", "preheat"] },
  { id: "microwave",  name: "Microwave",      words: ["microwave"] },
  { id: "air-fryer",  name: "Air fryer",      words: ["air fryer", "air-fryer", "airfryer"] },
  { id: "blender",    name: "Blender",        words: ["blender", "blend", "blitz", "liquidise", "liquidize", "puree"] },
  { id: "processor",  name: "Food processor", words: ["food processor", "processor"] },
  { id: "mixer",      name: "Mixer",          words: ["mixer", "electric whisk", "beaters"] },
  { id: "slow-cooker", name: "Slow cooker",   words: ["slow cooker", "crockpot", "crock pot"] },
  { id: "grill",      name: "Grill / BBQ",    words: ["barbecue", "bbq", "grill"] }
];

// Which tools the user said they own, e.g. ["stove", "blender"]
function loadMyTools() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOOLS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveMyTools(ids) {
  try {
    localStorage.setItem(TOOLS_KEY, JSON.stringify(ids));
  } catch {
    // If storage is full the choice just isn't remembered.
  }
}

function toolName(id) {
  const tool = KITCHEN_TOOLS.find(tool => tool.id === id);
  return tool ? tool.name : id;
}

// "Oven" → "an Oven", "Blender" → "a Blender"
function withArticle(name) {
  return (/^[aeiou]/i.test(name) ? "an " : "a ") + name;
}

// Read a recipe's instructions and return the tool ids it mentions.
// \b means "word boundary", so "pan" does not match "pancake".
function detectTools(meal) {
  const text = String(meal.strInstructions || "").toLowerCase();

  return KITCHEN_TOOLS
    .filter(tool => tool.words.some(word =>
      new RegExp("\\b" + word + "\\b").test(text)
    ))
    .map(tool => tool.id);
}

// Build the "What tools do you have?" checkboxes.
function buildToolCheckboxes() {
  const myTools = loadMyTools();

  KITCHEN_TOOLS.forEach(tool => {
    const label = document.createElement("label");
    label.className = "tool-option";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = tool.id;
    box.checked = myTools.includes(tool.id);

    label.append(box, tool.name);
    toolBoxes.append(label);
  });

  // When a box changes: save, update the "Use this tool" list,
  // and redraw any recipes already on screen.
  toolBoxes.addEventListener("change", () => {
    const checked = [...toolBoxes.querySelectorAll("input:checked")]
      .map(box => box.value);

    saveMyTools(checked);
    fillToolDropdown();
    renderResults();
  });

  fillToolDropdown();
}

// "Use this tool" only lists the tools the user owns.
function fillToolDropdown() {
  const myTools = loadMyTools();
  const previous = toolSelect.value;

  toolSelect.replaceChildren(new Option("Any tool", ""));

  KITCHEN_TOOLS
    .filter(tool => myTools.includes(tool.id))
    .forEach(tool => toolSelect.append(new Option(tool.name, tool.id)));

  // Keep the old choice if that tool is still owned.
  toolSelect.value = myTools.includes(previous) ? previous : "";
}


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

// One checkbox "pill" per ingredient in the inventory.
// keepChecked = names that were ticked before, so a refresh doesn't lose them.
function fillIngredientChoices(inventory, keepChecked) {
  const sorted = [...inventory].sort(bySoonestExpiry);
  const seen = [];

  ingredientBoxes.replaceChildren();

  sorted.forEach(item => {
    const name = item.name.trim();

    // Skip duplicates ("Eggs" saved twice)
    if (seen.includes(name.toLowerCase())) return;
    seen.push(name.toLowerCase());

    const label = document.createElement("label");
    label.className = "tool-option";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = name;
    box.checked = keepChecked.includes(name);

    const text = window.FreshdInventory.isUseSoon(item) ? `${name} (use soon!)` : name;
    label.append(box, text);
    ingredientBoxes.append(label);
  });

  // Nothing ticked yet? Tick the item that expires soonest, if it has a date.
  const first = ingredientBoxes.querySelector("input");
  if (getPicks().length === 0 && first &&
      window.FreshdInventory.daysUntilExpiry(sorted[0]) !== null) {
    first.checked = true;
  }
}

// The ingredient names the user ticked, e.g. ["Eggs", "Spinach"]
function getPicks() {
  return [...ingredientBoxes.querySelectorAll("input:checked")].map(box => box.value);
}

// ["eggs"] → "eggs",  ["eggs", "spinach", "feta"] → "eggs, spinach and feta"
function listText(names) {
  if (names.length <= 1) return names.join("");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
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
function scoreRecipe(meal, inventory, picks = []) {
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

  const tools = detectTools(meal);

  // How many of the ingredients the user ticked does this recipe use?
  const picksUsed = picks.filter(pick =>
    ingredients.some(ingredient => namesMatch(pick, ingredient.name))
  ).length;

  return { meal, ingredients, have, missing, score, useSoonCount, tools, picksUsed };
}

// Highest score first. If two scores tie, the recipe that uses more of
// your picked ingredients wins; if that ties too, more "use soon" food wins.
// ( || means: "if the first difference is 0, use the next one" )
function rankRecipes(scored) {
  return scored.sort((a, b) =>
    b.score - a.score ||
    b.picksUsed - a.picksUsed ||
    b.useSoonCount - a.useSoonCount
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
  const { meal, ingredients, have, missing, score, useSoonCount, tools, picksUsed } = result;

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

  // Only worth saying when more than one ingredient was picked.
  if (lastPicks.length > 1) {
    const picksLine = document.createElement("p");
    picksLine.className = "recipe-meta";
    picksLine.textContent = `USES ${picksUsed} OF YOUR ${lastPicks.length} PICKS`;
    body.append(picksLine);
  }

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

  // TOOLS: what the instructions mention. If the user has ticked
  // their tools, flag the ones they don't own.
  const myTools = loadMyTools();
  const toolLabel = document.createElement("p");
  toolLabel.className = "list-label";
  toolLabel.textContent = "TOOLS MENTIONED";

  const toolList = makeTagList([], "tools", "None mentioned");
  if (tools.length) toolList.replaceChildren();

  tools.forEach(id => {
    const item = document.createElement("li");
    const dontOwn = myTools.length > 0 && !myTools.includes(id);
    item.textContent = dontOwn ? `${toolName(id)} (you don't have)` : toolName(id);
    if (dontOwn) item.className = "no-tool";
    toolList.append(item);
  });

  body.append(toolLabel, toolList);

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

// Score, rank, filter by tool, and draw the last downloaded recipes.
// Called after a search AND whenever tools or inventory change,
// so the page stays up to date without fetching again.
function renderResults() {
  if (!lastMeals) return;

  const inventory = getUsableInventory();
  const ranked = rankRecipes(lastMeals.map(meal => scoreRecipe(meal, inventory, lastPicks)));

  // "Use this tool": keep only recipes whose instructions mention it.
  const chosenTool = toolSelect.value;
  const visible = chosenTool
    ? ranked.filter(result => result.tools.includes(chosenTool))
    : ranked;

  results.replaceChildren();

  // EMPTY STATE (no recipes use the chosen tool)
  if (visible.length === 0) {
    showStatus(
      "empty",
      `No ${listText(lastPicks)} recipes mention ${withArticle(toolName(chosenTool)).toLowerCase()}`,
      `We checked ${ranked.length} recipes. Choose "Any tool" or another tool to see more.`
    );
    return;
  }

  // IN-USE STATE
  showStatus(null);

  const note = document.createElement("p");
  note.className = "results-note";
  note.textContent =
    `${visible.length} RECIPE${visible.length === 1 ? "" : "S"} WITH ${listText(lastPicks).toUpperCase()}` +
    (chosenTool ? ` USING ${withArticle(toolName(chosenTool)).toUpperCase()}` : "") +
    ", BEST MATCH FIRST. MATCH % COMPARES INGREDIENT NAMES, NOT AMOUNTS.";
  results.append(note);

  visible.forEach(result => results.append(createRecipeCard(result)));
}


/* -----------------------------------------
   5. WHEN THE USER CLICKS "FIND RECIPES"
----------------------------------------- */

// Search every picked ingredient and combine the answers.
// Returns recipes ordered so the ones found by MORE picks come first.
// Example: picks = Eggs, Spinach
//   Eggs search    → Omelette, Quiche, Pancakes
//   Spinach search → Omelette, Saag
//   Omelette was found twice, so it goes first.
async function searchAllPicks(picks) {
  // One search per pick, all running at the same time.
  const lists = await Promise.all(picks.map(searchByIngredient));

  const timesFound = {};   // idMeal → how many searches found it
  const combined = [];     // each recipe once, in the order first seen

  lists.forEach(list => {
    list.forEach(meal => {
      if (!timesFound[meal.idMeal]) {
        timesFound[meal.idMeal] = 0;
        combined.push(meal);
      }
      timesFound[meal.idMeal]++;
    });
  });

  return combined.sort((a, b) => timesFound[b.idMeal] - timesFound[a.idMeal]);
}

async function findRecipes(picks) {
  // LOADING STATE
  findButton.disabled = true;
  lastMeals = null;
  results.replaceChildren();
  showStatus("loading", "Finding recipes…", `Looking for recipes that use ${listText(picks)}.`);

  try {
    const matches = await searchAllPicks(picks);

    // EMPTY STATE (no results)
    if (matches.length === 0) {
      showStatus(
        "empty",
        `No recipes found for ${listText(picks)}`,
        "TheMealDB doesn't have recipes listed under " +
        (picks.length > 1 ? "these ingredients" : "this ingredient") +
        ". Try picking something else."
      );
      return;
    }

    // Look up the first few recipes at the same time.
    // Promise.all waits until every lookup has finished.
    const first = matches.slice(0, MAX_RECIPES);
    const meals = await Promise.all(first.map(meal => lookupRecipe(meal.idMeal)));

    // Remember these so tool/inventory changes can redraw them.
    lastMeals = meals.filter(meal => meal);        // skip any missing recipe
    lastPicks = picks;
    renderResults();

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

  const picks = getPicks();

  // INVALID INPUT STATE: nothing picked, or too many
  if (picks.length === 0 || picks.length > MAX_PICKS) {
    lastMeals = null;
    results.replaceChildren();
    showStatus(
      "invalid",
      picks.length === 0 ? "Choose an ingredient first" : `Pick up to ${MAX_PICKS} ingredients`,
      picks.length === 0
        ? "Tick at least one food from your kitchen, then press Find Recipes."
        : `You picked ${picks.length}. Untick a few, then press Find Recipes.`
    );
    ingredientBoxes.querySelector("input")?.focus();
    return;
  }

  findRecipes(picks);
});


/* -----------------------------------------
   6. START
----------------------------------------- */

// Read the inventory and (re)build the ingredient list.
// Runs on load, when you come back to this page, and when the
// inventory changes in another tab, so the list is never out of date.
function setUpIngredients() {
  const inventory = getUsableInventory();
  const previousPicks = getPicks();

  if (inventory.length === 0) {
    ingredientBoxes.replaceChildren();
    // EMPTY STATE (no inventory)
    findButton.disabled = true;
    lastMeals = null;
    results.replaceChildren();
    showStatus(
      "empty",
      "Your kitchen is empty",
      "Add some food to your fridge or pantry first, and Fresh'd will find recipes that use it.",
      [["fill-fridge.html", "+ FILL FRIDGE ↗"], ["fill-pantry.html", "+ FILL PANTRY ↗"]]
    );
    return;
  }

  findButton.disabled = false;

  // Rebuild the pills, keeping ticks on food that's still in the kitchen.
  fillIngredientChoices(inventory, previousPicks);

  if (lastMeals) {
    renderResults();   // re-score the recipes on screen with the new inventory
  } else {
    // EMPTY STATE (before searching)
    showStatus("empty", "Ready when you are", "Pick one or more ingredients and press Find Recipes.");
  }
}

buildToolCheckboxes();
toolSelect.addEventListener("change", renderResults);

setUpIngredients();
window.addEventListener("pageshow", event => {
  if (event.persisted) setUpIngredients();   // came back with the Back button
});
window.addEventListener("storage", event => {
  if (event.key === window.FreshdInventory.key) setUpIngredients();
});
