# @uiness/toast

## 0.1.2

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.1

### Patch Changes

- 4096aa3: Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.

## 0.1.0

### Minor Changes

- e929701: Initial release: `toast()` with success, error, info, warning, loading, promise and custom variants, and a `<Toaster />` with a stack that expands on hover, swipe to dismiss, paused timers, actions and six positions.
