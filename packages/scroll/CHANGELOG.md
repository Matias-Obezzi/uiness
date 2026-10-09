# @uiness/scroll

## 0.3.0

### Minor Changes

- c69e127: New: `useScrollDirection()` and `observeScrollDirection()`, which flip only after a threshold; `useScrollVelocity()` and `observeScrollVelocity()` in pixels per second; `useStuck()` and `isStuck()` for `position: sticky` elements, transforms discounted; `scrollToElement()` with an offset, a duration and an easing, stopping when the reader scrolls; and `useScrollLock()` / `lockScroll()`, nested and keeping the scrollbar's room. Horizontal rows: `useActiveSection` and `activeIndexAt` take an `axis` and measure a list that is its own scroller against itself, `useScrollDirection` names `left` and `right`, `useActiveSection` picks the first section at the start of the scroll and the last at its end, even one too short to reach the anchor, `useScrollEdges()` tells the start and the end of a row, and `useHorizontalWheel()` lets a mouse wheel scroll it sideways.
  
  Fixes: inside a bordered scrolling box, progress and the active section were measured from the border's outer edge instead of the scrolling area, off by the border's width. `useParallax` now stays put for readers who ask for reduced motion.

## 0.2.1

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.2.0

### Minor Changes

- 5a8d867: Measure against the box an element actually scrolls inside. The nearest scrolling ancestor is now found for you, so `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` answer to the panel they are in rather than to the window. Before this, an element in a scrolling panel followed a scroll nobody was performing, which read as the effect being dead. `container` still names one explicitly, `null` still asks for the window on purpose, and `scrollParent` is exported for anyone who wants the lookup on its own.

## 0.1.0

### Minor Changes

- 4181923: Initial release: `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` for React, on top of a framework agnostic core with `scrollProgress`, `observeScrollProgress`, `activeIndexAt` and `mapRange`. Offsets read like `['start end', 'end start']`, reads are batched to one per frame, and a `ResizeObserver` keeps them right when the element changes size.
