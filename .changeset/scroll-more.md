---
'@uiness/scroll': minor
---

New: `useScrollDirection()` and `observeScrollDirection()`, which flip only after a threshold; `useScrollVelocity()` and `observeScrollVelocity()` in pixels per second; `useStuck()` and `isStuck()` for `position: sticky` elements, transforms discounted; `scrollToElement()` with an offset, a duration and an easing, stopping when the reader scrolls; and `useScrollLock()` / `lockScroll()`, nested and keeping the scrollbar's room. Horizontal rows: `useActiveSection` and `activeIndexAt` take an `axis` and measure a list that is its own scroller against itself, `useScrollDirection` names `left` and `right`, `useActiveSection` picks the first section at the start of the scroll and the last at its end, even one too short to reach the anchor, `useScrollEdges()` tells the start and the end of a row, and `useHorizontalWheel()` lets a mouse wheel scroll it sideways.

Fixes: inside a bordered scrolling box, progress and the active section were measured from the border's outer edge instead of the scrolling area, off by the border's width. `useParallax` now stays put for readers who ask for reduced motion.
