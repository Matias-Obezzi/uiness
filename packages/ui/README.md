<div align="center">

<img src="../../assets/logo.png" alt="" width="80" height="80" />

# @uiness/ui

*A component registry you actually own.*

![72 Items](https://img.shields.io/badge/registry-72_items-09090b?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-09090b?style=flat-square&logo=react)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-09090b?style=flat-square&logo=tailwindcss)
![Radix](https://img.shields.io/badge/primitives-Radix-09090b?style=flat-square)
![shadcn CLI](https://img.shields.io/badge/CLI-shadcn-09090b?style=flat-square)

**68 components · you own the code · mixes with shadcn/ui · no animation, date or drag library**

Radix primitives styled with Tailwind v4, installed with the shadcn CLI. The code lands in your repo, so you own it and can change it. The theme uses the same CSS variable names as shadcn/ui, so uiness and shadcn components live together in one project without extra work. The motion pieces run on CSS and the Web Animations API, and the calendar does its own date math, so neither one pulls in a library.

[Documentation](https://uiness.vercel.app) · [Repository](https://github.com/Matias-Obezzi/uiness) · [Issues](https://github.com/Matias-Obezzi/uiness/issues)

</div>

## Install

Point the shadcn CLI at the registry once, in `components.json`:

```json
{
  "registries": {
    "@uiness": "https://uiness.vercel.app/r/{name}.json"
  }
}
```

Then add what you need:

```bash
npx shadcn@latest add @uiness/theme @uiness/button @uiness/dialog
npx shadcn@latest add @uiness/island @uiness/image
```

Until the docs site is live, build the registry locally and add from the files:

```bash
pnpm --filter @uiness/ui build     # writes public/r/*.json
npx shadcn@latest add ./packages/ui/public/r/button.json
```

## What is in the registry

| Item | Notes |
| --- | --- |
| `theme` | CSS variables for light and dark, radius 0.75rem, a layer scale (`--z-*`), motion durations and easings (`--duration-*`, `ease-*`) and a type scale (`text-display` to `text-eyebrow`). Expects `tw-animate-css` imported in your globals. |
| `utils` | `cn()` on top of clsx and tailwind-merge. |
| `button`, `badge`, `card`, `input`, `textarea`, `label`, `checkbox`, `switch`, `separator` | Form and layout basics. |
| `select`, `combobox` | Pick from a list; the combobox searches. |
| `form` | Field wiring: ids, `aria-describedby`, `aria-invalid`, error messages. |
| `radio-group`, `slider`, `toggle`, `toggle-group`, `input-otp` | The rest of the form controls. |
| `split-button`, `button-group`, `expanding-button-group`, `copy-button` | Buttons that do more: a main action with a menu, a joined row with a gliding highlight, icons that grow to show their label, a copy with instant confirmation. |
| `hold-to-confirm`, `confirm-morph` | Confirmation without a dialog: press and hold, or "Are you sure?" in place with a spinner, a result and Undo. |
| `segmented-control`, `theme-switch`, `kbd` | A sliding pick between a few views, a light and dark switch that sweeps the page with the View Transitions API, and platform aware key caps. |
| `dialog`, `drawer`, `dropdown-menu`, `tooltip`, `popover` | Overlays on Radix, animated with tw-animate-css. |
| `alert-dialog` | A dialog that asks for a decision, plus `confirm()`, an awaitable version of it rendered by one `<Confirmer />`. |
| `context-menu` | Right click menus declared once by name on a provider, picked per element with `useContextMenu`, extended or replaced where needed. Also opens from the keyboard and on a long press. |
| `tour` | Guided tours declared once by name on a provider and started from anywhere with `useTour`: a spotlight around each target, a card that flips to fit, steps filtered with `when`. |
| `navbar` | Bar that becomes a menu or a bottom tab bar on phones. |
| `command` | Command palette with fuzzy search, plus `useCommandShortcut`. |
| `scroll-area` | Scrollable region with themed bars. |
| `spotlight`, `aurora`, `meteors`, `pattern`, `sparkles`, `sonar`, `retro-grid`, `orbit` | Animated backgrounds. |
| `text-generate`, `typewriter`, `flip-words`, `shimmer`, `number-ticker`, `gradient-text`, `scramble-text`, `odometer`, `text-reveal` | Animated text. |
| `reveal`, `tilt-card`, `marquee`, `moving-border`, `animated-tooltip`, `hover-highlight`, `compare`, `tracing-beam` | Motion pieces on CSS and the Web Animations API, no animation library. |
| `magnetic`, `ripple`, `dock`, `flip-card`, `confetti` | Things that answer the pointer: pulled towards it, inked on press, magnified, flipped, celebrated. |
| `animated-list`, `card-stack`, `velocity-marquee`, `terminal` | Sequences: a feed that fills itself, a stack that cycles, rows that follow the scroll speed, a terminal that types. |
| `parallax-grid`, `sticky-scroll`, `timeline` | Scroll-linked pieces on `@uiness/scroll`. |
| `path-morph`, `link-preview` | SVG morphing and hover previews. |
| `bento-grid`, `sidebar`, `calendar`, `date-picker` | Layout and date picking, no date library. |
| `sortable`, `kanban`, `reorderable-grid`, `draggable` | Drag and drop on `@uiness/dnd`, every one of them also operable from the keyboard. |
| `dropzone` | Files dropped in from the desktop, checked by type, size and count. Native HTML drag and drop, no package behind it. |
| `use-in-view`, `use-reduced-motion` | Hooks the motion pieces share, installed into `hooks/`. |
| `accordion`, `collapsible` | Same API as shadcn/ui, but closed content stays in the page with `hidden="until-found"`: search engines index it and find in page opens it. Built on `use-until-found`. |
| `table` | Same pieces as shadcn/ui, with its own border, sideways scroll, selected rows and an optional sticky header. |
| `alert`, `spinner`, `tabs`, `avatar`, `progress`, `skeleton` | Feedback and layout pieces. |
| `chart` | The shadcn/ui chart API on recharts (`ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`, `ChartConfig`), styled with the theme. Installs over an existing shadcn `chart.tsx` without changing a screen. |
| `bar-chart`, `line-chart` | Ready-made charts on `chart`, from a list of series: grouped or stacked bars, straight or smooth lines with area and gaps. Dates in the reader's locale, legend toggles, keyboard reading and an empty state. |
| `carousel` | Horizontal run of items of any width and any content, on CSS scroll snapping. |
| `gallery` | Image grid with a full screen lightbox that flies from the thumbnail. Also exports `Lightbox`. |
| `island` | `<Island />` wired to the theme tokens, re-exports the `@uiness/island` API. |
| `image` | `<Image />` with theme defaults, re-exports the `@uiness/image` variants and hook. |
| `fx` | `<Fx />` canvas effects with theme defaults, re-exports every `@uiness/fx` effect. |
| `toast` | `<Toaster />` wired to the theme tokens, re-exports `toast()` from `@uiness/toast`. |
| `choreo` | `<Choreo />` that animates a whole site from its DOM, skipping the registry components that animate themselves. Re-exports `@uiness/choreo`. |

### Blocks

Whole page sections built from the items above, installed into `components/` to be edited: `navbar-01`, `hero-01`, `hero-02`, `logos-01`, `features-01`, `features-02`, `stats-01`, `pricing-01`, `testimonials-01`, `faq-01`, `cta-01`, `footer-01` and `auth-01`. Each takes its copy through props and lays itself out with container queries, by the width of its container.

Components import the unified `radix-ui` package and mark themselves `'use client'` where they hold state, so they work in Next.js App Router out of the box.

## Development

Sources live in `registry/`. Every component has a live demo in the docs site under `apps/docs`.

`registry/registry.test.ts` guards the registry itself: unique names, every file present on disk, local dependencies namespaced with `@uiness/`, no dangling dependencies, and every `@/` import declared as a dependency. It runs with the rest of the tests.

```bash
pnpm --filter @uiness/ui test
pnpm --filter @uiness/ui build
```
