---
'@uiness/scroll': minor
---

Measure against the box an element actually scrolls inside. The nearest scrolling ancestor is now found for you, so `useScrollProgress`, `useScrollEffect`, `useParallax` and `useActiveSection` answer to the panel they are in rather than to the window. Before this, an element in a scrolling panel followed a scroll nobody was performing, which read as the effect being dead. `container` still names one explicitly, `null` still asks for the window on purpose, and `scrollParent` is exported for anyone who wants the lookup on its own.
