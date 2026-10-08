import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { grayscale, invert, posterize, threshold } from './effects/color'
import { dither, palette, palettes } from './effects/dither'
import { cellLuminance, chromatic, crt, noise, scanlines } from './effects/retro'
import { blur, edge } from './effects/stylize'
import { duotone, hueRotate, kaleidoscope, pixelSort, sharpen } from './effects/tone'
import { Fx } from './fx'
import { fitRect, isAnimated, needsPixels, ScratchPool } from './render'
import {
  createRandom,
  type EffectEnv,
  effectsKey,
  flattenEffects,
  type Pixels,
  toRGB,
} from './types'

const pixels = (
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number],
): Pixels => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  return { data, width, height }
}

const env = (seed = 1): EffectEnv =>
  ({
    width: 0,
    height: 0,
    time: 0,
    frame: 0,
    seed,
    random: createRandom(seed),
    read: () => {
      throw new Error('no canvas')
    },
    scratch: () => {
      throw new Error('no canvas')
    },
    ctx: null as unknown as CanvasRenderingContext2D,
  }) as EffectEnv

const px = (p: Pixels, x: number, y: number) => {
  const i = (y * p.width + x) * 4
  return [p.data[i], p.data[i + 1], p.data[i + 2]]
}

describe('color effects', () => {
  it('grayscale, invert, threshold and posterize do what they say', () => {
    const p = pixels(2, 1, (x) => (x === 0 ? [255, 0, 0] : [10, 200, 30]))
    grayscale().pixel?.(p, env())
    expect(px(p, 0, 0)[0]).toBe(px(p, 0, 0)[1])
    expect(px(p, 0, 0)[0]).toBe(54) // 0.2126 * 255

    const q = pixels(1, 1, () => [10, 20, 30])
    invert().pixel?.(q, env())
    expect(px(q, 0, 0)).toEqual([245, 235, 225])

    const t = pixels(2, 1, (x) => (x === 0 ? [20, 20, 20] : [200, 200, 200]))
    threshold(128).pixel?.(t, env())
    expect(px(t, 0, 0)).toEqual([0, 0, 0])
    expect(px(t, 1, 0)).toEqual([255, 255, 255])

    const s = pixels(1, 1, () => [100, 130, 250])
    posterize(2).pixel?.(s, env())
    expect(px(s, 0, 0)).toEqual([0, 255, 255])
  })
})

describe('palette and dither', () => {
  it('palette snaps to the nearest color', () => {
    const p = pixels(2, 1, (x) => (x === 0 ? [20, 60, 20] : [150, 180, 20]))
    palette(palettes.gameboy).pixel?.(p, env())
    expect(px(p, 0, 0)).toEqual(toRGB('#0f380f'))
    expect(px(p, 1, 0)).toEqual(toRGB('#9bbc0f'))
  })

  it('bayer dither turns mid gray into a checker-like mix of black and white', () => {
    const p = pixels(4, 4, () => [128, 128, 128])
    dither({ method: 'bayer', size: 4 }).pixel?.(p, env())
    const whites = Array.from({ length: 16 }, (_, i) => p.data[i * 4]).filter(
      (v) => v === 255,
    ).length
    expect(whites).toBeGreaterThan(4)
    expect(whites).toBeLessThan(12)
    for (let i = 0; i < 16; i++) expect([0, 255]).toContain(p.data[i * 4])
  })

  it('floyd-steinberg keeps the average brightness', () => {
    const p = pixels(16, 16, () => [64, 64, 64])
    dither('floyd-steinberg').pixel?.(p, env())
    let sum = 0
    for (let i = 0; i < p.data.length; i += 4) sum += p.data[i] as number
    expect(sum / 256).toBeGreaterThan(40)
    expect(sum / 256).toBeLessThan(90)
  })
})

describe('retro and stylize', () => {
  it('scanlines darken every third row only', () => {
    const p = pixels(1, 6, () => [200, 200, 200])
    scanlines({ spacing: 3, opacity: 0.5 }).pixel?.(p, env())
    expect(px(p, 0, 0)[0]).toBe(100)
    expect(px(p, 0, 1)[0]).toBe(200)
    expect(px(p, 0, 3)[0]).toBe(100)
  })

  it('chromatic shifts the red channel', () => {
    const p = pixels(4, 1, (x) => (x === 3 ? [255, 0, 0] : [0, 0, 0]))
    chromatic(1).pixel?.(p, env())
    expect(px(p, 2, 0)[0]).toBe(255)
    expect(px(p, 3, 0)[0]).toBe(255)
  })

  it('noise is deterministic for a seed', () => {
    const a = pixels(8, 8, () => [128, 128, 128])
    const b = pixels(8, 8, () => [128, 128, 128])
    noise(0.5).pixel?.(a, env(7))
    noise(0.5).pixel?.(b, env(7))
    expect(Array.from(a.data)).toEqual(Array.from(b.data))
    expect(Array.from(a.data).some((v, i) => i % 4 !== 3 && v !== 128)).toBe(true)
  })

  it('edge lights up the boundary between two flat areas', () => {
    const p = pixels(8, 1, (x) => (x < 4 ? [0, 0, 0] : [255, 255, 255]))
    edge().pixel?.(p, env())
    expect(px(p, 3, 0)[0]).toBe(255)
    expect(px(p, 1, 0)[0]).toBe(0)
    expect(px(p, 6, 0)[0]).toBe(0)
  })

  it('blur averages neighbours', () => {
    const p = pixels(9, 1, (x) => (x === 4 ? [255, 255, 255] : [0, 0, 0]))
    blur(1).pixel?.(p, env())
    expect(px(p, 4, 0)[0]).toBeLessThan(255)
    expect(px(p, 3, 0)[0]).toBeGreaterThan(0)
    expect(px(p, 0, 0)[0]).toBe(0)
  })

  it('cellLuminance averages blocks', () => {
    const p = pixels(4, 2, (x) => (x < 2 ? [0, 0, 0] : [255, 255, 255]))
    const cells = cellLuminance(p, 2)
    expect(cells).toHaveLength(2)
    expect(cells[0]?.luminance).toBe(0)
    expect(cells[1]?.luminance).toBeCloseTo(255, 3)
  })
})

describe('tone and geometry', () => {
  it('duotone maps black to the dark color and white to the light one', () => {
    const p = pixels(2, 1, (x) => (x === 0 ? [0, 0, 0] : [255, 255, 255]))
    duotone('#102030', [200, 100, 50]).pixel?.(p, env())
    expect(px(p, 0, 0)).toEqual([16, 32, 48])
    expect(px(p, 1, 0)).toEqual([200, 100, 50])
  })

  it('hueRotate by 120 degrees turns red towards green and leaves gray alone', () => {
    const p = pixels(2, 1, (x) => (x === 0 ? [255, 0, 0] : [128, 128, 128]))
    hueRotate(120).pixel?.(p, env())
    const [r, g] = px(p, 0, 0) as number[]
    expect(g).toBeGreaterThan(r as number)
    expect(px(p, 1, 0)).toEqual([128, 128, 128])
    // A full turn is the identity.
    const q = pixels(1, 1, () => [200, 40, 90])
    hueRotate(360).pixel?.(q, env())
    expect(px(q, 0, 0)).toEqual([200, 40, 90])
  })

  it('sharpen deepens the step between two flat areas and leaves flat areas alone', () => {
    const p = pixels(4, 1, (x) => (x < 2 ? [100, 100, 100] : [150, 150, 150]))
    sharpen(1).pixel?.(p, env())
    expect(px(p, 0, 0)).toEqual([100, 100, 100])
    expect((px(p, 1, 0) as number[])[0]).toBeLessThan(100)
    expect((px(p, 2, 0) as number[])[0]).toBeGreaterThan(150)
  })

  it('kaleidoscope makes the image symmetric across the center', () => {
    const p = pixels(9, 9, (x, y) => [x * 20, y * 20, 0])
    kaleidoscope(4).pixel?.(p, env())
    // Four mirrored wedges: left and right halves match.
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 4; x++) expect(px(p, x, y)).toEqual(px(p, 8 - x, y))
    }
  })

  it('pixelSort orders runs inside the band and leaves pixels outside it in place', () => {
    const values = [10, 200, 90, 150, 250, 120, 80]
    const p = pixels(values.length, 1, (x) => {
      const v = values[x] as number
      return [v, v, v]
    })
    pixelSort({ low: 60, high: 220 }).pixel?.(p, env())
    expect(Array.from({ length: values.length }, (_, x) => (px(p, x, 0) as number[])[0])).toEqual([
      10, 90, 150, 200, 250, 80, 120,
    ])
  })
})

describe('ScratchPool', () => {
  it('keeps at most eight sizes, dropping the least recently used', () => {
    const pool = new ScratchPool()
    const first = pool.get(1, 1)
    const second = pool.get(2, 2)
    for (let i = 3; i <= 8; i++) pool.get(i, i)
    // Using 1x1 again makes 2x2 the oldest, so the ninth size pushes 2x2 out.
    expect(pool.get(1, 1)).toBe(first)
    pool.get(9, 9)
    expect(pool.get(1, 1)).toBe(first)
    expect(pool.get(2, 2)).not.toBe(second)
  })
})

describe('composition', () => {
  it('flattens nested lists and builds stable keys', () => {
    const list = flattenEffects([grayscale(), [crt(), null], false, [[invert()]]])
    expect(list.map((e) => e.name)).toEqual([
      'grayscale',
      'chromatic',
      'scanlines',
      'vignette',
      'noise',
      'invert',
    ])
    expect(effectsKey([grayscale(0.5), invert()])).toBe('grayscale(0.5)|invert')
    expect(isAnimated(crt())).toBe(true)
    expect(isAnimated([grayscale()])).toBe(false)
    expect(needsPixels([grayscale()])).toBe(true)
  })

  it('fitRect follows object-fit', () => {
    expect(fitRect(200, 100, 100, 100, 'cover')).toEqual([50, 0, 100, 100, 0, 0, 100, 100])
    expect(fitRect(200, 100, 100, 100, 'contain')).toEqual([0, 0, 200, 100, 0, 25, 100, 50])
  })
})

describe('<Fx>', () => {
  it('renders an accessible canvas in loading state', () => {
    render(<Fx src="/photo.png" alt="A photo" effects={[grayscale()]} />)
    const canvas = screen.getByRole('img', { name: 'A photo' })
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas.getAttribute('data-status')).toBe('loading')
  })

  describe('the animation loop', () => {
    afterEach(() => vi.unstubAllGlobals())

    const setup = ({ reduced = false, onScreen = true } = {}) => {
      // Frames asked for and not cancelled: a running loop always has one.
      const pending = new Set<number>()
      let next = 0
      vi.stubGlobal('requestAnimationFrame', () => {
        pending.add(++next)
        return next
      })
      vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id))
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: reduced && query.includes('reduce'),
        addEventListener() {},
        removeEventListener() {},
      }))
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(private cb: IntersectionObserverCallback) {}
          observe() {
            this.cb(
              [{ isIntersecting: onScreen } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            )
          }
          disconnect() {}
        },
      )
      // An already loaded source, so the effect runs right away.
      render(<Fx src={document.createElement('canvas')} effects={noise(0.2, { animated: true })} />)
      return pending
    }

    it('runs for animated effects on screen', () => {
      expect(setup().size).toBe(1)
    })

    it('stays on one frame with reduced motion', () => {
      expect(setup({ reduced: true }).size).toBe(0)
    })

    it('stays on one frame off screen', () => {
      expect(setup({ onScreen: false }).size).toBe(0)
    })
  })
})
