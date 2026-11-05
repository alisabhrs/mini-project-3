# Proposal: Fresh'd Recipe Matching

## What I am building
I wish I had a tool that looks up recipes and helps me figure out what I can cook with the ingredients I already have at home, while also helping me use food before it expires.

I want to expand my Mini Project 2 website, Fresh'd, by adding a recipe recommendation feature that connects to my existing kitchen inventory.

## Who it is for
Me, and anyone who wants to keep track of their kitchen inventory and figure out what to cook with the ingredients they already have.

I sometimes forget what ingredients I have, especially in the fridge or pantry. Food ends up expiring before I use it, and sometimes I buy things I already have. I also find it annoying when I want to cook something but don't know what to make with the ingredients I already own.

## The API
**API:** TheMealDB

**Documentation:** https://www.themealdb.com/api.php

**Example API URL to open and test:**
https://www.themealdb.com/api/json/v1/1/search.php?s=chicken

**Fields I will use:**

* `idMeal` — recipe ID
* `strMeal` — recipe name
* `strMealThumb` — recipe image
* `strCategory` — food category
* `strIngredient1` to `strIngredient20` — ingredients needed
* `strMeasure1` to `strMeasure20` — ingredient measurements
* `strInstructions` — cooking instructions

I plan to use the API to find recipes and compare their ingredients with the food saved in Fresh'd.

## What the user chooses
I want users to be able to choose an ingredient from their existing inventory to search for recipes.

They should also be able to look through recipe recommendations, see which ingredients they already have, and possibly filter by food category.

## What the page works out
Fresh'd will compare the ingredients needed for each recipe with the ingredients saved in the user's kitchen inventory.

It will calculate a match percentage using:

**Match Score = (Ingredients I have ÷ Total ingredients needed) × 100**

For example, if a recipe requires 5 ingredients and I already have 4, the match score would be 80%.

The website will rank recipes from the highest match percentage to the lowest and show which ingredients are missing.

If possible, I also want it to prioritize recipes that use ingredients that are about to expire, especially when two recipes have similar match scores.

## Features
1. **Kitchen inventory:** Keep track of food in my fridge, freezer, and pantry using my existing Fresh'd website.
2. **Recipe discovery:** Search for recipes using ingredients from my inventory through TheMealDB API.
3. **Recipe match score:** Calculate how many of the required ingredients I already have and show a match percentage.
4. **Missing ingredients:** Show which ingredients I already have and which ones I would need to buy.
5. **Expiration-based recommendations:** Suggest recipes that use ingredients that are close to expiring, if I can get this feature working.

## What I do not know yet
I think the hardest part will be connecting the API to my existing inventory and figuring out how to compare the ingredients in each recipe with what I already have.

I'm also not very familiar with `fetch()`, `await`, and working with JSON data yet, so understanding how to get the API information and display it on the website might be challenging.

I'm also unsure how to handle ingredient names that are slightly different between my inventory and the API, and how to sort recipes based on their match scores.
