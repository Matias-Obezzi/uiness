import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ImageStatus, ImageVariant, VariantContext } from './types'
import { useImageLoad } from './use-image-load'
import { resolveVariant, type VariantName } from './variants'

export interface ImageProps
  extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'placeholder' | 'onProgress'> {
  src: string
  /**
   * Tiny version of the image (a data URI or a low resolution URL) shown while loading.
   * Around 16 to 32 px wide is plenty for the blur and pixelate variants.
   */
  placeholder?: string
  /** Built-in variant name or a custom `ImageVariant`. Default 'fade'. */
  variant?: VariantName | ImageVariant
  /** Transition duration in ms once the image is decoded. Default 600. */
  duration?: number
  /** CSS easing for the transition. Default 'cubic-bezier(0.4, 0, 0.2, 1)'. */
  easing?: string
  /**
   * Stream the image with `fetch` to animate on real download progress.
   * Needs CORS on the image host. `srcSet` and `sizes` are ignored in this mode.
   */
  progressive?: boolean
  /** Extra options for the progressive request. */
  fetchInit?: RequestInit
  /** Background color of the wrapper while loading (dominant color, brand color...). */
  color?: string
  /** Rendered inside the wrapper when the image fails to load. */
  fallback?: ReactNode
  /** Props for the wrapping `<span>` (className, style, data attributes...). */
  wrapperProps?: ComponentPropsWithoutRef<'span'>
  onProgress?: (progress: number) => void
  onStatusChange?: (status: ImageStatus) => void
}

const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

function mergeRefs<T>(...refs: Array<ForwardedRef<T> | ((node: T | null) => void) | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else ref.current = node
    }
  }
}

function ImageInner(
  {
    src,
    alt = '',
    placeholder,
    variant: variantProp,
    duration = 600,
    easing = DEFAULT_EASING,
    progressive = false,
    fetchInit,
    color,
    fallback,
    wrapperProps,
    onProgress,
    onStatusChange,
    onLoad,
    onError,
    srcSet,
    sizes,
    crossOrigin,
    loading,
    style,
    ...rest
  }: ImageProps,
  forwardedRef: ForwardedRef<HTMLImageElement>,
) {
  const variant = useMemo(() => resolveVariant(variantProp), [variantProp])

  const { status, progress, error, imgProps } = useImageLoad({
    src,
    srcSet,
    sizes,
    progressive,
    fetchInit,
    crossOrigin,
    lazy: loading === 'lazy',
    onProgress,
    onStatusChange,
  })

  // "Settled" means the load transition is over for the current `src`.
  const [settledFor, setSettledFor] = useState<string | null>(null)
  const settled = settledFor === src
  const settle = useCallback(() => setSettledFor(src), [src])

  const hasOverlay = Boolean(variant.overlay)
  useEffect(() => {
    if (status !== 'loaded' || hasOverlay || settled) return
    const timer = setTimeout(settle, duration)
    return () => clearTimeout(timer)
  }, [status, hasOverlay, settled, duration, settle])

  const imgRef = useRef<HTMLImageElement | null>(null)
  const setImgRef = useMemo(
    () => mergeRefs<HTMLImageElement>(imgProps.ref, forwardedRef, imgRef),
    [imgProps.ref, forwardedRef],
  )

  const objectFit = style?.objectFit ?? 'cover'
  const isLoaded = status === 'loaded'
  const ctx: VariantContext = {
    status,
    progress,
    error,
    value: isLoaded ? 1 : progressive ? progress : 0,
    progressive,
    duration,
    easing,
    hasPlaceholder: Boolean(placeholder),
    settled,
    objectFit,
  }

  const Overlay = variant.overlay
  const showPlaceholder = Boolean(placeholder) && !settled
  const showFallback = status === 'error' && fallback != null

  const wrapperStyle: CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden',
    maxWidth: '100%',
    lineHeight: 0,
    verticalAlign: 'middle',
    isolation: 'isolate',
    backgroundColor: settled ? undefined : color,
    ...variant.wrapper?.(ctx),
    ...wrapperProps?.style,
  }

  const imageStyle: CSSProperties = {
    ...variant.image?.(ctx),
    ...style,
    ...(showFallback ? { display: 'none' } : null),
  }

  const placeholderStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    zIndex: -1,
    pointerEvents: 'none',
    ...variant.placeholder?.(ctx),
  }

  return (
    <span
      {...wrapperProps}
      data-uiness-image=""
      data-status={status}
      data-variant={variant.name}
      data-progress={Math.round(ctx.value * 100)}
      style={wrapperStyle}
    >
      {showPlaceholder && (
        <img aria-hidden alt="" src={placeholder} draggable={false} style={placeholderStyle} />
      )}
      <img
        {...rest}
        ref={setImgRef}
        src={imgProps.src}
        srcSet={imgProps.srcSet}
        sizes={imgProps.sizes}
        crossOrigin={imgProps.crossOrigin}
        alt={alt}
        loading={loading}
        decoding={rest.decoding ?? 'async'}
        style={imageStyle}
        onLoad={(event) => {
          imgProps.onLoad()
          onLoad?.(event)
        }}
        onError={(event) => {
          imgProps.onError()
          onError?.(event)
        }}
      />
      {Overlay && !settled && (
        <Overlay ctx={ctx} imgRef={imgRef} placeholder={placeholder} onComplete={settle} />
      )}
      {showFallback && fallback}
    </span>
  )
}

/**
 * Drop-in `<img>` replacement with a loading transition.
 *
 * @example
 * <Image src="/photo.jpg" placeholder={tinyDataUri} variant="blur" width={800} height={600} />
 */
export const Image = forwardRef(ImageInner)
Image.displayName = 'Image'
