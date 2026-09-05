# @uiness/ui

Component registry for React: Radix primitives styled with Tailwind v4, installed into your project with the shadcn CLI. The code lands in your repo, so you own it and can change it.

The theme uses the same CSS variable names as shadcn/ui, so uiness components and shadcn components live together in one project without extra work.

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
| `dialog`, `drawer`, `dropdown-menu`, `tooltip`, `popover` | Overlays on Radix, animated with tw-animate-css. |
| `navbar` | Bar that becomes a menu or a bottom tab bar on phones. |
| `command` | Command palette with fuzzy search, plus `useCommandShortcut`. |
| `scroll-area` | Scrollable region with themed bars. |
| `spotlight`, `aurora`, `meteors`, `pattern`, `sparkles` | Animated backgrounds. |
| `text-generate`, `typewriter`, `flip-words`, `shimmer`, `number-ticker` | Animated text. |
| `reveal`, `tilt-card`, `marquee`, `moving-border`, `animated-tooltip`, `hover-highlight`, `compare`, `tracing-beam` | Motion pieces on CSS and the Web Animations API, no animation library. |
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

```bash
pnpm --filter @uiness/ui test
pnpm --filter @uiness/ui build
```
