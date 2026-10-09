---
'@uiness/dnd': minor
---

New: `activationDelay` and `activationTolerance` start a touch or pen drag on a long press, so a list of handles still scrolls by touch, while a mouse drag starts right away; `haptics` buzzes on pick up and drop; `grid` snaps `useDraggable` to cells; `useDropTarget()` gives a free-dragged element places to land, with `onDrop` and `onDropOn`; and `useDropZone()` takes files dropped from outside the page, with `accept`, `multiple`, `onReject` and a file picker. The options work on every hook.
