# @uiness/scroll

Scroll-linked motion primitives for React. Progress of an element through the viewport, parallax that writes straight to the DOM, and the active section for sticky panels. Zero dependencies, ESM and CommonJS, typed.

```bash
pnpm add @uiness/scroll
```

## Progress

```tsx
import { useScrollProgress } from '@uiness/scroll'

const ref = useRef<HTMLDivElement>(null)
const progress = useScrollProgress(ref, { offset: ['start end', 'end start'] })

<div ref={ref} style={{ opacity: progress }} />
```

An offset pair says when progress is 0 and when it is 1. Each entry is `"<element edge> <viewport edge>"`: `'start end'` means the top of the element meets the bottom of the viewport, `'end start'` means the bottom of the element meets the top. Edges are `start`, `center`, `end`, a number from 0 to 1, or a pixel string.

`useScrollEffect(ref, callback, options)` runs a callback instead of updating state, at most once per frame. `useParallax(ref, { speed })` moves an element at a different rate than the page. `useActiveSection(ref, { anchor })` returns the index of the child closest to a line across the viewport.

## Without React

```ts
import { observeScrollProgress, scrollProgress, activeIndexAt, mapRange } from '@uiness/scroll'

const stop = observeScrollProgress(element, { offset: ['start end', 'end start'] }, ({ progress }) => {
  element.style.opacity = String(progress)
})
```

## Notes

Reads use `getBoundingClientRect`, batched to one per frame with `requestAnimationFrame`, and a `ResizeObserver` keeps the numbers right when the element changes size. Pass `container` to follow an element inside a scrolling box instead of the window.
