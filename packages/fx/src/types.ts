/** RGBA pixel buffer, same shape as `ImageData`. */
export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface EffectEnv {
  /** 2D context of the working canvas. Only valid inside `draw`. */
  ctx: CanvasRenderingContext2D
  /** Working resolution. */
  width: number
  height: number
  /** Seconds since the animation started. 0 for static renders. */
  time: number
  /** Frame counter, 0 for static renders. */
  frame: number
  /** Seed for deterministic randomness. */
  seed: number
  /** Seeded PRNG in [0, 1). Same seed and frame give the same sequence. */
  random: () => number
  /** Current pixels. Inside `draw` this reads the canvas (needs a CORS clean source). */
  read: () => Pixels
  /** Reusable scratch canvas of the given size. */
  scratch: (width: number, height: number) => HTMLCanvasElement | OffscreenCanvas
}

export interface Effect {
  name: string
  /** Stable identity for memoization: name plus options. */
  key: string
  /** Transform pixels in place. Needs a CORS clean source. */
  pixel?: (pixels: Pixels, env: EffectEnv) => void
  /** Draw on the working canvas. May call `env.read()` to inspect pixels. */
  draw?: (env: EffectEnv) => void
  /** Output depends on `time` or `frame`, so the component keeps rendering. */
  animated?: boolean
}

/** An effect, a list, or nested lists (so combos like `crt()` can return several). */
export type EffectInput = Effect | EffectInput[] | null | undefined | false

export type RGB = [number, number, number]

export function flattenEffects(input: EffectInput): Effect[] {
  if (!input) return []
  if (Array.isArray(input)) return input.flatMap(flattenEffects)
  return [input]
}

/** Stable key for a list of effects, for memoization. */
export function effectsKey(input: EffectInput): string {
  return flattenEffects(input)
    .map((e) => e.key)
    .join('|')
}

export function defineEffect(effect: Omit<Effect, 'key'> & { key?: string }): Effect {
  return { key: effect.key ?? effect.name, ...effect }
}

/** Helper for factories: builds the key from the name and the options. */
export function keyOf(name: string, options?: unknown): string {
  return options === undefined ? name : `${name}(${JSON.stringify(options)})`
}

/** Rec. 709 luminance, 0 to 255. */
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function clamp255(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value
}

/** Parse `#rgb`, `#rrggbb` or `[r, g, b]` into an RGB triple. */
export function toRGB(color: string | RGB): RGB {
  if (Array.isArray(color)) return color
  let hex = color.trim().replace('#', '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  const n = Number.parseInt(hex.slice(0, 6), 16)
  if (Number.isNaN(n))
    throw new Error(`[@uiness/fx] Unsupported color "${color}", use hex or [r, g, b]`)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** mulberry32, small and good enough for visual noise. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
