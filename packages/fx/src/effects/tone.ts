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

/** Two colors for the image: `dark` where it is black, `light` where it is white. */
export function duotone(dark: string | RGB = '#1e1b4b', light: string | RGB = '#fde68a'): Effect {
  const [dr, dg, db] = toRGB(dark)
  const [lr, lg, lb] = toRGB(light)
  return defineEffect({
    name: 'duotone',
    key: keyOf('duotone', [dr, dg, db, lr, lg, lb]),
    pixel: ({ data }) => {
      for (let i = 0; i < data.length; i += 4) {
        const t = luminance(data[i] as number, data[i + 1] as number, data[i + 2] as number) / 255
        data[i] = dr + (lr - dr) * t
        data[i + 1] = dg + (lg - dg) * t
        data[i + 2] = db + (lb - db) * t
      }
    },
  })
}

/** Turn every hue around the color wheel by `degrees`, keeping brightness. */
export function hueRotate(degrees = 90): Effect {
  // The CSS `hue-rotate()` matrix, so it matches the filter of the same name.
  const a = (degrees * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  const m = [
    0.213 + c * 0.787 - s * 0.213,
    0.715 - c * 0.715 - s * 0.715,
    0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143,
    0.715 + c * 0.285 + s * 0.14,
    0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787,
    0.715 - c * 0.715 + s * 0.715,
    0.072 + c * 0.928 + s * 0.072,
  ] as const
  return defineEffect({
    name: 'hueRotate',
    key: keyOf('hueRotate', degrees),
    pixel: ({ data }) => {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] as number
        const g = data[i + 1] as number
        const b = data[i + 2] as number
        data[i] = clamp255(m[0] * r + m[1] * g + m[2] * b)
        data[i + 1] = clamp255(m[3] * r + m[4] * g + m[5] * b)
        data[i + 2] = clamp255(m[6] * r + m[7] * g + m[8] * b)
      }
    },
  })
}

/** Crisper edges: each pixel pushed away from the average of its four neighbours. */
export function sharpen(amount = 0.5): Effect {
  return defineEffect({
    name: 'sharpen',
    key: keyOf('sharpen', amount),
    pixel: ({ data, width, height }) => {
      if (amount === 0) return
      const source = data.slice()
      const at = (x: number, y: number, c: number) =>
        source[
          ((y < 0 ? 0 : y >= height ? height - 1 : y) * width +
            (x < 0 ? 0 : x >= width ? width - 1 : x)) *
            4 +
            c
        ] as number
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          for (let c = 0; c < 3; c++) {
            const around = at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c)
            data[i + c] = clamp255(at(x, y, c) * (1 + 4 * amount) - around * amount)
          }
        }
      }
    },
  })
}

/** Mirror one wedge of the image around its center, `segments` times. */
export function kaleidoscope(segments = 6, rotation = 0): Effect {
  const n = Math.max(2, Math.round(segments))
  const wedge = (Math.PI * 2) / n
  const turn = (rotation * Math.PI) / 180
  return defineEffect({
    name: 'kaleidoscope',
    key: keyOf('kaleidoscope', { n, rotation }),
    pixel: ({ data, width, height }: Pixels) => {
      const source = data.slice()
      const cx = (width - 1) / 2
      const cy = (height - 1) / 2
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - cx
          const dy = y - cy
          const radius = Math.hypot(dx, dy)
          // Fold the angle into the first wedge, mirroring every other one so seams meet.
          let angle = Math.atan2(dy, dx) - turn
          angle = ((angle % wedge) + wedge) % wedge
          if (angle > wedge / 2) angle = wedge - angle
          angle += turn
          const sx = Math.round(cx + radius * Math.cos(angle))
          const sy = Math.round(cy + radius * Math.sin(angle))
          const i = (y * width + x) * 4
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
            data[i + 3] = 0
            continue
          }
          const j = (sy * width + sx) * 4
          data[i] = source[j] as number
          data[i + 1] = source[j + 1] as number
          data[i + 2] = source[j + 2] as number
          data[i + 3] = source[j + 3] as number
        }
      }
    },
  })
}

export interface PixelSortOptions {
  /** Pixels darker than this are left in place and break runs. Default 60. */
  low?: number
  /** Pixels brighter than this are left in place and break runs. Default 220. */
  high?: number
  /** Sort along rows (`x`) or columns (`y`). Default `x`. */
  direction?: 'x' | 'y'
  /** Brightest first instead of darkest first. Default false. */
  reverse?: boolean
}

/**
 * The glitch look of sorted pixels: runs of pixels with a luminance between `low` and `high`
 * are sorted by luminance along each row or column.
 */
export function pixelSort({
  low = 60,
  high = 220,
  direction = 'x',
  reverse = false,
}: PixelSortOptions = {}): Effect {
  return defineEffect({
    name: 'pixelSort',
    key: keyOf('pixelSort', { low, high, direction, reverse }),
    pixel: ({ data, width, height }) => {
      const lines = direction === 'x' ? height : width
      const length = direction === 'x' ? width : height
      const index = (line: number, k: number) =>
        (direction === 'x' ? line * width + k : k * width + line) * 4
      const lum = (i: number) =>
        luminance(data[i] as number, data[i + 1] as number, data[i + 2] as number)
      const sortRun = (line: number, from: number, to: number) => {
        if (to - from < 2) return
        const run: { l: number; px: number[] }[] = []
        for (let k = from; k < to; k++) {
          const i = index(line, k)
          run.push({
            l: lum(i),
            px: [
              data[i] as number,
              data[i + 1] as number,
              data[i + 2] as number,
              data[i + 3] as number,
            ],
          })
        }
        run.sort((a, b) => (reverse ? b.l - a.l : a.l - b.l))
        for (let k = from; k < to; k++) {
          const i = index(line, k)
          const { px } = run[k - from] as { px: number[] }
          data[i] = px[0] as number
          data[i + 1] = px[1] as number
          data[i + 2] = px[2] as number
          data[i + 3] = px[3] as number
        }
      }
      for (let line = 0; line < lines; line++) {
        let start = -1
        for (let k = 0; k <= length; k++) {
          // One step past the end closes the last run.
          const l = k < length ? lum(index(line, k)) : -1
          const inside = l >= low && l <= high
          if (inside && start === -1) start = k
          else if (!inside && start !== -1) {
            sortRun(line, start, k)
            start = -1
          }
        }
      }
    },
  })
}
