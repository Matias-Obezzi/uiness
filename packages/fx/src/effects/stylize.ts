import { clamp255, defineEffect, type Effect, keyOf, luminance, type Pixels } from '../types'

function luminanceMap({ data, width, height }: Pixels): Float32Array {
  const out = new Float32Array(width * height)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = luminance(data[i] as number, data[i + 1] as number, data[i + 2] as number)
  }
  return out
}

const at = (map: Float32Array, width: number, height: number, x: number, y: number) => {
  const cx = x < 0 ? 0 : x >= width ? width - 1 : x
  const cy = y < 0 ? 0 : y >= height ? height - 1 : y
  return map[cy * width + cx] as number
}

export interface EdgeOptions {
  /** Multiply the gradient. Default 1. */
  strength?: number
  /** Dark edges on white instead of light edges on black. Default false. */
  invert?: boolean
}

/** Sobel edge detection. */
export function edge({ strength = 1, invert = false }: EdgeOptions = {}): Effect {
  return defineEffect({
    name: 'edge',
    key: keyOf('edge', { strength, invert }),
    pixel: (p) => {
      const { data, width, height } = p
      const map = luminanceMap(p)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gx =
            -at(map, width, height, x - 1, y - 1) +
            at(map, width, height, x + 1, y - 1) -
            2 * at(map, width, height, x - 1, y) +
            2 * at(map, width, height, x + 1, y) -
            at(map, width, height, x - 1, y + 1) +
            at(map, width, height, x + 1, y + 1)
          const gy =
            -at(map, width, height, x - 1, y - 1) -
            2 * at(map, width, height, x, y - 1) -
            at(map, width, height, x + 1, y - 1) +
            at(map, width, height, x - 1, y + 1) +
            2 * at(map, width, height, x, y + 1) +
            at(map, width, height, x + 1, y + 1)
          let v = clamp255(Math.sqrt(gx * gx + gy * gy) * strength)
          if (invert) v = 255 - v
          const i = (y * width + x) * 4
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v
        }
      }
    },
  })
}

/** Relief look from a 3x3 emboss kernel. */
export function emboss(strength = 1): Effect {
  return defineEffect({
    name: 'emboss',
    key: keyOf('emboss', strength),
    pixel: (p) => {
      const { data, width, height } = p
      const map = luminanceMap(p)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const v =
            -2 * at(map, width, height, x - 1, y - 1) -
            at(map, width, height, x, y - 1) -
            at(map, width, height, x - 1, y) +
            at(map, width, height, x + 1, y) +
            at(map, width, height, x, y + 1) +
            2 * at(map, width, height, x + 1, y + 1)
          const g = clamp255(128 + v * strength)
          const i = (y * width + x) * 4
          data[i] = g
          data[i + 1] = g
          data[i + 2] = g
        }
      }
    },
  })
}

/** Separable box blur, three passes for a near gaussian look. `radius` in working px. */
export function blur(radius = 4): Effect {
  const r = Math.max(0, Math.round(radius))
  return defineEffect({
    name: 'blur',
    key: keyOf('blur', r),
    pixel: ({ data, width, height }) => {
      if (r === 0) return
      const temp = new Float32Array(data.length)
      const source = new Float32Array(data.length)
      for (let i = 0; i < data.length; i++) source[i] = data[i] as number
      const size = r * 2 + 1
      for (let pass = 0; pass < 3; pass++) {
        // Horizontal.
        for (let y = 0; y < height; y++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let x = -r; x <= r; x++)
              sum += source[(y * width + Math.min(width - 1, Math.max(0, x))) * 4 + c] as number
            for (let x = 0; x < width; x++) {
              temp[(y * width + x) * 4 + c] = sum / size
              const out = Math.max(0, x - r)
              const inn = Math.min(width - 1, x + r + 1)
              sum +=
                (source[(y * width + inn) * 4 + c] as number) -
                (source[(y * width + out) * 4 + c] as number)
            }
          }
        }
        // Vertical.
        for (let x = 0; x < width; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let y = -r; y <= r; y++)
              sum += temp[(Math.min(height - 1, Math.max(0, y)) * width + x) * 4 + c] as number
            for (let y = 0; y < height; y++) {
              source[(y * width + x) * 4 + c] = sum / size
              const out = Math.max(0, y - r)
              const inn = Math.min(height - 1, y + r + 1)
              sum +=
                (temp[(inn * width + x) * 4 + c] as number) -
                (temp[(out * width + x) * 4 + c] as number)
            }
          }
        }
      }
      for (let i = 0; i < data.length; i++) if (i % 4 !== 3) data[i] = source[i] as number
    },
  })
}
