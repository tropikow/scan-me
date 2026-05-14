# Design System

This document defines the visual and interaction standards for the application. All UI work must comply with these rules. Deviations require an explicit override comment in the terminal.

---

## 1. Design Philosophy

The interface follows a **minimalist, line-art aesthetic** built on a constrained pastel palette. Every visual decision must reduce cognitive load and visual fatigue while preserving clarity of intent.

Core principles:
- **Restraint over decoration** — only the defined tokens are used; no ad-hoc colors, gradients, or shadows.
- **Semantic consistency** — a color always means the same thing across the entire app.
- **Calm by default** — saturation, contrast, and motion are tuned to allow prolonged use without eye strain.
- **Clarity over cleverness** — affordances must be obvious without instruction.

---

## 2. Color System

### 2.1 Palette (tokens only)

All colors must be referenced via semantic tokens. Raw hex values outside this table are not permitted in components.

| Token              | Role                          | Value      |
|--------------------|-------------------------------|------------|
| `--bg-base`        | Page background               | `#FAF8F5`  |
| `--bg-surface`     | Cards, panels, modals         | `#FFFFFF`  |
| `--fg-primary`     | Primary text                  | `#3A3A3A`  |
| `--fg-muted`       | Secondary text, captions      | `#7A7A7A`  |
| `--border-subtle`  | Line art, dividers, outlines  | `#E6E2DC`  |
| `--accent-action`  | Primary CTAs, focus rings     | `#A8C8E1`  |
| `--accent-success` | Confirmation, success states  | `#B8D8C0`  |
| `--accent-warning` | Non-blocking caution signals  | `#F5D8A8`  |
| `--accent-error`   | Errors, destructive actions   | `#E8B4B4`  |
| `--accent-info`    | Informational hints           | `#D4C8E0`  |

### 2.2 Semantic Rules

Color roles are **strict and non-interchangeable**:

- **Primary actions / CTAs** → `--accent-action`. A button that triggers the main action of a view always uses this token.
- **Destructive actions and error states** → `--accent-error`. Used for inline validation errors, error banners, and destructive confirmations. Never decorative.
- **Success feedback** → `--accent-success`. Reserved for confirmation of completed actions.
- **Warnings** → `--accent-warning`. Non-blocking risk signals only.
- **Informational** → `--accent-info`. Neutral hints or tooltips.

A token never changes its meaning between screens. If a new role is needed, propose a new token rather than reusing an existing one.

### 2.3 Contrast & Accessibility

- Text-on-background contrast must meet **WCAG AA**: 4.5:1 for body text, 3:1 for large text.
- Pastel accents must never act as the sole signal — pair every color cue with an icon or text label.
- Focus indicators must remain visible against any background.

---

## 3. Visual Style

- **Line art** — borders, icons, and dividers use a uniform `1px` stroke in `--border-subtle` or `--fg-muted`.
- **Outlines only** — no filled illustrations, drop shadows, or gradients.
- **Corner radius scale** — `4px`, `8px`, `12px`. No values outside this scale.
- **Spacing scale** — `4px` base unit; all margins and paddings must be a multiple of it (`4`, `8`, `12`, `16`, `24`, `32`, `48`).
- **Elevation** — handled through `--border-subtle` outlines, not shadows.

---

## 4. Typography

### 4.1 Hierarchy

| Role       | Weight | Token         |
|------------|--------|---------------|
| Heading 1  | 600    | `--font-h1`   |
| Heading 2  | 600    | `--font-h2`   |
| Heading 3  | 500    | `--font-h3`   |
| Body       | 400    | `--font-body` |
| Caption    | 400    | `--font-caption` |

### 4.2 Responsive Sizing

Font sizes scale fluidly with viewport width using `clamp()` to remove the need for breakpoint-specific overrides:

```css
--font-caption: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--font-body:    clamp(0.875rem, 0.8rem + 0.4vw, 1rem);
--font-h3:      clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem);
--font-h2:      clamp(1.25rem, 1.05rem + 0.8vw, 1.75rem);
--font-h1:      clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem);
```

Reference breakpoints (for layout, not type):
- `< 640px` — mobile
- `640–1024px` — tablet
- `> 1024px` — desktop

Line-height: `1.5` for body, `1.25` for headings. Letter-spacing: default.

---

## 5. Interaction States

Every interactive element must define four states derived from its base token:

| State    | Treatment                                           |
|----------|-----------------------------------------------------|
| Default  | Base token                                          |
| Hover    | Base token at +5% luminance                         |
| Active   | Base token at −5% luminance                         |
| Focus    | Visible `2px` outline in `--accent-action`, `2px` offset |
| Disabled | Base token at 40% opacity, no hover/active response |

Transitions: `150ms ease-out` on `color`, `background-color`, `border-color`, and `opacity` only. **No layout-shifting animations.**

---

## 6. Implementation Checklist

Before merging any new component:

- [ ] All colors reference defined tokens — no inline hex values.
- [ ] Semantic role of each color matches its intended meaning.
- [ ] Typography uses the responsive `clamp()` scale.
- [ ] All interactive elements expose default, hover, active, focus, and disabled states.
- [ ] Contrast verified against WCAG AA.
- [ ] No filled illustrations, gradients, or shadows introduced.
- [ ] Spacing and radius values come from the defined scales.
- [ ] Color is never the sole channel of meaning (icon or label present).