---
'@uiness/image': minor
---

New: `retry` and `retryDelay` try a failed image again with a growing wait, keeping the URL as given, and `useImageLoad` returns `retry()`; `ratio` reserves the box before the image loads; `preloadImage()` and `preloadImages()` download and decode ahead of time; and two variants, `zoom` and `grayscale`.

Fixes: an inline `fetchInit` object no longer restarts the progressive download on every render, which every received chunk triggered again; it is read when the download starts. With `prefers-reduced-motion` the image appears the moment it loads, without transition or overlay animation.
