# Design System

This document defines the visual and interaction standards for the application. It mirrors what is actually implemented in `app/assets/css/main.css` and in the production layouts (`app/layouts/app.vue`, `app/pages/index.vue`, `app/pages/app/**`, `app/pages/p/[token].vue`, `app/components/AuthView.vue`). Any deviation requires an explicit override comment.

---

## 1. Design Philosophy

The interface is **monochrome, hairline-driven, and paper-warm**. Black ink on a near-white surface, separated by ~9% opacity hairlines, with a single warm off-white as the secondary surface. Color is intentionally absent — emphasis comes from weight, density, mono type, and subtle elevation. Receipts and invoices are the product, so the design borrows from receipt paper: high information density, mono numerals, dotted/dashed dividers, restrained sheen.

Core principles:
- **Ink over color** — primary CTAs and emphasis use `--ink` (near-black), never a hue.
- **Hairlines, not boxes** — separators are 1px at ~9% black; elevation is a hairline + a soft `0–24px` shadow when truly off-plane (drawers, dropdowns).
- **Mono for numerals & meta** — totals, counts, kbd, eyebrows, plan badges, search meta.
- **Density on purpose** — chrome (sidebar, chips, list rows) uses fixed small sizes (10–13.5px). Page content uses the responsive `clamp()` scale.
- **Calm motion** — `150–220ms` transitions on `background`, `border-color`, `color`, `transform`, `opacity` only. The only motion idiom on a primary CTA is `transform: scale(0.985)` on hover.

---

## 2. Color System

### 2.1 Tokens (single source of truth)

All tokens live on `:root` in `app/assets/css/main.css`. Components must reference tokens, never raw hex (except for the receipt-paper atom which uses paper-specific cream).

**Primary tokens — use these.**

| Token            | Role                                       | Value                       |
|------------------|--------------------------------------------|-----------------------------|
| `--bg`           | Page background (white)                    | `#ffffff`                   |
| `--bg-base`      | App-wide body background (warm off-white)  | `#FAF8F5`                   |
| `--surface`      | Hover surface, chips, subtle fills         | `#fafaf7`                   |
| `--surface-2`    | Deeper inset surface (cards-on-cards)      | `#f0eee9`                   |
| `--ink`          | Primary text, primary CTA fill, focus      | `#0a0a0a`                   |
| `--ink-2`        | Secondary text, nav items default          | `#444`                      |
| `--ink-3`        | Muted text, captions, placeholders         | `#8a8a8a`                   |
| `--ink-4`        | Disabled, hairline-on-hover                | `#c4c4c0`                   |
| `--line`         | Default hairline (1px borders, dividers)   | `rgba(0, 0, 0, 0.09)`       |
| `--line-2`       | Even softer hairline (inside-card splits)  | `rgba(0, 0, 0, 0.05)`       |
| `--accent`       | Identical to `--ink` — primary CTA bg      | `#0a0a0a`                   |
| `--accent-ink`   | Text on `--ink` / `--accent`               | `#ffffff`                   |

**Status tokens — use only when a status absolutely needs color.**

The app is intentionally monochrome; status accents below are used **sparingly** (e.g. inline error banners). They must always be paired with a label or icon — never sole-channel.

| Token              | Role                                | Value      |
|--------------------|-------------------------------------|------------|
| `--accent-error`   | Inline error banners, validation    | `#E8B4B4`  |
| `--accent-success` | Confirmation pill / toast           | `#B8D8C0`  |
| `--accent-warning` | Non-blocking caution                | `#F5D8A8`  |
| `--accent-info`    | Neutral hint                        | `#D4C8E0`  |
| `--accent-action`  | Reserved for the global focus ring  | `#A8C8E1`  |

**Legacy tokens — do not use in new code.**

`--bg-surface`, `--fg-primary`, `--fg-muted`, `--border-subtle`, `--surface-hover`, `--surface-active`, and the `--accent-action-hover/-active` variants exist in `main.css` for the old `.btn` / `.input` / `.card` / `.field` / `.muted` utilities. Prefer the hi-fi tokens above and the atoms in §6. Don't introduce new components that depend on the legacy set.

### 2.2 Semantic rules

- **Primary CTA** → `background: var(--ink); color: var(--accent-ink); border-color: var(--ink)`. Hover adds `transform: scale(0.985)`.
- **Secondary / default button** → `background: var(--bg); color: var(--ink); border: 1px solid var(--line)`. Hover: `background: var(--surface); border-color: var(--ink-4)`.
- **Ghost** → transparent background, hover to `var(--surface)`.
- **Focus ring** (global, in `main.css`): `outline: 2px solid var(--accent-action); outline-offset: 2px`. This is the **only** hue used in the steady-state UI, and only on `:focus-visible`.
- **Active nav item** → `background: var(--surface); color: var(--ink); font-weight: 500`. Icon opacity goes from `0.8` → `1`.
- **Disabled** → `opacity: 0.4; cursor: not-allowed; pointer-events: none`.

### 2.3 Contrast & accessibility

- Text on background must meet **WCAG AA**: 4.5:1 body, 3:1 large.
- `--ink-3` (`#8a8a8a`) on `--bg` clears AA only for ≥14px or bold ≥12px — keep it for captions and meta, not body copy.
- Status colors are paired with a text label or icon; color is never the only signal.
- Focus ring stays visible against any token background.

---

## 3. Surfaces & Elevation

Elevation is hairline-first; shadows are allowed when an element is genuinely off the page plane.

| Layer                        | Treatment                                                                 |
|------------------------------|---------------------------------------------------------------------------|
| Page                         | `background: var(--bg)` or `var(--bg-base)`                               |
| Card / panel                 | `background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius)` |
| Inset card-on-card           | `background: var(--surface)` (or `--surface-2`), same hairline border     |
| Hover row                    | `background: var(--surface)`                                              |
| Dropdown / popover           | `--line` border + `box-shadow: 0 8px 24px rgba(0,0,0,0.08)`               |
| Mobile drawer (sidebar)      | `box-shadow: 0 0 24px rgba(0,0,0,0.08)`                                   |
| Sticky/floating button       | `box-shadow: 0 2px 6px rgba(0,0,0,0.04)`                                  |
| Receipt paper (`.recpaper`)  | Cream `#fdfbf6` + `box-shadow: 0 12px 30px -8px rgba(0,0,0,0.15)`         |
| Drop zone (upload)           | `border: 1.5px dashed var(--line)` (dashed, not solid)                    |

Gradients are reserved for the landing hero only (subtle near-black radial / linear). They are not allowed in the authenticated app.

---

## 4. Radius & Spacing

### 4.1 Radius scale

| Token         | Value | Use                                                           |
|---------------|-------|---------------------------------------------------------------|
| `--radius-sm` | `4px` | tight chips, kbd, micro-buttons                               |
| `--radius-md` | `8px` | buttons, inputs, nav items, search field, chip-icons (32×32)  |
| `--radius-lg` | `12px`| legacy `.card` only                                           |
| `--radius`    | `14px`| **primary** card / panel / drop-zone radius across the app    |
| —             | `6px` | inside-card list rows, search-item avatars, receipt paper     |
| —             | `999px`| pills (`.chip`)                                              |
| —             | `50%` | avatars                                                       |

Default for new cards/panels is `--radius` (14px). Use `--radius-md` for inline controls (buttons, inputs, segmented chrome).

### 4.2 Spacing

Base unit is `4px`. Common multiples in use: `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32, 48`. Sidebar and dense chrome may use `7/9/22` (non-strict multiples) — these are intentional density tweaks; do not refactor them into the strict scale.

Page padding: use `--pad` (`clamp(20px, 4vw, 48px)`) for top-level page gutters. Max content width: `--max` (`1240px`).

---

## 5. Typography

### 5.1 Family

```css
font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui,
             'Helvetica Neue', sans-serif;
```

Mono (numerals, kbd, eyebrows, meta, plan badge, totals on `.recpaper`):

```css
font-family: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
```

Use the `.mono` utility class when an inline element needs mono without restating the stack.

### 5.2 Hierarchy

Page-level headings use the responsive `clamp()` scale. Chrome (sidebar, chips, nav items, list meta) uses fixed small sizes because density is intentional.

| Role           | Weight  | Token / Size                                       |
|----------------|---------|----------------------------------------------------|
| Heading 1      | 600     | `--font-h1` → `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)` |
| Heading 2      | 600     | `--font-h2` → `clamp(1.25rem, 1.05rem + 0.8vw, 1.75rem)` |
| Heading 3      | 500     | `--font-h3` → `clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)` |
| Body           | 400     | `--font-body` → `clamp(0.875rem, 0.8rem + 0.4vw, 1rem)` |
| Caption / meta | 400     | `--font-caption` → `clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)` |
| Nav / chip / button | 450–500 | fixed `13.5px` (nav, buttons), `12px` (chip), `11px` (kbd, plan badge) |
| Eyebrow / label | 500–600 | mono, `10–11px`, `letter-spacing: 0.08–0.12em`, uppercase |

Line-height: `1.5` body, `1.25` headings. Letter-spacing: `-0.005em` on chrome text, `-0.02em` on logo/avatar initials, `+0.04–0.12em` on uppercase eyebrows and mono meta.

---

## 6. Component atoms

These are defined globally in `main.css` and must be reused before introducing a new variant.

- **`.btn-hifi`** — base button. Modifiers: `.btn-primary` (ink fill), `.btn-ghost` (transparent), `.btn-icon` (32×32 square), `.btn-sm` (compact).
- **`.chip`** — 999px pill. Modifiers: `.outline`, `.solid` (for use on `--ink` backgrounds), `.tiny`, `.mono`.
- **`.avatar`** — circular monogram. Sizes: `.sm` (18), default (28), `.md` (32), `.lg` (44). Modifier: `.solid` (ink fill).
- **`.recpaper`** — receipt-paper container with cream background and drop shadow; child selectors `h5`, `.addr`, `.litem`, `.tot`, `hr` use mono.
- **`.mono`** — inline mono font family + neutral feature-settings.

The legacy `.btn`, `.input`, `.card`, `.field`, `.muted` utilities still exist for backward compatibility but should not be the first choice for new UI.

---

## 7. Interaction states

| State    | Treatment                                                                                  |
|----------|--------------------------------------------------------------------------------------------|
| Default  | Base token                                                                                 |
| Hover    | Background → `var(--surface)`; border → `var(--ink-4)`; primary CTA: `transform: scale(0.985)` |
| Active   | Background → `var(--surface-2)` (or rely on primary's transform)                           |
| Focus    | Global `:focus-visible` ring: `outline: 2px solid var(--accent-action); outline-offset: 2px` |
| Disabled | `opacity: 0.4; pointer-events: none; cursor: not-allowed`                                  |

Transitions: `150ms ease-out` on chrome, up to `220ms ease-out` on drawer/overlay reveals. Never animate layout (no width/height/top/left transitions).

---

## 8. Layout & breakpoints

The authenticated shell (`app/layouts/app.vue`) is a 2-column CSS grid: `240px sidebar + 1fr main`. The sidebar is `position: sticky; top: 0; height: 100vh`. Main content uses `min-width: 0; overflow-x: hidden` so charts and wide tables can clip.

Active breakpoints in code:

- **`max-width: 880px`** — sidebar collapses to a full-height fixed drawer (`translateX(-100%)` → `translateX(0)` with `.open`), a hamburger button appears at the top-left, an overlay covers the main area. **This is the canonical mobile/desktop boundary.**
- **`max-width: 1000px`** — dashboard collapses `.dash-hero` and `.split` grids to a single column.
- **`max-width: 640px`** — used only on `app/layouts/default.vue` (auth/marketing chrome) for tighter padding.

When adding a new layout, prefer **`880px`** as the primary breakpoint unless content requires otherwise. Do not introduce a `768px` breakpoint without reason.

---

## 9. Receipts / invoices specifics

- Numbers (totals, subtotals, line amounts, counts in nav) use the mono stack.
- Currency formatting: symbol + space + amount with 2 decimals (`€ 12.40`). See `formatAmount` in `app/layouts/app.vue:141`.
- Dotted (`1px dashed`) dividers for receipt-style separators; dashed (`1.5px dashed var(--line)`) for upload drop zones; solid hairlines (`1px solid var(--line/-2)`) everywhere else.

---

## 10. Per-edit checklist

Before merging any new component:

- [ ] Colors reference tokens from §2.1 (primary set). No raw hex outside `.recpaper`.
- [ ] No legacy tokens (`--bg-surface`, `--fg-primary`, `--fg-muted`, `--border-subtle`, `--surface-hover`, `--surface-active`) introduced into new code.
- [ ] No hue is used as the sole signal of meaning; status colors are paired with a label or icon.
- [ ] Primary CTA uses `--ink` fill; secondary uses hairline + transparent/`--bg` fill.
- [ ] Hairlines are `1px solid var(--line)` (or `--line-2` for inside-card splits). Shadows only on truly off-plane surfaces (§3).
- [ ] Radius from §4.1; default panel radius is `--radius` (14px).
- [ ] Typography uses the Geist stack; numerals and meta use `.mono` or the mono stack directly.
- [ ] Page headings use the `clamp()` scale; chrome uses the fixed small sizes already in use.
- [ ] All interactive elements expose hover, active, focus (`:focus-visible`), and disabled.
- [ ] Mobile breakpoint at `880px` (or `1000px` for dashboard-style grids), not arbitrary values.
- [ ] No layout-shifting animation; transitions limited to `background`, `border-color`, `color`, `transform`, `opacity`.
- [ ] Contrast verified at WCAG AA, especially when using `--ink-3` for text.
