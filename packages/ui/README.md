<div align="center">

# @uiness/ui

*A component registry you actually own.*

![71 Items](https://img.shields.io/badge/registry-71_items-09090b?style=flat-square)
![React 19](https://img.shields.io/badge/React-19-09090b?style=flat-square&logo=react)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-09090b?style=flat-square&logo=tailwindcss)
![Radix](https://img.shields.io/badge/primitives-Radix-09090b?style=flat-square)
![shadcn CLI](https://img.shields.io/badge/CLI-shadcn-09090b?style=flat-square)

**67 components · you own the code · mixes with shadcn/ui · no animation, date or drag library**

Radix primitives styled with Tailwind v4, installed with the shadcn CLI. The code lands in your repo, so you own it and can change it. The theme uses the same CSS variable names as shadcn/ui, so uiness and shadcn components live together in one project without extra work. The motion pieces run on CSS and the Web Animations API, and the calendar does its own date math, so neither one pulls in a library.

[Documentation](https://matias-obezzi.github.io/uiness) · [Repository](https://github.com/Matias-Obezzi/uiness) · [Issues](https://github.com/Matias-Obezzi/uiness/issues)

</div>

## Install

Point the shadcn CLI at the registry once, in `components.json`:

```json
{
  "registries": {
    "@uiness": "https://matias-obezzi.github.io/uiness/r/{name}.json"
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
| `theme` | CSS variables for light and dark, radius 0.75rem. Expects `tw-animate-css` imported in your globals. |
| `utils` | `cn()` on top of clsx and tailwind-merge. |
| `button`, `badge`, `card`, `input`, `textarea`, `label`, `checkbox`, `switch`, `separator` | Form and layout basics. |
| `select`, `combobox` | Pick from a list; the combobox searches. |
| `form` | Field wiring: ids, `aria-describedby`, `aria-invalid`, error messages. |
| `radio-group`, `slider`, `toggle`, `toggle-group`, `input-otp` | The rest of the form controls. |
| `dialog`, `drawer`, `dropdown-menu`, `tooltip`, `popover` | Overlays on Radix, animated with tw-animate-css. |
| `navbar` | Bar that becomes a menu or a bottom tab bar on phones. |
| `command` | Command palette with fuzzy search, plus `useCommandShortcut`. |
| `scroll-area` | Scrollable region with themed bars. |
| `spotlight`, `aurora`, `meteors`, `pattern`, `sparkles` | Animated backgrounds. |
| `text-generate`, `typewriter`, `flip-words`, `shimmer`, `number-ticker` | Animated text. |
| `reveal`, `tilt-card`, `marquee`, `moving-border`, `animated-tooltip`, `hover-highlight`, `compare`, `tracing-beam` | Motion pieces on CSS and the Web Animations API, no animation library. |
| `parallax-grid`, `sticky-scroll`, `timeline` | Scroll-linked pieces on `@uiness/scroll`. |
| `path-morph`, `link-preview` | SVG morphing and hover previews. |
| `bento-grid`, `sidebar`, `calendar`, `date-picker` | Layout and date picking, no date library. |
| `sortable`, `kanban`, `reorderable-grid`, `draggable` | Drag and drop on `@uiness/dnd`, every one of them also operable from the keyboard. |
| `dropzone` | Files dropped in from the desktop, checked by type, size and count. Native HTML drag and drop, no package behind it. |
| `use-in-view`, `use-reduced-motion` | Hooks the motion pieces share, installed into `hooks/`. |
| `alert`, `tabs`, `avatar`, `progress`, `skeleton` | Feedback and layout pieces. |
| `gallery` | Image grid with a full screen lightbox that flies from the thumbnail. Also exports `Lightbox`. |
| `island` | `<Island />` wired to the theme tokens, re-exports the `@uiness/island` API. |
| `image` | `<Image />` with theme defaults, re-exports the `@uiness/image` variants and hook. |
| `fx` | `<Fx />` canvas effects with theme defaults, re-exports every `@uiness/fx` effect. |
| `toast` | `<Toaster />` wired to the theme tokens, re-exports `toast()` from `@uiness/toast`. |

Components import the unified `radix-ui` package and mark themselves `'use client'` where they hold state, so they work in Next.js App Router out of the box.

## Development

Sources live in `registry/`. Every component has a live demo in the docs site under `apps/docs`.

`registry/registry.test.ts` guards the registry itself: unique names, every file present on disk, local dependencies namespaced with `@uiness/`, no dangling dependencies, and every `@/` import declared as a dependency. It runs with the rest of the tests.

```bash
pnpm --filter @uiness/ui test
pnpm --filter @uiness/ui build
```
