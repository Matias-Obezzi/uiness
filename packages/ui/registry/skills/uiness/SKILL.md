---
name: uiness
description: Use when building React UI with uiness, the shadcn-compatible registry at uiness.vercel.app (Radix and Tailwind CSS v4 components, page blocks, drag and drop, motion pieces), when a project's components.json lists the @uiness registry, when code imports @uiness/* packages, or when asked to add, find, translate or restyle uiness components.
---

# uiness

uiness is a component registry installed with the shadcn CLI: the source of each item lands in the project (`components/ui`, `components`, `hooks`, `lib`) and becomes the project's own code. It also publishes small npm packages: `@uiness/image`, `@uiness/island`, `@uiness/fx`, `@uiness/toast`, `@uiness/scroll`, `@uiness/dnd` and `@uiness/choreo`, which have registry items wired to the theme.

## Install

The registry has to be in `components.json` once (run `npx shadcn@latest init` first if the file is missing):

```json
{
  "registries": {
    "@uiness": "https://uiness.vercel.app/r/{name}.json"
  }
}
```

Then add items by name. Their npm dependencies, `lib/utils.ts` and the items they build on come along:

```bash
npx shadcn@latest add @uiness/theme
npx shadcn@latest add @uiness/button @uiness/dialog @uiness/hero-01
```

The `theme` item writes the CSS variables into the global stylesheet, which must import `tailwindcss` and `tw-animate-css`. Components go to `components/ui`, blocks (`hero-01`, `pricing-01`, `navbar-01`...) to `components`, to be edited. Check whether an item is already installed before adding it again, and never install over a file the user has changed without asking.

## Look things up instead of guessing

Do not invent props: every item documents its API. In order of preference:

1. The MCP server at `https://uiness.vercel.app/api/mcp`, if it is connected: `search_items` (find by what it does), `get_item` (source, dependencies and docs of one item), `get_docs` (any page as Markdown), `list_items`, `get_setup`.
2. Markdown docs: `https://uiness.vercel.app/llms.txt` lists every page; add `.md` to any docs URL, like `https://uiness.vercel.app/docs/components/button.md`. Everything in one file: `https://uiness.vercel.app/llms-full.txt`.
3. The item itself, with the source inline: `https://uiness.vercel.app/r/<name>.json`.
4. Once installed, the file in the project is the truth: read it.

## Conventions to keep

When using or changing uiness code, write it the way the registry is written:

- **Theme tokens, never raw colors.** Use `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border`, `ring-ring`, `bg-destructive`, `--chart-1` to `--chart-5` for data. No hex, no `bg-white`, no `text-gray-500`: they break dark mode and custom themes. Layers come from the scale (`z-(--z-overlay,50)`, `z-(--z-popover,60)`), motion from the tokens (`duration-(--duration-normal,200ms)`, `ease-(--easing-standard,cubic-bezier(0.2,0,0,1))`).
- **`cn()` for classes.** Import it from `@/lib/utils` and merge the caller's `className` last: `cn('base classes', className)`. Components spread the rest of their props onto the root element and set a `data-slot`.
- **Radix through the umbrella package.** `import { Dialog as DialogPrimitive } from 'radix-ui'`, not `@radix-ui/react-dialog`. Components that hold state start with `'use client'`.
- **Every word through labels.** Components with words of their own take `labels` (a partial of `XLabels`, defaults in `defaultXLabels`) and read `LabelsProvider` from `@/lib/labels`. Never hardcode a user-facing string, `aria-label` included, inside a component; add it to its labels. To translate an app, wrap it once:

  ```tsx
  'use client'

  import { LabelsProvider } from '@/lib/labels'
  import { es } from '@/lib/labels-es'

  export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <LabelsProvider labels={es} locale="es">
        {children}
      </LabelsProvider>
    )
  }
  ```

  Packs: `labels-en`, `labels-es`, `labels-pt`, `labels-fr`, `labels-it`, `labels-zh` (`npx shadcn@latest add @uiness/labels-es`). Your own components get the same layers with `useLabels('component-name', defaults, labelsProp)` and the locale with `useLocale()`. Dates and numbers go through `Intl` with that locale.
- **Blocks take their content through props.** Pass the copy, links and actions as props (`title`, `description`, `primaryAction={{ label, href }}`, `null` to hide one), and the blocks that show a logo or company name take `brand` (`{ name, href, logo }` and similar). Do not edit the defaults to change the words of one page. Blocks lay themselves out with container queries, so they fit any column.
- **Reduced motion.** Anything that moves must calm down under `prefers-reduced-motion`: `motion-reduce:` variants in classes, or `useReducedMotion()` from `@/hooks/use-reduced-motion` in effects and the Web Animations API. The theme already shortens CSS animations; JavaScript-driven motion is on you.
- **Accessible by default.** Real buttons and links, a visible focus ring (`focus-visible:ring-[3px] focus-visible:ring-ring/50`), an accessible name on every icon button, state in ARIA (`aria-current`, `aria-expanded`, `aria-invalid`, `aria-busy`), full keyboard support (drag and drop included), and status shown in words, not only color. Keep what the Radix primitives give you rather than replacing it with divs.

## Packages

Use the registry item when there is one (`npx shadcn@latest add @uiness/toast` installs `@uiness/toast` plus a wrapper wired to the theme), and import from `@/components/ui/toast` in app code. The packages themselves have no runtime dependencies and work without the registry; their pages are `/docs/image`, `/docs/island`, `/docs/fx`, `/docs/toast`, `/docs/scroll`, `/docs/dnd` and `/docs/choreo`.
