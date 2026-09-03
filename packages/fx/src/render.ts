import {
  createRandom,
  type Effect,
  type EffectEnv,
  type EffectInput,
  flattenEffects,
  type Pixels,
} from './types'

export type Fit = 'cover' | 'contain' | 'fill'

export type Source =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap
  | OffscreenCanvas

export interface RenderOptions {
  /** Working resolution. Defaults to the source size. */
  width?: number
  height?: number
  fit?: Fit
  time?: number
  frame?: number
  seed?: number
  /** Reuse a canvas instead of creating one. */
  canvas?: HTMLCanvasElement
  /** Reused between renders so effects do not allocate scratch canvases every frame. */
  scratch?: ScratchPool
}

export function sourceSize(source: Source): { width: number; height: number } {
  if ('naturalWidth' in source && source.naturalWidth) {
    return { width: source.naturalWidth, height: source.naturalHeight }
  }
  if ('videoWidth' in source && source.videoWidth) {
    return { width: source.videoWidth, height: source.videoHeight }
  }
  return { width: source.width, height: source.height }
}

/** Drawing rectangle for a source in a box, following CSS object-fit. */
export function fitRect(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  fit: Fit,
): [number, number, number, number, number, number, number, number] {
  if (fit === 'fill') return [0, 0, sw, sh, 0, 0, dw, dh]
  const sr = sw / sh
  const dr = dw / dh
  if (fit === 'cover') {
    let cw = sw
    let ch = sh
    if (sr > dr) cw = sh * dr
    else ch = sw / dr
    return [(sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, dw, dh]
  }
  let w = dw
  let h = dh
  if (sr > dr) h = dw / sr
  else w = dh * sr
  return [0, 0, sw, sh, (dw - w) / 2, (dh - h) / 2, w, h]
}

export class ScratchPool {
  private canvases = new Map<string, HTMLCanvasElement | OffscreenCanvas>()

  get(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    const key = `${width}x${height}`
    let canvas = this.canvases.get(key)
    if (!canvas) {
      canvas =
        typeof document !== 'undefined'
          ? document.createElement('canvas')
          : new OffscreenCanvas(width, height)
      canvas.width = width
      canvas.height = height
      this.canvases.set(key, canvas)
    }
    return canvas
  }
}

/**
 * Draw `source` into a canvas and run the effects in order.
 * Consecutive pixel effects share one `getImageData` / `putImageData` round trip.
 */
export function renderEffects(
  source: Source,
  effects: EffectInput,
  options: RenderOptions = {},
): HTMLCanvasElement {
  const size = sourceSize(source)
  const width = Math.max(1, Math.round(options.width ?? size.width))
  const height = Math.max(1, Math.round(options.height ?? size.height))
  const canvas = options.canvas ?? document.createElement('canvas')
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('[@uiness/fx] Could not get a 2D context')

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, ...fitRect(size.width, size.height, width, height, options.fit ?? 'cover'))
  ctx.restore()

  const list = flattenEffects(effects)
  if (list.length === 0) return canvas

  const pool = options.scratch ?? new ScratchPool()
  const seed = options.seed ?? 1
  const frame = options.frame ?? 0
  let pixels: ImageData | null = null
  let dirty = false

  const env: EffectEnv = {
    ctx,
    width,
    height,
    time: options.time ?? 0,
    frame,
    seed,
    random: createRandom(seed * 7919 + frame * 104729),
    read: () => {
      if (!pixels) pixels = ctx.getImageData(0, 0, width, height)
      return pixels as Pixels
    },
    scratch: (w, h) => pool.get(w, h),
  }

  const flush = () => {
    if (pixels && dirty) ctx.putImageData(pixels, 0, 0)
    pixels = null
    dirty = false
  }

  for (const effect of list) {
    if (effect.pixel) {
      effect.pixel(env.read(), env)
      dirty = true
    }
    if (effect.draw) {
      flush()
      effect.draw(env)
      pixels = null
    }
  }
  flush()
  return canvas
}

export function isAnimated(effects: EffectInput): boolean {
  return flattenEffects(effects).some((e: Effect) => e.animated)
}

export function needsPixels(effects: EffectInput): boolean {
  return flattenEffects(effects).some(
    (e: Effect) => e.pixel || e.name === 'halftone' || e.name === 'ascii',
  )
}
