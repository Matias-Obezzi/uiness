# @uiness/dnd

## 0.1.0

### Minor Changes

- db13138: Initial release: `useSortable`, `useSortableGroups`, `useDraggable` and `useDragGesture` for React, on top of a framework agnostic core with `dragReducer`, `arrayMove`, `moveItem`, `insertionIndex`, `autoScrollSpeed` and the collision detectors. Every drag runs on Pointer Events or on the keyboard alone, is read out through an `aria-live` region you can rewrite, auto scrolls near the edges of a scrollable ancestor, and puts everything back on escape.
