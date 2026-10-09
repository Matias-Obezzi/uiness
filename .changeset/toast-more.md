---
'@uiness/toast': minor
---

New: `toast.undo()` resolves whether its Undo button was used; identical toasts fold into one that counts up (`dedupe`, on by default for string titles); a `progress` bar empties as the time runs out, per toast or on the `Toaster`; Alt+T moves focus to the toasts, which stay open and wait while focused (`hotkey`); and `toast.update()` and `toast.isActive()`.

Fix: a toast updated again while leaving (the same `id` shortly after a dismiss) was still removed by the dismiss's clean up a second later, and had lost its timer. It now stays and leaves on its own time.
