# Fresh'd 🥬 — What Can I Make?
### Know what you have. Use what you love. Waste less.

**Live site:** _TODO: add GitHub Pages URL after deploying_ (e.g. `https://alisabhrs.github.io/freshd-recipe-matching/`)

## What Fresh'd Does
Fresh'd is a kitchen inventory website. You save the food in your fridge, freezer, and pantry, and Fresh'd tracks what is expiring.

The new **What Can I Make?** page uses that inventory to find real recipes from TheMealDB. For each recipe it calculates:
- a **match score**: how many of the recipe's ingredients you already have
- what you **have** and what you still **need**

It ranks the best matches first and favors recipes that use food you should eat soon.

## Who It Is For
People like me who forget what's already in the fridge, buy things twice, or let food expire, and who want ideas for cooking with what they already have.

## API
- **TheMealDB:** https://www.themealdb.com/api.php
- Free test key `1`, so there is no private key to hide.
- Endpoints used:
  - `filter.php?i=<ingredient>`: recipes that use an ingredient
  - `lookup.php?i=<id>`: full recipe with `strIngredient1–20`, `strMeasure1–20`, `strInstructions`

## How to Use It
1. **Fill Fridge** or **Fill Pantry**: add your food, with expiration dates if you know them.
2. **Use By**: see what's expired, what to use soon, and what's still fresh.
3. **What Can I Make?**: pick an ingredient (the one expiring soonest is pre-selected).
   - Tick the **kitchen tools** you own. Fresh'd remembers them.
   - Optionally choose **Use this tool** (e.g. Blender) to see only recipes that use it.
   - Press **Find Recipes**.
4. Read each card's match %, what you have, and what you need. Press **Show recipe** for amounts and steps.

> The match % compares ingredient **names** only. It doesn't check whether you have enough of each.

## How the Match Score Works
`Match % = ingredients you have ÷ ingredients in the recipe × 100`

For example, Spinach Omelette needs Eggs, Spinach, and Feta. You have 2 of the 3, so 2 ÷ 3 × 100 ≈ **67%**.

- **Name matching:**
  - Lowercase and singular ("Eggs" matches "Egg").
  - Whole words only ("Cheese" matches "Cheddar Cheese", but "Egg" doesn't match "Eggplant").
  - Expired food doesn't count.
- **Tools:** TheMealDB doesn't list equipment, so Fresh'd looks for words like "blend" or "bake" in the instructions. It's a best guess.
- **Ranking:** highest % first. On a tie, the recipe that uses more "use soon" food comes first.

## Changes from Mini Project 2
- Fixed: Fill Fridge showed pantry items, could turn them into fridge items, and "Clear All Stock" deleted the pantry.
- Fixed: images were 34 MB, so each page downloaded about 26 MB. Same art, now 3.9 MB total.
- Fixed: the Fill Fridge mode toggle highlighted the wrong button, and the phone nav cut off a sticker.
- Fixed: the homepage receipt totals didn't add up (pantry wasn't listed).
- Removed the empty Buy List, Customize, and About pages from the navigation.

## Where the Agent's Output Differed from My Expectations
_TODO (Alisa): write this in your own words._

## AI Reflection
> *Pick one piece of AI output you did not accept as-is. What did it give you, what did you change, and how did you know it needed changing? Point at the commit.*

_TODO (Alisa): answer truthfully from your own review of the commits._
