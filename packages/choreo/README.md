<div align="center">

<img src="https://raw.githubusercontent.com/Matias-Obezzi/uiness/main/assets/logo.png" alt="" width="72" height="72" />

</div>

# @uiness/choreo

Animates a whole site from what is already on the page. It inspects the DOM, works out what each element is, a heading, copy, an image, a card, a grid of items, a button, a big number, and gives each one an entrance that plays as it scrolls into view. Nothing in your markup has to change. Zero dependencies, ESM and CommonJS, typed, and the core works without React.

[Documentation](https://uiness.vercel.app/docs/choreo) · [Registry](https://uiness.vercel.app/docs/installation) · [GitHub](https://github.com/Matias-Obezzi/uiness)

```bash
pnpm add @uiness/choreo
```

## React

```tsx
import { Choreo } from '@uiness/choreo'

// The whole page, including whatever a router renders later.
<Choreo />

// Or only what it wraps.
<Choreo className="space-y-12">
  <Hero />
  <Features />
</Choreo>
```

`useChoreo(options)` does the same from a hook and returns `replay`, `refresh` and the current `plan`.

## Without React

```ts
import { choreograph } from '@uiness/choreo/core'

const choreo = choreograph({ root: document.querySelector('main') })
choreo.replay()
choreo.stop()
```

Or with no build step at all, options on the tag:

```html
<script src="https://unpkg.com/@uiness/choreo/dist/auto.iife.js" data-debug defer></script>
```

## What it does

- **Reads the page.** Headings blur in, copy rises, media zooms in or slides from its side of a two column row, dividers draw across, large figures such as `12,500+` count up and land on the same text.
- **Finds groups.** Children of grids, lists and rows of alike siblings each come in as one piece, and whatever arrives together cascades in reading order.
- **Leaves the frame alone.** Fixed and sticky elements, hidden ones and anything already running a CSS animation are skipped.
- **Stays out of the way.** Movement is added to the element's own transform through the Web Animations API, and dropped once it ends. `stop()` removes every trace.
- **Keeps up.** A `MutationObserver` picks up elements added later, so route changes and loaded content come in too.
- **Adds touches.** A lift on cards and a press on buttons, only where the element has no transitions of its own.
- **Respects the reader.** Nothing moves with `prefers-reduced-motion`, or only fades with `reducedMotion: 'fade'`. Printing shows everything.

Steer it from the markup with `data-choreo="off"`, `data-choreo="left"` (any effect), `data-choreo="group"` and `data-choreo-delay="200"`, or from options: `effects`, `exclude`, `duration`, `stagger`, `distance`, `easing`, `offset`, `once`, `intro`, `observe`, `hover`, `counters`, `max`, `reducedMotion`, `scrub` (entrances follow the scroll), `onEnter` and `debug`, which outlines everything found by role. Besides the directions there are `rotate`, `flip` and `words`, which brings a line in word by word. `leave()` plays what is on screen out before navigating away.

`scan(root)` only inspects and returns the plan without touching the page.

## With the uiness registry

Prefer components that already follow your theme? uiness is also a registry for the shadcn CLI. Register it once in `components.json`:

```json
{
  "registries": {
    "@uiness": "https://uiness.vercel.app/r/{name}.json"
  }
}
```

Then add the item:

```bash
npx shadcn@latest add @uiness/choreo
```

The `choreo` item installs this package and a `<Choreo />` wrapper in `components/ui`.
