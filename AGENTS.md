
# Fresh'd — AI Coding Instructions

## Project Overview

Fresh'd is an interactive food inventory website that helps users organize their groceries, track expiration dates, customize their refrigerator, and create shopping lists.

The website should feel like a chic, modern editorial experience with playful vintage grocery-inspired details.

## Technology Requirements

- Use HTML5, CSS3, and vanilla JavaScript only.
- Do not use React, Vue, Bootstrap, Tailwind, or other frameworks.
- Do not use external APIs, libraries, or CDNs.
- Use localStorage to save user data.
- The website must work on GitHub Pages.
- Use relative file paths.
- Keep HTML, CSS, and JavaScript organized and readable.
- Use semantic HTML and accessible controls.
- Make the website responsive.

## Branding and Visual Design

Follow DESIGN.md for detailed visual guidance.

- Preserve the original Canva homepage composition.
- Use a black or charcoal background.
- Center a large stainless-steel French-door refrigerator.
- Place the Fresh'd logo above the refrigerator.
- Use four vintage fruit sticker navigation buttons:
  - Fill Fridge: yellow lemon
  - Buy List: blue blueberries
  - Customize: red tomato
  - Use By: green melon
- Use cream, olive green, dark red, brown, and silver accents.
- Keep the interface minimal, editorial, playful, and sophisticated.
- Avoid childish illustrations, excessive decorations, and generic dashboard styling.
- Use the existing Fresh'd logo in images/freshd-logo.png.

## Homepage and Navigation

- The homepage features a closed refrigerator.
- The refrigerator fades in and gently zooms forward when the page loads.
- Clicking the refrigerator should open or close it.
- The four fruit stickers act as navigation buttons.
- On other pages, the stickers become a compact top navigation bar.
- Clicking the Fresh'd logo returns to the homepage.
- Keep navigation transitions smooth and subtle.
- Respect prefers-reduced-motion.

## Website Sections

### Home
- Show the original refrigerator hero composition.
- Provide clear navigation to the four tools.
- A short tutorial section may appear below the hero.

### Customize
- Let users decorate the exterior of the refrigerator.
- Provide stickers, magnets, notes, receipts, and photo booth strips.
- Allow users to add, move, and remove decorations.
- Save customization data in localStorage.
- Custom photo uploads are optional enhancements.

### Use By
- Allow users to add, edit, and delete grocery items.
- Require a product name and valid quantity.
- Make brand optional.
- Include storage options: Fridge, Freezer, Pantry, Other.
- Show a custom location field when Other is selected.
- Allow expiration date, purchase date, or no date.
- Do not treat purchase dates as expiration dates.
- Calculate days remaining for products with expiration dates.
- Show expiring-soon and expired products.
- Display total inventory count.
- Provide inline validation messages.

### Fill Fridge
- Display groceries saved through Use By.
- Organize items into fridge and freezer compartments.
- Allow users to change the compartment of an item.
- Save organization changes.
- Keep pantry and Other products in inventory without showing them inside the fridge.
- Add drag-and-drop interactions when core functionality is stable.

### Buy List
- Allow users to add shopping list items manually.
- Allow inventory products to be added to the shopping list.
- Let users check off, uncheck, and remove items.
- Save the list in localStorage.

## Shared Application State

- Use one shared inventory data structure.
- Use By and Fill Fridge must reference the same inventory.
- Shopping list entries should be stored separately.
- Changes should update the interface immediately.
- Save and load data with localStorage.
- Provide a reset option that works without refreshing the page.

## Interaction Requirements

The website must demonstrate:
- Form inputs
- Buttons
- Dropdowns or other selection controls
- Dynamic JavaScript updates
- Derived calculations from saved data
- Input validation
- Empty, active, invalid, and reset states

Do not rely on browser alert() for normal feedback.

## Refrigerator Animations

- Animate the refrigerator entrance with a subtle zoom.
- Open the French doors when entering Fill Fridge.
- Keep the refrigerator closed in Customize.
- Position the refrigerator beside the form in Use By.
- Use CSS transitions and JavaScript for animation.
- Prioritize functionality over photorealistic animation.

## Development Priorities

1. Build the homepage and navigation.
2. Implement Use By and shared inventory.
3. Implement Fill Fridge.
4. Implement Buy List.
5. Add basic Customize interactions.
6. Refine animations and visual styling.
7. Test responsiveness and accessibility.
8. Deploy through GitHub Pages.

## Working Guidelines

- Read PROPOSAL.md, PRD.md, and DESIGN.md before making major changes.
- Do not redesign the website without approval.
- Reuse existing image assets.
- Build features incrementally.
- Keep code simple enough for a student to understand.
- Explain major JavaScript functions and interactions.
- Test features after implementation.
- Avoid adding features not described in the project documents.
