import { clamp255, defineEffect, type Effect, keyOf, type Pixels, type RGB, toRGB } from '../types'

/** Palettes as hex lists. Pass any of them to `palette()` or `dither({ palette })`. */
export const palettes = {
  mono: ['#000000', '#ffffff'],
  gray4: ['#000000', '#555555', '#aaaaaa', '#ffffff'],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  cga: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
  pico8: [
    '#000000',
    '#1d2b53',
    '#7e2553',
    '#008751',
    '#ab5236',
    '#5f574f',
    '#c2c3c7',
    '#fff1e8',
    '#ff004d',
    '#ffa300',
    '#ffec27',
    '#00e436',
    '#29adff',
    '#83769c',
    '#ff77a8',
    '#ffccaa',
  ],
} satisfies Record<string, string[]>

export type PaletteInput = ReadonlyArray<string | RGB>

interface Quantizer {
  key: unknown
  /** Writes the quantized color of (r, g, b) into `out`. */
  map: (r: number, g: number, b: number, out: RGB) => void
}

function paletteQuantizer(input: PaletteInput): Quantizer {
  const colors = input.map(toRGB)
  const cache = new Map<number, RGB>()
  return {
    key: colors,
    map: (r, g, b, out) => {
      const k = (r << 16) | (g << 8) | b
      let hit = cache.get(k)
      if (!hit) {
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        for (let i = 0; i < colors.length; i++) {
          const c = colors[i] as RGB
          const dr = c[0] - r
          const dg = c[1] - g
          const db = c[2] - b
          const distance = dr * dr + dg * dg + db * db
          if (distance < bestDistance) {
            bestDistance = distance
            best = i
          }
        }
        hit = colors[best] as RGB
        if (cache.size < 65536) cache.set(k, hit)
      }
      out[0] = hit[0]
      out[1] = hit[1]
      out[2] = hit[2]
    },
  }
}

function levelsQuantizer(levels: number): Quantizer {
  const steps = Math.max(2, Math.round(levels))
  const step = 255 / (steps - 1)
  const q = (v: number) => Math.round(clamp255(v) / step) * step
  return {
    key: steps,
    map: (r, g, b, out) => {
      out[0] = q(r)
      out[1] = q(g)
      out[2] = q(b)
    },
  }
}

/** Snap every pixel to the nearest color of the palette. */
export function palette(colors: PaletteInput): Effect {
  const quantizer = paletteQuantizer(colors)
  const out: RGB = [0, 0, 0]
  return defineEffect({
    name: 'palette',
    key: keyOf('palette', colors),
    pixel: (p) => {
      const { data } = p
      for (let i = 0; i < data.length; i += 4) {
        quantizer.map(data[i] as number, data[i + 1] as number, data[i + 2] as number, out)
        data[i] = out[0]
        data[i + 1] = out[1]
        data[i + 2] = out[2]
      }
    },
  })
}

export type DitherMethod = 'bayer' | 'floyd-steinberg' | 'atkinson'

export interface DitherOptions {
  /** Default 'bayer'. */
  method?: DitherMethod
  /** Levels per channel when no palette is given. Default 2. */
  levels?: number
  /** Quantize to these colors instead of levels. */
  palette?: PaletteInput
  /** Bayer matrix size: 2, 4 or 8. Default 4. */
  size?: 2 | 4 | 8
  /** 0 to 1, how much the pattern pushes pixels. Default 1. */
  strength?: number
}

const BAYER_2 = [0, 2, 3, 1]
function bayerMatrix(size: 2 | 4 | 8): Float32Array {
  let m = BAYER_2
  let n = 2
  while (n < size) {
    const next = new Array<number>(n * n * 4)
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = (m[y * n + x] as number) * 4
        next[y * 2 * n * 2 + x * 2] = v
        next[y * 2 * n * 2 + x * 2 + 1] = v + 2
        next[(y * 2 + 1) * n * 2 + x * 2] = v + 3
        next[(y * 2 + 1) * n * 2 + x * 2 + 1] = v + 1
      }
    }
    m = next
    n *= 2
  }
  const total = n * n
  return Float32Array.from(m, (v) => (v + 0.5) / total - 0.5)
}

/**
 * Ordered or error diffusion dithering, to a number of levels or to a palette.
 *
 * @example dither() // 1-bit bayer
 * @example dither({ method: 'floyd-steinberg', palette: palettes.gameboy })
 */
export function dither(options: DitherOptions | DitherMethod = {}): Effect {
  const opts = typeof options === 'string' ? { method: options } : options
  const { method = 'bayer', levels = 2, size = 4, strength = 1 } = opts
  const quantizer = opts.palette ? paletteQuantizer(opts.palette) : levelsQuantizer(levels)
  const out: RGB = [0, 0, 0]
  // Amplitude of the push: one quantization step for levels, a rough step for palettes.
  const amplitude = opts.palette
    ? 255 / Math.max(2, Math.cbrt(opts.palette.length) * 2)
    : 255 / (Math.max(2, levels) - 1)

  return defineEffect({
    name: 'dither',
    key: keyOf('dither', opts),
    pixel: (p: Pixels) => {
      const { data, width, height } = p
      if (method === 'bayer') {
        const matrix = bayerMatrix(size)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            const t = (matrix[(y % size) * size + (x % size)] as number) * amplitude * strength
            quantizer.map(
              clamp255((data[i] as number) + t),
              clamp255((data[i + 1] as number) + t),
              clamp255((data[i + 2] as number) + t),
              out,
            )
            data[i] = out[0]
            data[i + 1] = out[1]
            data[i + 2] = out[2]
          }
        }
        return
      }

      // Error diffusion on a float copy so errors are not clamped away early.
      const buffer = new Float32Array(data.length)
      for (let i = 0; i < data.length; i++) buffer[i] = data[i] as number
      const spread = (i: number, er: number, eg: number, eb: number, weight: number) => {
        buffer[i] = (buffer[i] as number) + er * weight
        buffer[i + 1] = (buffer[i + 1] as number) + eg * weight
        buffer[i + 2] = (buffer[i + 2] as number) + eb * weight
      }
      const atkinson = method === 'atkinson'
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          const r = buffer[i] as number
          const g = buffer[i + 1] as number
          const b = buffer[i + 2] as number
          quantizer.map(clamp255(r), clamp255(g), clamp255(b), out)
          data[i] = out[0]
          data[i + 1] = out[1]
          data[i + 2] = out[2]
          const er = (r - out[0]) * strength
          const eg = (g - out[1]) * strength
          const eb = (b - out[2]) * strength
          const right = x + 1 < width
          const down = y + 1 < height
          if (atkinson) {
            const w = 1 / 8
            if (right) spread(i + 4, er, eg, eb, w)
            if (x + 2 < width) spread(i + 8, er, eg, eb, w)
            if (down) {
              if (x > 0) spread(i + width * 4 - 4, er, eg, eb, w)
              spread(i + width * 4, er, eg, eb, w)
              if (right) spread(i + width * 4 + 4, er, eg, eb, w)
              if (y + 2 < height) spread(i + width * 8, er, eg, eb, w)
            }
          } else {
            if (right) spread(i + 4, er, eg, eb, 7 / 16)
            if (down) {
              if (x > 0) spread(i + width * 4 - 4, er, eg, eb, 3 / 16)
              spread(i + width * 4, er, eg, eb, 5 / 16)
              if (right) spread(i + width * 4 + 4, er, eg, eb, 1 / 16)
            }
          }
        }
      }
    },
  })
}
