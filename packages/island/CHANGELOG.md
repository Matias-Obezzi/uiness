# @uiness/island

## 0.1.1

### Patch Changes

- 4096aa3: Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.

## 0.1.0

### Minor Changes

- a4f2711: Initial release: `<Island />` renderer with spring morph, `island` store with `show`, `update`, `dismiss`, stacking, auto dismiss with hover pause, and built-in `confirm`, `alert` and `promise`.
