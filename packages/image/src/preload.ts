export interface PreloadOptions {
  srcSet?: string
  sizes?: string
  crossOrigin?: 'anonymous' | 'use-credentials'
}

/**
 * Download and decode an image ahead of time, like the next photo of a gallery, so showing it
 * later is instant. Resolves with the decoded element, rejects when it fails to load.
 */
export function preloadImage(src: string, options: PreloadOptions = {}): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (options.crossOrigin) img.crossOrigin = options.crossOrigin
    // `sizes` before `srcset`, so the browser picks the candidate with both known.
    if (options.sizes) img.sizes = options.sizes
    if (options.srcSet) img.srcset = options.srcSet
    img.onload = () => {
      // Decoding off the main thread where it can; a failed decode still loaded.
      if (typeof img.decode === 'function')
        img.decode().then(
          () => resolve(img),
          () => resolve(img),
        )
      else resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })
}

/** `preloadImage` for several, in parallel. Rejects as soon as one fails. */
export function preloadImages(
  sources: Array<string | (PreloadOptions & { src: string })>,
): Promise<HTMLImageElement[]> {
  return Promise.all(
    sources.map((source) =>
      typeof source === 'string' ? preloadImage(source) : preloadImage(source.src, source),
    ),
  )
}
