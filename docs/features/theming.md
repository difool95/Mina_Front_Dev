# Styling and design tokens

## The rules

1. **Plain CSS.** One `.css` file next to the component it styles, imported by that component. No CSS-in-JS, no utility framework.
2. **Class names** follow `mina-<block>__<element>`, flat: `.mina-block__brief`, `.mina-pills__pill`. A modifier adds `--name`: `.mina-block__cta--still`.
3. **Every value comes from a token.** Colours, font sizes, weights, spacing, durations: all are `--mina-*` custom properties on `:root` in [src/index.css](../../src/index.css). Never hard-code a hex, a pixel font size or a duration that a token covers.

```css
/* right */
.mina-mina-brief--warning { color: var(--mina-accent-pink); }

/* wrong: the colour can no longer be themed */
.mina-mina-brief--warning { color: #EA578F66; }
```

## The token groups

| Prefix | For |
|---|---|
| `--mina-paper`, `--mina-bg`, `--mina-ink`, `--mina-ink-16/32/60`, `--mina-muted` | backgrounds, text, borders, tints |
| `--mina-accent-*` | Mina's own voice: green while she talks, pink for warnings |
| `--mina-text-*`, `--mina-fs-*` | font sizes |
| `--mina-weight-*`, `--mina-fw-*` | font weights |
| `--mina-space-*`, `--mina-grid-*` | spacing and layout |
| `--mina-anim-*`, `--mina-talk-speed` | animation durations, how fast Mina types |

The comment at the top of `index.css` says these tokens are meant to be live-editable from a **Design Cockpit**, which would override them at runtime. That's why reading a token, rather than copying its value, matters. Nothing in this repo loads those overrides yet.

## Shared building blocks

Before writing new layout CSS, check [components/builder/](../../src/components/builder/):
- **`Table`, `Row`, `Rule`, `Group`** ([Table.tsx](../../src/components/builder/Table.tsx)) build every panel: the matcha panels, the account row, the details panel, the branding assets panel.
- **`AssetTiles`** is the strip of picture tiles with drag-to-reorder and long press, used by brand memory.
- **`MatchaSlider`** is the pack slider.

Text styles such as `h1`, `paragraph-title`, `comment`, `muted` and `faint` are global classes in `index.css`. Components add them next to their own class.
