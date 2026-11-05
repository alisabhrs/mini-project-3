# Fresh'd — Design Direction (Mini Project 3)

## Mood
A vintage grocery store at night: black background, cream receipts, hand-drawn fruit stickers, bold all-caps headlines, playful stamps. Warm and fun, but the information is always easy to read.

## Assets (reuse, never replace)
- **Sticker navigation:** `images/*-button.png` (lemon, orange, melon, …) and `images/freshd-logo.png`.
  - Served from `images/small/`: resized 360px copies of the same art, for speed.
- **Fridge photos:** `fridge-closed.png`, `fridge-opened.png`, `freezer-opened.png`, `fridge-and-freezer-opened.png`.
- **Pantry shelf:** `pantry.png`.
- **"What Can I Make?" nav item:** no sticker art exists yet, so it uses a round red CSS stamp in the same style as the homepage "OPEN ME!" stamp. Swap in a drawn sticker later if one is made.

## Color tokens (`css/style.css` `:root`)
| Token | Value | Use |
|---|---|---|
| `--black` | `#0b0b0b` | Page background |
| `--cream` | `#f5f0e6` | Text on dark, receipt panels |
| `--green` | `#8d9e26` | Accent headline word, "you have" tags, success |
| `--red` | `#c63e31` | Stamps, "use soon", errors, primary action on dark |
| `--yellow` | `#f0c65a` | Focus outline, highlights |
| `--muted` | `#aaa69d` | Secondary text and eyebrows |

## Type
- **Headlines:** Arial/Helvetica, weight 900, uppercase, tight letter-spacing.
- **Eyebrows:** 10–11px, uppercase, letter-spacing 3px.
- **Receipt details and forms:** "Courier New", monospace.
- System fonts only, so no CDN is needed.

## Design trials
`design-trials/` holds two versions of the recipe card:
- **A — Receipt card:** cream receipt with a have/need list. Very on-brand, but the match % sits at the bottom and is easy to miss, and a grid of cream cards gets heavy.
- **B — Photo + stamp card:** dark card, recipe photo, red rotated stamp showing the match %, green "have" pills and dashed red "need" pills.

**Chosen:** B for recipe cards, because the score (the calculated answer) is the first thing you see. The receipt style from A is used for the search panel, to match Fill Fridge and Fill Pantry.

## What Can I Make? page layout
1. Hero: eyebrow, big headline "WHAT CAN I **MAKE?**" (second word green), one-line explanation.
2. Receipt panel: ingredient dropdown, Find Recipes button, note on how the score works.
3. Status line for loading, empty, error, and invalid states. Text, with `aria-live` so screen readers announce it.
4. Results grid: Trial B cards. "Show recipe" uses `<details>` to reveal instructions and measures.

## Accessibility and responsiveness
- Visible focus outline (yellow) on all controls.
- Status messages in `role="status"` / `aria-live`.
- Single column under 600px. No horizontal scrolling at 360px. Tap targets at least 44px.
- The score is always written as text, not just shown by color.
