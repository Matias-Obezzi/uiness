import { clamp255, defineEffect, type Effect, keyOf, luminance, type Pixels } from '../types'

const each = (pixels: Pixels, fn: (data: Uint8ClampedArray, i: number) => void) => {
  const { data } = pixels
  for (let i = 0; i < data.length; i += 4) fn(data, i)
}

/** Desaturate. `amount` 1 is full grayscale, 0.5 halfway. */
export function grayscale(amount = 1): Effect {
  return defineEffect({
    name: 'grayscale',
    key: keyOf('grayscale', amount),
    pixel: (p) =>
      each(p, (d, i) => {
        const l = luminance(d[i] as number, d[i + 1] as number, d[i + 2] as number)
        d[i] = (d[i] as number) + (l - (d[i] as number)) * amount
        d[i + 1] = (d[i + 1] as number) + (l - (d[i + 1] as number)) * amount
        d[i + 2] = (d[i + 2] as number) + (l - (d[i + 2] as number)) * amount
      }),
  })
}

export function invert(): Effect {
  return defineEffect({
    name: 'invert',
    pixel: (p) =>
      each(p, (d, i) => {
        d[i] = 255 - (d[i] as number)
        d[i + 1] = 255 - (d[i + 1] as number)
        d[i + 2] = 255 - (d[i + 2] as number)
      }),
  })
}

export function sepia(amount = 1): Effect {
  return defineEffect({
    name: 'sepia',
    key: keyOf('sepia', amount),
    pixel: (p) =>
      each(p, (d, i) => {
        const r = d[i] as number
        const g = d[i + 1] as number
        const b = d[i + 2] as number
        const sr = 0.393 * r + 0.769 * g + 0.189 * b
        const sg = 0.349 * r + 0.686 * g + 0.168 * b
        const sb = 0.272 * r + 0.534 * g + 0.131 * b
        d[i] = clamp255(r + (sr - r) * amount)
        d[i + 1] = clamp255(g + (sg - g) * amount)
        d[i + 2] = clamp255(b + (sb - b) * amount)
      }),
  })
}

/** Multiply channels. 1 is unchanged, 1.5 brighter, 0.5 darker. */
export function brightness(value = 1.2): Effect {
  return defineEffect({
    name: 'brightness',
    key: keyOf('brightness', value),
    pixel: (p) =>
      each(p, (d, i) => {
        d[i] = clamp255((d[i] as number) * value)
        d[i + 1] = clamp255((d[i + 1] as number) * value)
        d[i + 2] = clamp255((d[i + 2] as number) * value)
      }),
  })
}

/** Scale around mid gray. 1 is unchanged. */
export function contrast(value = 1.3): Effect {
  return defineEffect({
    name: 'contrast',
    key: keyOf('contrast', value),
    pixel: (p) =>
      each(p, (d, i) => {
        d[i] = clamp255(((d[i] as number) - 128) * value + 128)
        d[i + 1] = clamp255(((d[i + 1] as number) - 128) * value + 128)
        d[i + 2] = clamp255(((d[i + 2] as number) - 128) * value + 128)
      }),
  })
}

/** 1 is unchanged, 0 is grayscale, 2 doubles saturation. */
export function saturate(value = 1.5): Effect {
  return defineEffect({
    name: 'saturate',
    key: keyOf('saturate', value),
    pixel: (p) =>
      each(p, (d, i) => {
        const l = luminance(d[i] as number, d[i + 1] as number, d[i + 2] as number)
        d[i] = clamp255(l + ((d[i] as number) - l) * value)
        d[i + 1] = clamp255(l + ((d[i + 1] as number) - l) * value)
        d[i + 2] = clamp255(l + ((d[i + 2] as number) - l) * value)
      }),
  })
}

/** Reduce each channel to `levels` steps. */
export function posterize(levels = 4): Effect {
  const steps = Math.max(2, Math.round(levels))
  const step = 255 / (steps - 1)
  return defineEffect({
    name: 'posterize',
    key: keyOf('posterize', steps),
    pixel: (p) =>
      each(p, (d, i) => {
        d[i] = Math.round((d[i] as number) / step) * step
        d[i + 1] = Math.round((d[i + 1] as number) / step) * step
        d[i + 2] = Math.round((d[i + 2] as number) / step) * step
      }),
  })
}

/** Black and white by luminance. `level` 0 to 255. */
export function threshold(level = 128): Effect {
  return defineEffect({
    name: 'threshold',
    key: keyOf('threshold', level),
    pixel: (p) =>
      each(p, (d, i) => {
        const v =
          luminance(d[i] as number, d[i + 1] as number, d[i + 2] as number) >= level ? 255 : 0
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
      }),
  })
}
