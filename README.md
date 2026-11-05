# Fresh'd 🥬
### Your Fridge, Your Food, Your Rules.

## About the Project

Fresh'd is a grocery inventory management website designed to help users organize their groceries, keep track of what they already have, and reduce food waste.

I created Fresh'd because I wanted a simple way to remember what was in my fridge, freezer, and pantry without having to check everything manually.

The goal is to make grocery organization more convenient, practical, and visually engaging.

## Features

- **Fill Fridge:** Add groceries with their names, categories, quantities, storage locations, and dates.
- **Fill Pantry:** Organize pantry items.
- **Use By:** Track expiration dates and see which groceries are expired, expiring soon, or still fresh.
- **Buy List:** Keep track of groceries to purchase.
- **Customize:** Personalize the Fresh'd experience.
- **Interactive Homepage:** Open and close the refrigerator and view a summary of saved groceries.

## How to Use Fresh'd

1. Open the Fresh'd website.
2. Go to **Fill Fridge** to add groceries.
3. Enter the food name, quantity, category, storage location, and date.
4. Save the grocery item to your inventory.
5. Visit **Use By** to see which groceries need attention.
6. Use the search, filter, and sorting options to organize your food.
7. Visit **Buy List** to manage groceries you need to purchase.

## How It Works

Fresh'd is built using:

- HTML for the website structure
- CSS for styling, layout, and animations
- JavaScript for interactions and calculations
- localStorage for saving user data

The website stores grocery information as JavaScript objects in an array.

Each grocery item contains information such as its name, category, quantity, storage location, and date.

JavaScript uses this information to calculate freshness statuses and update the displayed inventory.

The inventory is saved in localStorage, allowing users to keep their groceries after refreshing the page.

Data is stored locally in the user's browser rather than in an external database.

## Design Direction

I wanted Fresh'd to feel like a vintage grocery store instead of a traditional productivity website.

The design includes:

- Black backgrounds
- Olive-green, cream, and red accents
- Bold typography
- Fruit-inspired navigation stickers
- Grocery receipt-style layouts
- Interactive refrigerator illustrations
- Playful animations and hover effects

My goal was to make grocery management feel more enjoyable while keeping the website functional and easy to navigate.

## AI Collaboration and Revisions

I used AI assistance throughout the development process for HTML, CSS, JavaScript, and debugging.

One AI-generated solution I did not accept as-is was the original connection between the Fill Fridge and Use By pages.

Initially, groceries saved in Fill Fridge were not appearing correctly in Use By.

I reviewed the JavaScript and revised the inventory connection so both pages would read from the same localStorage key:

`freshd-inventory-v1`

This change was necessary because Use By needed to display and calculate freshness information using the groceries actually saved by the user.

To verify the change, I tested adding groceries in Fill Fridge and checking whether the saved items appeared correctly in Use By.

**Git commit showing this revision:** [ADD COMMIT LINK HERE]

## What Changed From My Original Expectations

Originally, I expected connecting different pages to be relatively straightforward.

However, I learned that different pages need consistent data structures and storage keys to share information correctly.

I also learned that debugging requires understanding how JavaScript stores, retrieves, and updates data, rather than focusing only on the visual interface.

## Project Links

https://github.com/alisabhrs/mini-project-2.git