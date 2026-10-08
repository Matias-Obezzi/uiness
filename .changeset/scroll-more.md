---
'@uiness/scroll': minor
---

New: `useScrollDirection()` and `observeScrollDirection()`, which flip only after a threshold; `useScrollVelocity()` and `observeScrollVelocity()` in pixels per second; `useStuck()` and `isStuck()` for `position: sticky` elements, transforms discounted; `scrollToElement()` with an offset, a duration and an easing, stopping when the reader scrolls; and `useScrollLock()` / `lockScroll()`, nested and keeping the scrollbar's room.

Fixes: inside a bordered scrolling box, progress and the active section were measured from the border's outer edge instead of the scrolling area, off by the border's width. `useParallax` now stays put for readers who ask for reduced motion.
