import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfettiButton, confetti } from './confetti'
import { Orbit, OrbitItem } from './orbit'
import { RetroGrid } from './retro-grid'
import { Sonar } from './sonar'

const reduceMotion = (matches: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches && query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })),
  )

/** A 2D context that records what was drawn, since jsdom has none. */
const fakeContext = () => {
  const calls: string[] = []
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => {
        if (typeof key !== 'string') return undefined
        return (..._args: unknown[]) => calls.push(key)
      },
      set: () => true,
    },
  )
  return { ctx: ctx as CanvasRenderingContext2D, calls }
}

/** Collects animation frames so the test decides when each one runs. */
const frames = () => {
  let queue: FrameRequestCallback[] = []
  let now = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    queue = []
  })
  return {
    get pending() {
      return queue.length
    },
    run(count: number) {
      for (let i = 0; i < count && queue.length; i++) {
        const next = queue
        queue = []
        now += 1000 / 60
        for (const cb of next) cb(now)
      }
    },
  }
}

const layer = () => document.querySelector<HTMLCanvasElement>('canvas[data-slot=confetti]')

afterEach(() => {
  confetti.reset()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('confetti', () => {
  beforeEach(() => reduceMotion(false))

  it('does nothing without canvas support and leaves no canvas behind', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const raf = frames()
    confetti()
    expect(layer()).toBeNull()
    expect(raf.pending).toBe(0)
  })

  it('adds one fixed canvas above the page, draws, and removes it when every piece is gone', () => {
    const { ctx, calls } = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const raf = frames()
    confetti({ particleCount: 10, ticks: 20, shapes: ['square', 'circle', 'strip', 'star'] })
    confetti({ particleCount: 5, ticks: 20 })
    expect(document.querySelectorAll('canvas[data-slot=confetti]')).toHaveLength(1)
    const canvas = layer() as HTMLCanvasElement
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.style.position).toBe('fixed')
    expect(canvas.style.pointerEvents).toBe('none')
    expect(canvas.style.zIndex).toBe('var(--z-toast, 70)')
    expect(raf.pending).toBe(1)
    raf.run(1)
    expect(calls).toContain('fillRect')
    expect(calls).toContain('arc')
    raf.run(40)
    expect(layer()).toBeNull()
    expect(raf.pending).toBe(0)
  })

  it('bursts from the center of an element', () => {
    const { ctx, calls } = fakeContext()
    const translate = vi.fn()
    const spy = new Proxy(ctx, {
      get: (target, key) =>
        key === 'translate' ? translate : Reflect.get(target, key as string | symbol),
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(spy)
    const raf = frames()
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 200,
      width: 40,
      height: 20,
    } as DOMRect)
    confetti({ element: el, particleCount: 1, velocity: 0, gravity: 0 })
    raf.run(1)
    expect(translate).toHaveBeenCalledWith(120, 210)
    expect(calls.length).toBeGreaterThan(0)
  })

  it('is a no-op with reduced motion', () => {
    reduceMotion(true)
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    confetti()
    expect(getContext).not.toHaveBeenCalled()
    expect(layer()).toBeNull()
  })

  it('reset stops the loop and removes the canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext().ctx)
    const raf = frames()
    confetti()
    expect(layer()).not.toBeNull()
    confetti.reset()
    expect(layer()).toBeNull()
    expect(raf.pending).toBe(0)
  })
})

describe('ConfettiButton', () => {
  beforeEach(() => reduceMotion(false))

  it('bursts from itself on click and still calls onClick', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext().ctx)
    frames()
    const onClick = vi.fn()
    render(<ConfettiButton onClick={onClick}>Celebrate</ConfettiButton>)
    const button = screen.getByRole('button', { name: 'Celebrate' })
    const rect = vi.spyOn(button, 'getBoundingClientRect')
    expect(button.getAttribute('type')).toBe('button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
    expect(rect).toHaveBeenCalled()
    expect(layer()).not.toBeNull()
  })

  it('skips the burst when onClick prevents default, and works as a slot', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext().ctx)
    frames()
    render(
      <ConfettiButton asChild onClick={(e) => e.preventDefault()}>
        <a href="#done">Done</a>
      </ConfettiButton>,
    )
    const link = screen.getByRole('link', { name: 'Done' })
    expect(link.dataset.slot).toBe('confetti-button')
    fireEvent.click(link)
    expect(layer()).toBeNull()
  })
})

describe('Orbit', () => {
  it('spreads items evenly and sets the ring size and speed', () => {
    const { container } = render(
      <div className="relative">
        <Orbit radius={80} duration={12} reverse pauseOnHover>
          <OrbitItem>A</OrbitItem>
          <OrbitItem>B</OrbitItem>
          <OrbitItem>C</OrbitItem>
          <OrbitItem angle={45}>D</OrbitItem>
        </Orbit>
      </div>,
    )
    const orbit = container.querySelector<HTMLElement>('[data-slot=orbit]')
    expect(orbit?.style.getPropertyValue('--orbit-size')).toBe('160px')
    expect(orbit?.style.getPropertyValue('--orbit-radius')).toBe('80px')
    expect(orbit?.style.getPropertyValue('--orbit-duration')).toBe('12s')
    expect(orbit?.hasAttribute('data-reverse')).toBe(true)
    expect(orbit?.hasAttribute('data-pause-on-hover')).toBe(true)
    const angles = [...container.querySelectorAll<HTMLElement>('[data-slot=orbit-item]')].map(
      (el) => el.style.getPropertyValue('--orbit-angle'),
    )
    expect(angles).toEqual(['0deg', '90deg', '180deg', '45deg'])
    expect(container.querySelector('[data-slot=orbit-path]')?.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })

  it('hides the path on request and holds still with reduced motion', () => {
    const { container } = render(
      <Orbit path={false}>
        <OrbitItem>A</OrbitItem>
      </Orbit>,
    )
    expect(container.querySelector('[data-slot=orbit-path]')).toBeNull()
    const item = container.querySelector<HTMLElement>('[data-slot=orbit-item]')
    expect(item?.className).toContain('motion-reduce:animate-none')
    // With the animation off the item still sits on the ring.
    expect(item?.style.transform).toContain('translateX(var(--orbit-radius))')
  })
})

describe('Sonar', () => {
  it('draws the rings behind the child with staggered delays', () => {
    const { container } = render(
      <Sonar rings={4} duration={2} scale={3} color="red">
        <span>Avatar</span>
      </Sonar>,
    )
    const root = container.querySelector<HTMLElement>('[data-slot=sonar]')
    expect(root?.style.getPropertyValue('--sonar-duration')).toBe('2s')
    expect(root?.style.getPropertyValue('--sonar-scale')).toBe('3')
    const layer = root?.querySelector<HTMLElement>('[data-slot=sonar-rings]')
    expect(layer?.getAttribute('aria-hidden')).toBe('true')
    expect(layer?.style.color).toBe('red')
    expect(root?.lastElementChild?.textContent).toBe('Avatar')
    const rings = [...container.querySelectorAll<HTMLElement>('[data-slot=sonar-ring]')]
    expect(rings).toHaveLength(4)
    expect(rings.map((r) => r.style.animationDelay)).toEqual(['0s', '-0.5s', '-1s', '-1.5s'])
    // Resting rings spread out to the full scale for reduced motion.
    expect(rings[3]?.style.transform).toBe('scale(3)')
    expect(rings[0]?.className).toContain('motion-reduce:animate-none')
  })

  it('switches between outlines and filled pulses', () => {
    const { container, rerender } = render(<Sonar />)
    expect(container.querySelector('[data-slot=sonar-ring]')?.className).toContain('border')
    rerender(<Sonar variant="pulse" ringClassName="rounded-md" />)
    const ring = container.querySelector('[data-slot=sonar-ring]')
    expect(ring?.className).toContain('bg-current')
    expect(ring?.className).not.toContain('border')
    expect(ring?.className).toContain('rounded-md')
  })
})

describe('RetroGrid', () => {
  /** Records the canvas calls, and the alpha each stroke was drawn with. */
  const recordingContext = () => {
    const strokes: number[] = []
    let alpha = 1
    const ctx = new Proxy(
      {},
      {
        get: (_, key) => {
          if (key === 'globalAlpha') return alpha
          if (key === 'stroke') return () => strokes.push(alpha)
          return () => {}
        },
        set: (_, key, value) => {
          if (key === 'globalAlpha') alpha = value
          return true
        },
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    )
    return strokes
  }

  const sized = () =>
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 600,
      height: 300,
    } as DOMRect)

  it('takes its color and fades at the horizon', () => {
    reduceMotion(false)
    const { container } = render(<RetroGrid lineColor="blue" perspective={300} />)
    const root = container.querySelector<HTMLElement>('[data-slot=retro-grid]')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
    expect(root?.style.getPropertyValue('--retro-grid-line')).toBe('blue')
    expect(root?.style.maskImage).toContain('transparent')
    expect(container.querySelector('canvas[data-slot=retro-grid-canvas]')).not.toBeNull()
  })

  it('draws far lines fainter rather than thinner, and keeps rolling', () => {
    reduceMotion(false)
    const f = frames()
    sized()
    const strokes = recordingContext()
    render(<RetroGrid angle={60} cellSize={40} perspective={300} />)
    // Every line across, then one stroke for all the lines along.
    const across = strokes.slice(0, -1)
    expect(across.length).toBeGreaterThan(10)
    expect(across.every((a) => a > 0 && a <= 1)).toBe(true)
    expect(across[across.length - 1]).toBeLessThan((across[0] ?? 0) / 4)
    expect(f.pending).toBe(1)
    f.run(1)
    expect(f.pending).toBe(1)
  })

  it('draws once and stops at speed 0 or with reduced motion', () => {
    const f = frames()
    sized()
    recordingContext()
    reduceMotion(false)
    const { unmount } = render(<RetroGrid speed={0} />)
    expect(f.pending).toBe(0)
    unmount()
    reduceMotion(true)
    render(<RetroGrid />)
    expect(f.pending).toBe(0)
  })
})
