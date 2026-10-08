---
'@uiness/fx': minor
---

Five new effects: `duotone(dark, light)`, `hueRotate(degrees)`, `sharpen(amount)`, `kaleidoscope(segments, rotation)` and `pixelSort({ low, high, direction, reverse })`. The animation loop of `<Fx>` now pauses while the canvas is off screen and does not start for readers who ask for reduced motion, unless `animate` says otherwise. The scratch canvas pool keeps at most eight sizes, so a canvas that follows a resize no longer leaves one canvas behind per frame of it.
