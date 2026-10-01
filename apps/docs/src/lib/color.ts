/**
 * oklch ↔ sRGB hex, for the color inputs on the themes page. The browser's picker speaks hex,
 * the theme speaks oklch. Math from Björn Ottosson's Oklab reference.
 */

interface Oklch {
  l: number
  c: number
  h: number
  /** Alpha suffix as written, like `10%`, kept so editing a border does not lose it. */
  alpha?: string
}

const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i

export function parseOklch(value: string): Oklch | null {
  const m = OKLCH.exec(value.trim())
  if (!m) return null
  const l = Number(m[1]) / (m[2] ? 100 : 1)
  return { l, c: Number(m[3]), h: Number(m[4]), alpha: m[5] }
}

const round = (n: number, digits: number) => Number(n.toFixed(digits))

export function formatOklch({ l, c, h, alpha }: Oklch) {
  const body = `${round(l, 3)} ${round(c, 3)} ${round(c < 0.0005 ? 0 : h, 3)}`
  return alpha ? `oklch(${body} / ${alpha})` : `oklch(${body})`
}

const toGamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
const toLinear = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
const clamp = (x: number) => Math.min(1, Math.max(0, x))

/** The nearest sRGB color, as `#rrggbb`. Colors outside sRGB are clipped. */
export function oklchToHex(value: string): string | null {
  const color = parseOklch(value)
  if (!color) return null
  const rad = (color.h * Math.PI) / 180
  const a = color.c * Math.cos(rad)
  const b = color.c * Math.sin(rad)
  const l = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return `#${rgb
    .map((x) =>
      Math.round(clamp(toGamma(x)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** `#rrggbb` as oklch, keeping the alpha of the color it replaces. */
export function hexToOklch(hex: string, alpha?: string): string {
  const channel = (i: number) => toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = [channel(1), channel(3), channel(5)]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return formatOklch({ l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h, alpha })
}
