# @uiness/fx

## 0.2.0

### Minor Changes

- ebb5093: Five new effects: `duotone(dark, light)`, `hueRotate(degrees)`, `sharpen(amount)`, `kaleidoscope(segments, rotation)` and `pixelSort({ low, high, direction, reverse })`. The animation loop of `<Fx>` now pauses while the canvas is off screen and does not start for readers who ask for reduced motion, unless `animate` says otherwise. The scratch canvas pool keeps at most eight sizes, so a canvas that follows a resize no longer leaves one canvas behind per frame of it.

## 0.1.1

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.0

### Minor Changes

- 07524e8: Initial release: `<Fx />` canvas component with composable pixel and canvas effects (pixelate, blur, color adjustments, posterize, threshold, palette, dither, scanlines, noise, vignette, chromatic, glitch, halftone, ascii, edge, emboss, crt), animation loop and `renderEffects` for use outside React.
