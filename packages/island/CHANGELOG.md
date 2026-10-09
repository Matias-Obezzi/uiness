# @uiness/island

## 0.2.0

### Minor Changes

- 1749190: Five new functions on the store: `prompt()` asks for a line of text, `choose()` offers a few options, `undo()` says something happened with a button to take it back, `progress()` shows a ring with `set()` and `done()`, and `timer()` counts down and leaves at zero.
  
  Fixes: only the entry on screen counts down its `duration` now, so one covered by another entry no longer expires unseen. Dialogs on an island with `idle={false}` now receive focus: the box was still `visibility: hidden` when focus moved, and nothing hidden can take it. The text of the accent button is themable through `--island-accent-color`, so a light accent on a light island stays readable. The size morph no longer bounces at the end of an opening: it measured the incoming content while its own entrance scaled it down, so a re-render mid-way (the previous content leaving does one) sent the box towards a smaller size, clipping the padding until the animation ended.

## 0.1.2

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.1

### Patch Changes

- 4096aa3: Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.

## 0.1.0

### Minor Changes

- a4f2711: Initial release: `<Island />` renderer with spring morph, `island` store with `show`, `update`, `dismiss`, stacking, auto dismiss with hover pause, and built-in `confirm`, `alert` and `promise`.
