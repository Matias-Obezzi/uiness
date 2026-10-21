---
'@uiness/dnd': minor
---

`getHandleProps(id, { listItem: true })` for sortables and groups whose whole row is an `<li>`: the row keeps its list item role, with no `role="button"` or `aria-pressed`, so screen readers still count the list and say where the row is. Keyboard, pointer and announcements work as before. Without the option nothing changes.
