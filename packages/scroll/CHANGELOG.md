# @uiness/scroll

## 0.1.0

### Minor Changes

- 4181923: Initial release: `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` for React, on top of a framework agnostic core with `scrollProgress`, `observeScrollProgress`, `activeIndexAt` and `mapRange`. Offsets read like `['start end', 'end start']`, reads are batched to one per frame, and a `ResizeObserver` keeps them right when the element changes size.
