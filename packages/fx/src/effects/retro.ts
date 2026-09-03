import {
  clamp255,
  defineEffect,
  type Effect,
  keyOf,
  luminance,
  type Pixels,
  type RGB,
  toRGB,
} from '../types'

export interface ScanlinesOptions {
  /** Pixels between dark lines. Default 3. */
  spacing?: number
  /** Line thickness in px. Default 1. */
  thickness?: number
  /** Darkening, 0 to 1. Default 0.35. */
  opacity?: number
}

export function scanlines({
  spacing = 3,
  thickness = 1,
  opacity = 0.35,
}: ScanlinesOptions = {}): Effect {
  const factor = 1 - opacity
  return defineEffect({
    name: 'scanlines',
    key: keyOf('scanlines', { spacing, thickness, opacity }),
    pixel: ({ data, width, height }) => {
      for (let y = 0; y < height; y++) {
        if (y % spacing >= thickness) continue
        const row = y * width * 4
        for (let x = 0; x < width * 4; x += 4) {
          data[row + x] = (data[row + x] as number) * factor
          data[row + x + 1] = (data[row + x + 1] as number) * factor
          data[row + x + 2] = (data[row + x + 2] as number) * factor
        }
      }
    },
  })
}

export interface NoiseOptions {
  /** Grain per pixel, same on the three channels. Default true. */
  mono?: boolean
  /** New grain every frame. Default false. */
  animated?: boolean
}

/** Film grain. `amount` 0 to 1. */
export function noise(amount = 0.15, { mono = true, animated = false }: NoiseOptions = {}): Effect {
  const range = amount * 255
  return defineEffect({
    name: 'noise',
    key: keyOf('noise', { amount, mono, animated }),
    animated,
    pixel: ({ data }, env) => {
      const random = env.random
      for (let i = 0; i < data.length; i += 4) {
        if (mono) {
          const n = (random() - 0.5) * range
          data[i] = clamp255((data[i] as number) + n)
          data[i + 1] = clamp255((data[i + 1] as number) + n)
          data[i + 2] = clamp255((data[i + 2] as number) + n)
        } else {
          data[i] = clamp255((data[i] as number) + (random() - 0.5) * range)
          data[i + 1] = clamp255((data[i + 1] as number) + (random() - 0.5) * range)
          data[i + 2] = clamp255((data[i + 2] as number) + (random() - 0.5) * range)
        }
      }
    },
  })
}

/** Darken towards the corners. `strength` 0 to 1. */
export function vignette(strength = 0.6, softness = 0.5): Effect {
  return defineEffect({
    name: 'vignette',
    key: keyOf('vignette', { strength, softness }),
    pixel: ({ data, width, height }) => {
      const cx = width / 2
      const cy = height / 2
      const maxDistance = Math.sqrt(cx * cx + cy * cy)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = (x - cx) / maxDistance
          const dy = (y - cy) / maxDistance
          const d = Math.sqrt(dx * dx + dy * dy)
          const t = Math.min(1, Math.max(0, (d - (1 - softness)) / softness))
          const factor = 1 - strength * t * t
          const i = (y * width + x) * 4
          data[i] = (data[i] as number) * factor
          data[i + 1] = (data[i + 1] as number) * factor
          data[i + 2] = (data[i + 2] as number) * factor
        }
      }
    },
  })
}

/** Shift the red channel left and the blue channel right by `offset` px. */
export function chromatic(offset = 3): Effect {
  return defineEffect({
    name: 'chromatic',
    key: keyOf('chromatic', offset),
    pixel: ({ data, width, height }) => {
      const source = new Uint8ClampedArray(data)
      const shift = Math.round(offset)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          const xr = Math.min(width - 1, Math.max(0, x + shift))
          const xb = Math.min(width - 1, Math.max(0, x - shift))
          data[i] = source[(y * width + xr) * 4] as number
          data[i + 2] = source[(y * width + xb) * 4 + 2] as number
        }
      }
    },
  })
}

export interface GlitchOptions {
  /** 0 to 1. Default 0.5. */
  intensity?: number
  /** Number of displaced slices. Default 6. */
  slices?: number
  /** New glitch every frame. Default true. */
  animated?: boolean
  /** Also shift color channels inside the slices. Default true. */
  chromatic?: boolean
}

/** Horizontal slices shoved sideways, like a broken signal. */
export function glitch({
  intensity = 0.5,
  slices = 6,
  animated = true,
  chromatic: withChromatic = true,
}: GlitchOptions = {}): Effect {
  return defineEffect({
    name: 'glitch',
    key: keyOf('glitch', { intensity, slices, animated, chromatic: withChromatic }),
    animated,
    pixel: ({ data, width, height }, env) => {
      const random = env.random
      // Only some frames glitch, so animation reads as flickering, not constant chaos.
      if (animated && random() > 0.35 + intensity * 0.5) return
      const source = new Uint8ClampedArray(data)
      const count = Math.max(1, Math.round(slices * (0.5 + random())))
      for (let s = 0; s < count; s++) {
        const y0 = Math.floor(random() * height)
        const h = Math.max(1, Math.floor(random() * height * 0.12 * intensity + 1))
        const dx = Math.round((random() - 0.5) * width * 0.25 * intensity)
        const channelShift = withChromatic ? Math.round((random() - 0.5) * 12 * intensity) : 0
        for (let y = y0; y < Math.min(height, y0 + h); y++) {
          for (let x = 0; x < width; x++) {
            const sx = (((x - dx) % width) + width) % width
            const i = (y * width + x) * 4
            const j = (y * width + sx) * 4
            const jr = (y * width + ((((sx + channelShift) % width) + width) % width)) * 4
            data[i] = source[jr] as number
            data[i + 1] = source[j + 1] as number
            data[i + 2] = source[j + 2] as number
          }
        }
      }
    },
  })
}

export interface HalftoneOptions {
  /** Cell size in px. Default 6. */
  size?: number
  /** Dot color. Default black. */
  color?: string | RGB
  /** Paper color. Default white. */
  background?: string | RGB
}

/** Newspaper dots: bigger where the image is darker. */
export function halftone({
  size = 6,
  color = '#000000',
  background = '#ffffff',
}: HalftoneOptions = {}): Effect {
  const ink = toRGB(color)
  const paper = toRGB(background)
  return defineEffect({
    name: 'halftone',
    key: keyOf('halftone', { size, color, background }),
    draw: (env) => {
      const { ctx, width, height } = env
      const cells = cellLuminance(env.read(), size)
      ctx.fillStyle = `rgb(${paper.join(',')})`
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = `rgb(${ink.join(',')})`
      const maxRadius = (size / 2) * 1.15
      for (const cell of cells) {
        const radius = maxRadius * Math.sqrt(1 - cell.luminance / 255)
        if (radius <= 0.2) continue
        ctx.beginPath()
        ctx.arc(cell.x + size / 2, cell.y + size / 2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  })
}

export interface AsciiOptions {
  /** Cell size in px. Default 8. */
  size?: number
  /** Characters from darkest to lightest. */
  chars?: string
  color?: string | RGB
  background?: string | RGB
  /** Keep the original pixel color per character. Default false. */
  colored?: boolean
  font?: string
}

/** Characters picked by brightness, like a terminal render. */
export function ascii({
  size = 8,
  chars = ' .:-=+*#%@',
  color = '#e6e6e6',
  background = '#0f1115',
  colored = false,
  font = 'ui-monospace, Menlo, Consolas, monospace',
}: AsciiOptions = {}): Effect {
  const fg = toRGB(color)
  const bg = toRGB(background)
  return defineEffect({
    name: 'ascii',
    key: keyOf('ascii', { size, chars, color, background, colored, font }),
    draw: (env) => {
      const { ctx, width, height } = env
      const cells = cellLuminance(env.read(), size)
      ctx.fillStyle = `rgb(${bg.join(',')})`
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${size}px ${font}`
      ctx.textBaseline = 'top'
      ctx.fillStyle = `rgb(${fg.join(',')})`
      const last = chars.length - 1
      for (const cell of cells) {
        const char = chars[Math.round((cell.luminance / 255) * last)] as string
        if (char === ' ') continue
        if (colored) ctx.fillStyle = `rgb(${cell.r},${cell.g},${cell.b})`
        ctx.fillText(char, cell.x, cell.y)
      }
    },
  })
}

interface Cell {
  x: number
  y: number
  luminance: number
  r: number
  g: number
  b: number
}

/** Average color and luminance per `size` cell. */
export function cellLuminance(pixels: Pixels, size: number): Cell[] {
  const { data, width, height } = pixels
  const cells: Cell[] = []
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      for (let yy = y; yy < Math.min(height, y + size); yy++) {
        for (let xx = x; xx < Math.min(width, x + size); xx++) {
          const i = (yy * width + xx) * 4
          r += data[i] as number
          g += data[i + 1] as number
          b += data[i + 2] as number
          n++
        }
      }
      r /= n
      g /= n
      b /= n
      cells.push({
        x,
        y,
        luminance: luminance(r, g, b),
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b),
      })
    }
  }
  return cells
}

/** Old monitor: chromatic fringe, scanlines, vignette and live grain. */
export function crt(): Effect[] {
  return [chromatic(2), scanlines(), vignette(0.5), noise(0.06, { animated: true })]
}
