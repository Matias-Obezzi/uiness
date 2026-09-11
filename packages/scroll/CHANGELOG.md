# @uiness/scroll

## 0.2.0

### Minor Changes

- 5a8d867: Measure against the box an element actually scrolls inside. The nearest scrolling ancestor is now found for you, so `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` answer to the panel they are in rather than to the window. Before this, an element in a scrolling panel followed a scroll nobody was performing, which read as the effect being dead. `container` still names one explicitly, `null` still asks for the window on purpose, and `scrollParent` is exported for anyone who wants the lookup on its own.

## 0.1.0

### Minor Changes

- 4181923: Initial release: `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` for React, on top of a framework agnostic core with `scrollProgress`, `observeScrollProgress`, `activeIndexAt` and `mapRange`. Offsets read like `['start end', 'end start']`, reads are batched to one per frame, and a `ResizeObserver` keeps them right when the element changes size.
