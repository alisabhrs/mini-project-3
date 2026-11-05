# Fresh'd — Instructions for Coding Agents

**Use the simplest code that works, and add nothing I did not ask for.**

## Rules
- Preserve existing functionality: Fill Fridge, Fill Pantry, Use By, the homepage fridge, and `localStorage` key `freshd-inventory-v1`.
- Plain HTML, CSS, and JavaScript only. No frameworks, libraries, build tools, or CDN links.
- Keep JavaScript readable: clear names, short functions, comments that explain *why*.
- Do not introduce unnecessary abstractions or files.
- Explain every meaningful change in beginner-friendly language. The owner is learning.
- Follow the approved `PRD.md` and `DESIGN.md`. Ask before changing either.
- Reuse the existing Fresh'd assets in `images/`. Never replace them with emoji or stock icons.
- Every `fetch` goes in `try/catch` and checks `response.ok`.
- Render API data with `createElement` + `textContent`, never `innerHTML`.
- Never commit API keys. TheMealDB's test key `1` is public.
- Do not push to GitHub without the owner's approval.
- Do not invent test results. Say what was and wasn't tested.

## Project Map
| File | Purpose |
|---|---|
| `js/inventory.js` | Shared inventory read/save and expiry helpers. Load it first on every page |
| `js/recipes.js` | What Can I Make?: API calls, matching, ranking, rendering |
| `js/fill-fridge.js`, `js/fill-pantry.js`, `js/use-by.js`, `js/script.js` | MP2 pages |
| `css/style.css` | Shared tokens, navigation, homepage |
