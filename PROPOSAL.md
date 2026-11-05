# Mini Project 3 Proposal: Fresh'd — What Can I Make?

> **DRAFT. Alisa: rewrite this in your own words before submitting.**
> Sentences marked ✍️ are copied or adapted from your Mini Project 2 proposal and README.
> Items marked 🔎 must be checked by you in the browser before this is final.

## What I Am Building
✍️ Fresh'd is my kitchen inventory website that helps me keep track of the food I have in my fridge, freezer, and pantry, and know what to use before it expires.

For Mini Project 3 I am adding **What Can I Make?**. It takes the ingredients already saved in Fresh'd, finds real recipes from an API, and works out how much of each recipe I can already make with what I have.

## Who It Is For
✍️ This is for people like me who sometimes forget what food they already have in their fridge. It can be annoying to buy something twice or find ingredients that have already expired.

It is also for anyone who opens the fridge and doesn't know what to cook with what's inside.

## API
- **Name:** TheMealDB (free test key `1`, no private API key needed)
- **Documentation:** https://www.themealdb.com/api.php
- **Tested URLs** 🔎 (open these and confirm the response):
  - https://www.themealdb.com/api/json/v1/1/filter.php?i=egg
  - https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772
- **Fields I use:**
  - From `filter.php`: `idMeal`, `strMeal`, `strMealThumb`
  - From `lookup.php`: `strMeal`, `strMealThumb`, `strCategory`, `strInstructions`, `strIngredient1` to `strIngredient20`, `strMeasure1` to `strMeasure20`

## What the User Chooses
The user picks one ingredient from their own Fresh'd inventory, such as spinach. Fresh'd pre-selects the item that expires soonest.

## What the Page Calculates
For each recipe:

**Match score = ingredients I have ÷ ingredients the recipe needs × 100**

Recipes are ranked from highest to lowest match. If two recipes tie, the one that uses more of my "use soon" food comes first.

The score only compares ingredient names. It does not check whether I have enough of each one.

## Features
1. **Kitchen Inventory:** keep track of fridge, freezer, and pantry food (from Mini Project 2).
2. **Recipe Discovery:** find real recipes from TheMealDB using an ingredient I own.
3. **Ingredient Match Score:** a percentage for how much of the recipe I already have.
4. **Have / Missing Ingredients:** see exactly what I still need to buy.
5. **Expiration-Aware Ranking:** food that expires soon is suggested first and breaks ties.

## What I Do Not Know Yet
- Whether TheMealDB's ingredient names will match the names I type in Fresh'd ("Eggs" vs "Egg").
- How to wait for several recipe requests at the same time without making the page slow.
- How to show a helpful error when the internet is off.
- 🔎 Whether the free API can search for more than one ingredient at once. I think it can't, so I plan to search one ingredient at a time.
