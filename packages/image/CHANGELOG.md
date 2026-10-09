# @uiness/image

## 0.2.0

### Minor Changes

- f6beb3d: New: `retry` and `retryDelay` try a failed image again with a growing wait, keeping the URL as given, and `useImageLoad` returns `retry()`; `ratio` reserves the box before the image loads; `preloadImage()` and `preloadImages()` download and decode ahead of time; and two variants, `zoom` and `grayscale`.
  
  Fixes: an inline `fetchInit` object no longer restarts the progressive download on every render, which every received chunk triggered again; it is read when the download starts. With `prefers-reduced-motion` the image appears the moment it loads, without transition or overlay animation.

## 0.1.1

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.0

### Minor Changes

- fba7b39: Initial release: `<Image>` with fade, blur, pixelate, reveal and bar variants, custom variants, `useImageLoad` hook and progressive mode with real download progress.
