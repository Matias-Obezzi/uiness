import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ImageLoadState, ImageStatus } from './types'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface UseImageLoadOptions {
  src?: string
  srcSet?: string
  sizes?: string
  /**
   * Download the image with `fetch` to report real byte progress.
   * Requires CORS on the image host and ignores `srcSet` / `sizes`.
   */
  progressive?: boolean
  /** Extra options for the progressive `fetch` (headers, credentials, cache...). */
  fetchInit?: RequestInit
  crossOrigin?: 'anonymous' | 'use-credentials' | ''
  /**
   * With `progressive`, delay the download until the element is near the viewport,
   * mirroring `<img loading="lazy">`.
   */
  lazy?: boolean
  /** Root margin used for the lazy intersection observer. */
  lazyMargin?: string
  onProgress?: (progress: number) => void
  onStatusChange?: (status: ImageStatus) => void
}

export interface ImgProps {
  ref: (node: HTMLImageElement | null) => void
  src: string | undefined
  srcSet: string | undefined
  sizes: string | undefined
  crossOrigin: UseImageLoadOptions['crossOrigin']
  onLoad: () => void
  onError: () => void
}

export interface UseImageLoadResult extends ImageLoadState {
  /** Spread these on the `<img>` element. */
  imgProps: ImgProps
}

interface InternalState extends ImageLoadState {
  key: string | undefined
}

const initialState = (key: string | undefined): InternalState => ({
  key,
  status: 'loading',
  progress: 0,
  error: null,
})

/**
 * Tracks the loading state of an `<img>` element.
 *
 * Detects images already in the browser cache, supports `src` changes,
 * and optionally streams the image through `fetch` for real progress.
 */
export function useImageLoad(options: UseImageLoadOptions = {}): UseImageLoadResult {
  const {
    src,
    srcSet,
    sizes,
    progressive = false,
    fetchInit,
    crossOrigin,
    lazy = false,
    lazyMargin = '200px',
    onProgress,
    onStatusChange,
  } = options

  const imgRef = useRef<HTMLImageElement | null>(null)
  const [state, setState] = useState<InternalState>(() => initialState(src))
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [visible, setVisible] = useState(!lazy)

  // Reset when the source changes (state derived from props, applied during render).
  if (state.key !== src) {
    setState(initialState(src))
  }

  const callbacks = useRef({ onProgress, onStatusChange })
  callbacks.current = { onProgress, onStatusChange }

  // Notify after commit, never from inside a state updater (that runs during render).
  const notified = useRef({ status: state.status, progress: state.progress })
  useEffect(() => {
    const prev = notified.current
    if (prev.status !== state.status) callbacks.current.onStatusChange?.(state.status)
    if (prev.progress !== state.progress) callbacks.current.onProgress?.(state.progress)
    notified.current = { status: state.status, progress: state.progress }
  }, [state.status, state.progress])

  const update = useCallback((patch: Partial<ImageLoadState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      if (
        next.status === prev.status &&
        next.progress === prev.progress &&
        next.error === prev.error
      ) {
        return prev
      }
      return next
    })
  }, [])

  const markLoaded = useCallback(
    () => update({ status: 'loaded', progress: 1, error: null }),
    [update],
  )
  const markError = useCallback((error: Error) => update({ status: 'error', error }), [update])

  const setRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node
  }, [])

  // Lazy gate for the progressive fetch.
  useEffect(() => {
    if (!lazy || visible) return
    const node = imgRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: lazyMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [lazy, visible, lazyMargin])

  // Progressive download.
  useEffect(() => {
    if (!progressive || !src || !visible) {
      setObjectUrl(null)
      return
    }
    const controller = new AbortController()
    let url: string | null = null

    const run = async () => {
      const response = await fetch(src, {
        credentials: crossOrigin === 'use-credentials' ? 'include' : undefined,
        ...fetchInit,
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Image request failed with status ${response.status}`)

      const total = Number(response.headers.get('content-length')) || 0
      const type = response.headers.get('content-type') ?? undefined
      let blob: Blob

      if (response.body && total > 0) {
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let received = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          received += value.byteLength
          // Keep a little headroom: 1 is reserved for "decoded and painted".
          update({ progress: Math.min(received / total, 0.99) })
        }
        blob = new Blob(chunks as BlobPart[], { type })
      } else {
        blob = await response.blob()
        update({ progress: 0.99 })
      }

      url = URL.createObjectURL(blob)
      setObjectUrl(url)
    }

    run().catch((error: unknown) => {
      if (controller.signal.aborted) return
      markError(error instanceof Error ? error : new Error(String(error)))
    })

    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [progressive, src, visible, crossOrigin, fetchInit, update, markError])

  const effectiveSrc = progressive ? (objectUrl ?? undefined) : src

  // Images served from cache can be complete before React attaches `onLoad`.
  useIsomorphicLayoutEffect(() => {
    const node = imgRef.current
    if (!node || !effectiveSrc) return
    if (node.complete && node.naturalWidth > 0) markLoaded()
  }, [effectiveSrc, markLoaded])

  const onLoad = useCallback(() => markLoaded(), [markLoaded])
  const onError = useCallback(
    () => markError(new Error(`Failed to load image${src ? `: ${src}` : ''}`)),
    [markError, src],
  )

  return {
    status: state.status,
    progress: state.progress,
    error: state.error,
    imgProps: {
      ref: setRef,
      src: effectiveSrc,
      srcSet: progressive ? undefined : srcSet,
      sizes: progressive ? undefined : sizes,
      crossOrigin,
      onLoad,
      onError,
    },
  }
}
