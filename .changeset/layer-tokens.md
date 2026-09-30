---
"@uiness/island": patch
"@uiness/toast": patch
"@uiness/dnd": patch
---

Stack on the theme's layer scale. The island reads `--z-island`, the toaster `--z-toast` and the drag overlay `--z-drag`, falling back to the values they had before (9999, 9999 and 1000) when the variables are not defined. The island's `zIndex` prop now also takes a string.
