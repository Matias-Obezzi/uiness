# @uiness/dnd

## 0.1.2

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.1

### Patch Changes

- 4096aa3: Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.

## 0.1.0

### Minor Changes

- db13138: Initial release: `useSortable`, `useSortableGroups`, `useDraggable` and `useDragGesture` for React, on top of a framework agnostic core with `dragReducer`, `arrayMove`, `moveItem`, `insertionIndex`, `autoScrollSpeed` and the collision detectors. Every drag runs on Pointer Events or on the keyboard alone, is read out through an `aria-live` region you can rewrite, auto scrolls near the edges of a scrollable ancestor, and puts everything back on escape.
