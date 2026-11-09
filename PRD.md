# Fresh'd — Product Requirements Document (Mini Project 3)

## 1. Project Goal
Turn Fresh'd from a kitchen inventory tracker into an inventory **and** recipe discovery site. Using an ingredient the user already owns, Fresh'd fetches real recipes from TheMealDB and calculates how closely each one matches the user's inventory.

## 2. Target Users
- People who forget what is already in their kitchen and let food expire.
- People who want ideas for cooking with what they already have before shopping.

## 3. Core Features
| # | Feature | Source |
|---|---|---|
| 1 | Kitchen Inventory (fridge, freezer, pantry) | Existing (MP2) |
| 2 | Recipe Discovery via TheMealDB | New |
| 3 | Ingredient Match Score | New, calculated in JavaScript |
| 4 | Have / Missing ingredients | New, calculated in JavaScript |
| 5 | Expiration-aware ranking | New, calculated in JavaScript |

## 4. User Interactions (What Can I Make? page)
1. The page reads the inventory from `localStorage` (key `freshd-inventory-v1`).
2. The user's inventory items appear as tick-box pills, and the user can pick **1 to 5**. Expired items are left out. The item that expires soonest is pre-ticked, and use-soon items are labelled.
3. The user presses **Find Recipes**.
4. Results appear as ranked recipe cards. Each card can be expanded to read the instructions.
5. **Kitchen tools:** the user ticks the tools they own (stove, oven, microwave, air fryer, blender, food processor, mixer, slow cooker, grill/BBQ). The choice is saved in `localStorage` (`freshd-tools-v1`).
6. **Use this tool:** the user can pick one of their tools. Only recipes whose instructions mention it are shown.
7. **Live inventory:** the ingredient list and on-screen recipes update when the inventory changes, either in another tab or when returning with the Back button.

## 5. API Integration
- Base URL: `https://www.themealdb.com/api/json/v1/1/`. Free test key `1`, nothing secret.
- **Step A:** `filter.php?i=<ingredient>`, with spaces replaced by `_`. One request **per picked ingredient**, run at the same time. The free API filters one ingredient at a time; multi-ingredient filtering is premium. Results are combined, removing duplicates, and recipes found by more picks come first. Returns `{ meals: [{ idMeal, strMeal, strMealThumb }] }`, or `{ meals: null }` when nothing is found.
- **Step B:** for at most **8** of those meals, `lookup.php?i=<idMeal>`. Returns the full meal with `strCategory`, `strInstructions`, `strIngredient1–20`, `strMeasure1–20`.
- The Step B requests run at the same time with `Promise.all`. With 5 picks, one search makes at most about 18 requests: up to 2 per pick, counting the plural retry, plus 8 lookups.
- If the plural ingredient name finds nothing ("eggs"), the page retries once with the singular ("egg").
- Every `fetch` is inside `try/catch` and checks `response.ok`.
- The premium multi-ingredient filter (`i=a,b`) is not used.

## 6. Recipe Matching Logic
1. **Clean each recipe ingredient:** trim spaces, lowercase, skip empty or `null` slots, remove duplicates.
2. **Clean each inventory name the same way.** A trailing "s" is dropped so that "Eggs" matches "Egg".
3. **Owned check:** a recipe ingredient counts as owned when every word of the inventory name appears as a whole word in the recipe ingredient, or the other way round.
   - Example: "cheese" matches "Cheddar Cheese".
   - Example: "egg" does **not** match "Eggplant".
4. **Match score** = `Math.round(owned / total × 100)`.
5. **Tools:** TheMealDB has no equipment field, so tools are detected by whole-word keywords in `strInstructions` ("blend" → Blender, "bake"/"preheat" → Oven). It's a best guess. Cards list the tools mentioned and flag ones the user doesn't own.
6. **Sort:** highest score first. On a tie, the recipe that uses more of the user's picks comes first. If that also ties, the recipe using more "use soon" items comes first.
7. **Labels:** the card states "4 of 5 ingredients", lists have and missing items, and says this is a name match, not a quantity check.

## 7. Required Interface States
| State | When | What the user sees |
|---|---|---|
| Empty (no inventory) | Inventory has no usable items | Message plus a link to Fill Fridge / Fill Pantry. Search button disabled |
| Empty (before search) | Page first loads | "Pick an ingredient and press Find Recipes" |
| Empty (no results) | API returns `meals: null` | "No recipes use ___. Try another ingredient." |
| Loading | Requests in progress | "Finding recipes…" message. Button disabled |
| Error | Offline, network failure, or `!response.ok` | Plain-language message plus "check your connection and try again". Button re-enabled |
| Invalid input | User submits with no ingredient ticked, or more than 5 | "Choose an ingredient first." or "Pick up to 5 ingredients." Focus moves to the first ingredient |
| Empty (no recipes with chosen tool) | None of the looked-up recipes mention the chosen tool | "No eggs recipes mention a blender." Suggests "Any tool" |
| In use | Recipes found | Ranked recipe cards with score, have/missing lists, and instructions |

## 8. Functional Requirements
- FR1: Inventory pages keep working as in MP2, with the bug fixes listed in the README.
- FR2: Fill Fridge shows and edits fridge/freezer items only. Pantry items stay on Fill Pantry.
- FR3: The recipe page never changes the inventory.
- FR4: All rendering uses `textContent` / `createElement`, so API text cannot inject HTML.
- FR5: The page works at 360px width with no horizontal scrolling.
- FR6: Plain HTML, CSS, and JavaScript. No frameworks, libraries, or CDNs.

## 9. Scope Limitations (not in this version)
- Category filter, free-text recipe search. Recipes are only found through the user's picked ingredients.
- Quantity or unit checking.
- Adding missing ingredients to Buy List.
- Buy List, Customize, and About pages. They were empty in MP2 and are removed from the navigation.
