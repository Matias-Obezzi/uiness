---
'@uiness/fx': patch
---

A `<Fx>` without an `alt`, or with `alt=""`, is decorative: the canvas is hidden from screen readers instead of being an image with no name, as an `<img alt="">` is. With an `alt` it is still `role="img"` with that name.
