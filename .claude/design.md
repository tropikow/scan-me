# Design tokens

Sistema visual inspirado en Apple (neutros + acción única) pero 
adaptado para densidad de aplicación, no de landing.

## Colores

### Neutros (texto y superficies)
- `--color-ink: #1d1d1f` — texto primario, headings, iconos
- `--color-graphite: #707070` — texto secundario, captions
- `--color-slate: #474747` — texto terciario
- `--color-fog: #f5f5f7` — canvas / background de página
- `--color-snow: #ffffff` — superficie de cards, modals, inputs
- `--color-mist: #e8e8ed` — borders, dividers, input backgrounds

### Acción
- `--color-action: #0071e3` — botones primarios, SOLO acción primaria
- `--color-link: #0066cc` — links inline en texto

### Semánticos (agregado, no viene de Apple)
- `--color-success: #1f7a3f` — confirmaciones, montos positivos
- `--color-warning: #b64400` — alertas no críticas
- `--color-error: #c41e1e` — errores, validaciones fallidas
- `--color-info: #0066cc` — informativo, igual al link

### Categorías de gastos (paleta para charts)
- 6-8 colores accesibles, contraste AA mínimo
- A definir según prueba visual con datos reales

## Tipografía

### Familias
- `--font-display: Inter, ui-sans-serif, system-ui` — headings
- `--font-text: Inter, ui-sans-serif, system-ui` — body, UI
- `--font-mono: 'JetBrains Mono', ui-monospace` — montos, IDs

Inter elegido como reemplazo de SF Pro (gratis, web-friendly, similar).

### Escala (truncada para app, no landing)
- `--text-caption: 12px` / line-height 1.33 / tracking -0.26px
- `--text-body-sm: 14px` / line-height 1.43 / tracking -0.04px
- `--text-body: 16px` / line-height 1.5 / tracking -0.1px
- `--text-subheading: 18px` / line-height 1.4 / tracking -0.2px
- `--text-heading-sm: 22px` / line-height 1.3 / tracking -0.3px
- `--text-heading: 28px` / line-height 1.2 / tracking -0.5px
- `--text-heading-lg: 36px` / line-height 1.15 / tracking -0.7px

### Pesos
- 400 (regular) — body
- 500 (medium) — emphasis, labels
- 600 (semibold) — headings, button labels
- 700 (bold) — solo headings grandes (28px+)

No usar weight 300 (light) — pierde definición en pantallas medianas.

## Spacing (base 4px)

- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-8: 32px`
- `--space-10: 40px`
- `--space-12: 48px`

Gap entre secciones de página: 32-48px (NO 80-120px de Apple landing).
Padding interno de cards: 20-24px.
Gap entre elementos en stack: 8-16px.

## Border radius

- `--radius-sm: 6px` — inputs, badges, chips
- `--radius-md: 10px` — botones, dropdowns
- `--radius-lg: 14px` — cards, modals
- `--radius-pill: 999px` — solo botón CTA primario

Diferencia con Apple landing: cards a 14px, no 28px. La app necesita 
más densidad y 28px se ve juguetón en una herramienta financiera.

## Elevación

Cero box-shadows. Diferenciación por color de fondo:
- Canvas (fog) → Card (snow): contraste de valor por sí solo.
- Modal sobre overlay: overlay con `rgba(0, 0, 0, 0.4)`.

Excepción: dropdowns y popovers usan `0 4px 12px rgba(0,0,0,0.08)` 
porque flotan sobre contenido y necesitan separación.

## Layout

- Max width contenido principal: 1280px
- Sidebar: 240px (colapsable a 64px)
- Mobile breakpoint: 768px
- Tablet breakpoint: 1024px