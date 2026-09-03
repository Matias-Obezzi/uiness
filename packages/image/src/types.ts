import type { ComponentType, CSSProperties, RefObject } from 'react'

export type ImageStatus = 'loading' | 'loaded' | 'error'

export interface ImageLoadState {
  status: ImageStatus
  /**
   * Download progress from 0 to 1.
   * Without `progressive` it jumps from 0 to 1 when the image finishes loading.
   * With `progressive` it follows the bytes received, reaching 1 once the image is decoded.
   */
  progress: number
  error: Error | null
}

export type ObjectFit = NonNullable<CSSProperties['objectFit']>

/** Everything a variant needs to compute its styles for the current frame. */
export interface VariantContext extends ImageLoadState {
  /** Effective progress: identical to `progress` in progressive mode, otherwise 0 or 1. */
  value: number
  progressive: boolean
  /** Duration in ms of the transition that plays when the image finishes loading. */
  duration: number
  easing: string
  /** Whether a `placeholder` image was provided. */
  hasPlaceholder: boolean
  /** True once the image is loaded and the variant's transition (or overlay) has finished. */
  settled: boolean
  objectFit: ObjectFit
}

export interface VariantOverlayProps {
  ctx: VariantContext
  imgRef: RefObject<HTMLImageElement | null>
  placeholder?: string
  /** Call once the overlay finished its transition so the real image can take over. */
  onComplete: () => void
}

export interface ImageVariant {
  /** Exposed as `data-variant` on the wrapper. */
  name: string
  wrapper?: (ctx: VariantContext) => CSSProperties | undefined
  image?: (ctx: VariantContext) => CSSProperties | undefined
  placeholder?: (ctx: VariantContext) => CSSProperties | undefined
  /**
   * Optional element rendered on top of the image (absolutely positioned inside the wrapper).
   * The variant is considered settled only after the overlay calls `onComplete`.
   */
  overlay?: ComponentType<VariantOverlayProps>
}
