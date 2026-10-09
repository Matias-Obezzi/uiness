# @uiness/toast

## 0.3.0

### Minor Changes

- 857273f: New: `toast.undo()` resolves whether its Undo button was used; identical toasts fold into one that counts up (`dedupe`, on by default for string titles); a `progress` bar empties as the time runs out, per toast or on the `Toaster`; Alt+T moves focus to the toasts, which stay open and wait while focused (`hotkey`); and `toast.update()` and `toast.isActive()`.
  
  Fix: a toast updated again while leaving (the same `id` shortly after a dismiss) was still removed by the dismiss's clean up a second later, and had lost its timer. It now stays and leaves on its own time.

## 0.2.0

### Minor Changes

- c8b9452: `Toaster` takes `label` and `closeLabel`, to name the region and the close button in another language.

## 0.1.2

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.1

### Patch Changes

- 4096aa3: Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.

## 0.1.0

### Minor Changes

- e929701: Initial release: `toast()` with success, error, info, warning, loading, promise and custom variants, and a `<Toaster />` with a stack that expands on hover, swipe to dismiss, paused timers, actions and six positions.
