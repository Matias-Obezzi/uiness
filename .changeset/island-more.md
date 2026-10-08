---
'@uiness/island': minor
---

Five new functions on the store: `prompt()` asks for a line of text, `choose()` offers a few options, `undo()` says something happened with a button to take it back, `progress()` shows a ring with `set()` and `done()`, and `timer()` counts down and leaves at zero.

Fixes: only the entry on screen counts down its `duration` now, so one covered by another entry no longer expires unseen. Dialogs on an island with `idle={false}` now receive focus: the box was still `visibility: hidden` when focus moved, and nothing hidden can take it. The text of the accent button is themable through `--island-accent-color`, so a light accent on a light island stays readable.
