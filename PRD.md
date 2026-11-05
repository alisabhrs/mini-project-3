
# Fresh'd — Product Requirements Document

## 1. Product Overview

Fresh'd is an interactive virtual refrigerator that helps users track, organize, and manage their food inventory.

Instead of using a traditional list or spreadsheet, users interact with a realistic refrigerator in a kitchen. They can open the fridge, add food, organize products on shelves, and track expiration dates.

## 2. Problem

People often forget what food they have, where they stored it, or when it expires. This can lead to duplicate purchases, wasted food, and unnecessary spending.

Fresh'd makes food inventory management more visual, personalized, and enjoyable.

## 3. Target Users

- Students living in dorms or apartments
- People who share refrigerators with roommates
- People who want to reduce food waste
- Anyone who wants a more organized kitchen

## 4. Core Features

### Interactive Refrigerator
- Display a realistic French-door refrigerator inside a cozy kitchen.
- Users can click the refrigerator doors to open and close them.
- The interior contains shelves, door compartments, and drawers.
- A separate freezer drawer can be opened.

### Food Inventory
- Add food using a form.
- Enter the food name, quantity, expiration date, and storage location.
- Display food items visually inside the refrigerator.
- Edit or delete existing items.
- Organize food by shelf or compartment.

### Expiration Tracking
- Calculate the number of days until each product expires.
- Highlight items expiring within three days.
- Identify products that have already expired.
- Display a summary of total items and items expiring soon.

### Customization
- Add decorative magnets to the refrigerator doors.
- Move magnets around the fridge.
- Allow users to personalize their fridge layout.

### Data Storage
- Store inventory in a JavaScript array of objects.
- Save user-created data using localStorage.
- Restore saved data when the website is reopened.

## 5. JavaScript State

Each food item will contain:

- ID
- Name
- Quantity
- Expiration date
- Storage location

The application also remembers:
- Whether the refrigerator is open or closed
- Refrigerator decorations
- Shelf organization

## 6. User Interactions

1. Open/close fridge: Changes the visible refrigerator view.
2. Add food: Creates a new inventory item and updates the display.
3. Edit food: Changes the selected item's stored information.
4. Delete food: Removes an item and updates inventory totals.
5. Change location: Moves a food item to another compartment.
6. Reset inventory: Clears stored food and returns to the empty state.

## 7. Calculated Outputs

Fresh'd automatically calculates:

- Total number of food items
- Number of items expiring within three days
- Number of expired items
- Number of items in each storage compartment

These values update whenever inventory data changes.

## 8. Interface States

### Empty State
The user sees a closed refrigerator in a kitchen. Opening it reveals empty shelves and a message encouraging them to add their first food item.

Inventory counts display zero.

### Invalid Input State
The website displays an inline error message when:
- The food name is empty.
- Quantity is zero or negative.
- The expiration date is missing or invalid.
- A storage location is not selected.

The user can correct the information without losing their other inputs.

### In-Use State
Food products appear in their selected compartments. Users can edit, delete, or move items.

Inventory totals and expiration reminders update automatically.

### Reset State
A reset button asks for confirmation before clearing the inventory.

After resetting, the fridge returns to its empty state without reloading the page.

## 9. Visual Design

The website will have a realistic, immersive, and playful design.

- Cozy kitchen background
- Stainless steel French-door refrigerator
- Smooth refrigerator-opening animation
- Warm neutral colors with sage green accents
- Customizable magnets and decorations
- Realistic food illustrations or images
- Minimal navigation and clean typography

The refrigerator will be the main visual focus.

## 10. Technical Requirements

- HTML for structure
- CSS for styling and animations
- Vanilla JavaScript for interactions and state
- localStorage for saving data
- No frameworks, external libraries, APIs, or server
- Responsive layout for desktop and mobile
- Semantic HTML and accessible controls
- Deployment through GitHub Pages

## 11. Minimum Viable Product (MVP)

The first working version will include:

1. A clickable refrigerator that opens and closes.
2. A refrigerator interior with multiple storage locations.
3. A form for adding food with quantity and expiration date.
4. Editing, deleting, and moving food between compartments.
5. Automatic inventory counts and expiration reminders.
6. localStorage persistence.
7. A reset button and input validation.

Advanced drag-and-drop, multiple refrigerator models, and extensive magnet customization can be added after the core features work.

## 12. Success Criteria

The project is successful when users can:

- Open the virtual fridge.
- Add and organize their food.
- See which products are expiring soon.
- Edit and remove products.
- Refresh the page without losing their inventory.
- Reset the inventory without refreshing.
- Use the website on desktop and mobile.


## Grocery Basket — Update My Fridge

Fresh'd will have a separate "Update My Fridge" tab.

The page asks users, "What did you just buy today?"

Users can:
- Add newly purchased groceries to a virtual basket.
- Enter product names, quantities, and expiration dates.
- Select where each product should be stored.
- Review, edit, or remove groceries before confirming.
- Click "Put Groceries in My Fridge" to transfer all basket items into their fridge inventory.

After confirmation:
- The grocery basket becomes empty.
- New groceries appear in the virtual refrigerator.
- Inventory counts and expiration reminders update.
- The updated inventory is saved using localStorage.

The grocery basket acts as a temporary shopping session, while My Fridge displays the user's saved food inventory.


## Updated Website Structure and Features

Fresh'd has five connected experiences:

### 1. Home
- Black background with a centered silver French-door fridge.
- Fresh'd logo centered above the refrigerator.
- Four vintage fruit sticker navigation buttons.
- Clicking the fridge opens and closes its doors.
- Scrolling down may reveal a short tutorial.
- On other pages, the stickers shrink into a top navigation bar.

### 2. Customize
- Users decorate the outside of their refrigerator.
- Choose from stickers, magnets, notes, receipts, and photo booth strips.
- Drag decorations onto the fridge and reposition or remove them.
- Save decoration positions using localStorage.
- Custom photo uploads are a future enhancement.

### 3. Use By
Users manually record food products with:
- Product name (required)
- Brand (optional)
- Quantity (required)
- Storage location: Fridge, Freezer, Pantry, or Other
- Custom storage name if Other is selected
- Expiration date, purchase date, or no date
- Optional product illustration

The website calculates:
- Days until expiration, when an expiration date exists
- Which products expire soon
- Which products are already expired
- Total inventory count

Purchase dates are not treated as expiration dates.

### 4. Fill Fridge
- Displays products already recorded in Use By.
- Users organize food on virtual refrigerator shelves.
- Includes fridge and freezer compartments.
- Users can move items between compartments.
- Shelf assignments are saved.
- Pantry and Other products remain in the inventory but do not appear inside the fridge.

### 5. Buy List
- Users manually add items they need to purchase.
- Users can add products from their inventory to the shopping list.
- Users can check off and remove shopping list items.
- The shopping list is saved using localStorage.

## Shared Data

All sections use the same saved inventory.

Adding, editing, or removing food in Use By updates the inventory shown in Fill Fridge.

Expiration information is calculated from saved dates.

Buy List can reference existing inventory products without creating duplicate inventory entries.

## Required Interface States

### Empty
Show an empty fridge, an empty inventory list, and helpful prompts.

### Invalid Input
Show inline errors for missing product names, invalid quantities, or missing custom storage locations.

### In Use
Show saved groceries, shelf locations, expiration statuses, and shopping list items.

### Reset
Allow users to clear saved inventory and return to the empty state without refreshing.

## Development Priorities

### Required for First Working Version
1. Shared JavaScript inventory state
2. Add, edit, and remove groceries
3. Expiration date calculations
4. Organize groceries by fridge compartment
5. Buy List interactions
6. localStorage persistence
7. Input validation and reset
8. Responsive layout

### Visual Enhancements
1. Realistic opening refrigerator
2. Sticker navigation animation
3. Draggable refrigerator decorations
4. More food illustrations
5. Custom image uploads
6. Homepage tutorial
