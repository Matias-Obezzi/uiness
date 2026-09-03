import type { CSSProperties } from 'react'
import { BarOverlay, PixelateOverlay } from './overlays'
import type { ImageVariant, VariantContext, VariantOverlayProps } from './types'

/** 1 when the image is decoded, otherwise 0. Use for the swap placeholder -> image. */
const loaded = (ctx: VariantContext) => (ctx.status === 'loaded' ? 1 : 0)

/**
 * Transition string for the given properties. While bytes are still arriving in
 * progressive mode, use a short duration so progress updates feel continuous.
 */
const transition = (ctx: VariantContext, props: string[]): string => {
  const ms = ctx.progressive && ctx.status !== 'loaded' ? Math.min(ctx.duration, 200) : ctx.duration
  return props.map((p) => `${p} ${ms}ms ${ctx.easing}`).join(', ')
}

/** No animation at all. Useful as a base for custom variants or to opt out. */
export const none: ImageVariant = { name: 'none' }

/** Cross fade from the placeholder (or the `color`) to the image. */
export const fade: ImageVariant = {
  name: 'fade',
  image: (ctx) => ({
    opacity: loaded(ctx),
    transition: transition(ctx, ['opacity']),
  }),
}

export interface BlurOptions {
  /** Blur radius in px at progress 0. Default 20. */
  amount?: number
  /** Scale applied to the blurred layers to hide soft edges. Default 1.08. */
  scale?: number
}

/**
 * Blurred placeholder that sharpens as the image arrives.
 * In progressive mode the blur radius follows the real download progress.
 */
export function blur({ amount = 20, scale = 1.08 }: BlurOptions = {}): ImageVariant {
  const radius = (ctx: VariantContext) => amount * (1 - ctx.value)
  return {
    name: 'blur',
    placeholder: (ctx) => ({
      filter: `blur(${radius(ctx)}px)`,
      transform: `scale(${scale})`,
      transition: transition(ctx, ['filter']),
    }),
    image: (ctx) => ({
      opacity: loaded(ctx),
      filter: ctx.settled ? undefined : `blur(${radius(ctx)}px)`,
      transform: ctx.settled ? undefined : `scale(${loaded(ctx) ? 1 : scale})`,
      transition: transition(ctx, ['opacity', 'filter', 'transform']),
    }),
  }
}

export interface PixelateOptions {
  /** Largest block size in CSS px. Default 32. */
  size?: number
}

/**
 * Low resolution mosaic that refines into the final image, like an image
 * requested at increasing quality. Uses a canvas overlay, so it works even
 * without a placeholder: the real image is revealed block by block once loaded.
 */
export function pixelate({ size = 32 }: PixelateOptions = {}): ImageVariant {
  const Overlay = (props: VariantOverlayProps) => <PixelateOverlay {...props} size={size} />
  return {
    name: 'pixelate',
    image: (ctx) => ({ opacity: ctx.settled ? 1 : 0 }),
    placeholder: () => ({ opacity: 0 }),
    overlay: Overlay,
  }
}

export type RevealDirection = 'left' | 'right' | 'top' | 'bottom'

export interface RevealOptions {
  /** Edge the wipe starts from. Default 'left'. */
  from?: RevealDirection
}

const clip = (from: RevealDirection, hidden: number): string => {
  const pct = `${hidden * 100}%`
  switch (from) {
    case 'left':
      return `inset(0 ${pct} 0 0)`
    case 'right':
      return `inset(0 0 0 ${pct})`
    case 'top':
      return `inset(0 0 ${pct} 0)`
    case 'bottom':
      return `inset(${pct} 0 0 0)`
  }
}

/** Wipes the image in over the placeholder once it is decoded. */
export function reveal({ from = 'left' }: RevealOptions = {}): ImageVariant {
  return {
    name: 'reveal',
    image: (ctx) => ({
      clipPath: ctx.settled ? undefined : clip(from, 1 - loaded(ctx)),
      transition: transition(ctx, ['clip-path']),
    }),
  }
}

export interface BarOptions {
  /** Bar thickness in px. Default 3. */
  thickness?: number
}

/**
 * Thin progress bar at the bottom edge plus a fade in. The bar color is
 * `currentColor`, so set `color` on the wrapper to theme it.
 * Pairs with `progressive`; without it the bar only appears at completion.
 */
export function bar({ thickness = 3 }: BarOptions = {}): ImageVariant {
  const Overlay = (props: VariantOverlayProps) => <BarOverlay {...props} thickness={thickness} />
  return {
    name: 'bar',
    image: (ctx) => ({
      opacity: loaded(ctx),
      transition: transition(ctx, ['opacity']),
    }),
    overlay: Overlay,
  }
}

export const variants = {
  none,
  fade,
  blur: blur(),
  pixelate: pixelate(),
  reveal: reveal(),
  bar: bar(),
} satisfies Record<string, ImageVariant>

export type VariantName = keyof typeof variants

export function resolveVariant(variant: VariantName | ImageVariant | undefined): ImageVariant {
  if (!variant) return variants.fade
  if (typeof variant === 'string') {
    const found = variants[variant]
    if (!found) throw new Error(`[@uiness/image] Unknown variant "${variant}"`)
    return found
  }
  return variant
}

/** Helper for authoring custom variants with full type inference. */
export function defineVariant(variant: ImageVariant): ImageVariant {
  return variant
}

export type { CSSProperties }
