import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ambilight, followCommands } from './ambilight'
import { Lens } from './lens'
import { NoiseTexture } from './noise-texture'
import { Particles } from './particles'
import { Pointer } from './pointer'
import { ScrollProgress } from './scroll-progress'
import { SmoothCursor } from './smooth-cursor'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Lens', () => {
  it('updates CSS custom properties on pointermove', () => {
    render(
      <Lens data-testid="lens" zoom={3} size={200}>
        <img src="/photo.jpg" alt="Landscape" />
      </Lens>,
    )

    const el = screen.getByTestId('lens')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 400,
      height: 300,
      right: 500,
      bottom: 350,
      x: 100,
      y: 50,
      toJSON() {},
    } as DOMRect)

    fireEvent.pointerMove(el, { clientX: 250, clientY: 150 })

    expect(el.style.getPropertyValue('--lens-x')).toBe('150.00px')
    expect(el.style.getPropertyValue('--lens-y')).toBe('100.00px')
  })

  it('keeps static coordinates when position is provided', () => {
    render(
      <Lens data-testid="lens" position={{ x: 80, y: 120 }}>
        <div>Fixed target</div>
      </Lens>,
    )

    const el = screen.getByTestId('lens')
    expect(el.style.getPropertyValue('--lens-x')).toBe('80.00px')
    expect(el.style.getPropertyValue('--lens-y')).toBe('120.00px')
  })

  it('renders inert and aria-hidden overlay so screen readers only visit the real content once', () => {
    render(
      <Lens>
        <button type="button">Action</button>
      </Lens>,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    const overlay = document.querySelector('[data-slot="lens-overlay"]')
    expect(overlay?.getAttribute('aria-hidden')).toBe('true')
    expect(overlay?.hasAttribute('inert')).toBe(true)
  })
})

describe('Pointer', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('hides parent cursor on fine pointer and restores on inputs', () => {
    render(
      <div data-testid="parent" style={{ position: 'relative' }}>
        <Pointer data-testid="pointer" />
        <input data-testid="input" type="text" />
      </div>,
    )

    const parent = screen.getByTestId('parent')
    const pointer = screen.getByTestId('pointer')
    const input = screen.getByTestId('input')

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 300,
      height: 200,
      right: 300,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect)

    act(() => {
      parent.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 50,
          clientY: 50,
          pointerType: 'mouse',
        }),
      )
    })

    expect(pointer.getAttribute('aria-hidden')).toBe('true')
    expect(parent.style.cursor).toBe('none')

    act(() => {
      input.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 50,
          clientY: 50,
          pointerType: 'mouse',
        }),
      )
    })

    expect(parent.style.cursor).toBe('auto')
  })
})

describe('SmoothCursor', () => {
  it('follows directly without starting spring loop when prefers-reduced-motion is active', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion') || query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const raf = vi.spyOn(window, 'requestAnimationFrame')

    render(<SmoothCursor data-testid="cursor" />)
    const cursor = screen.getByTestId('cursor')

    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 120,
          clientY: 180,
          pointerType: 'mouse',
        }),
      )
    })

    expect(cursor.style.transform).toContain('translate3d(120.00px, 180.00px, 0)')
    expect(raf).not.toHaveBeenCalled()
  })

  it('appears under the pointer, springs after it and turns on the hotspot', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('pointer: fine'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const move = (x: number, y: number) =>
      act(() => {
        window.dispatchEvent(
          new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse' }),
        )
      })

    const { unmount } = render(<SmoothCursor data-testid="cursor" />)
    const cursor = screen.getByTestId('cursor')
    expect(cursor.className).toContain('origin-top-left')
    // The system cursor is hidden over the page while it is mounted, and back after.
    expect(document.documentElement.hasAttribute('data-smooth-cursor')).toBe(true)
    expect(document.head.textContent).toContain('[data-smooth-cursor]')

    // First arrival: placed under the pointer, not flown in from the corner.
    move(300, 200)
    expect(cursor.style.transform).toContain('translate3d(300.00px, 200.00px, 0)')

    // Then it trails: one frame later it is on its way, not there yet.
    move(400, 200)
    const t = performance.now()
    act(() => frames.shift()?.(t + 1000 / 60))
    const x = Number(/translate3d\(([\d.]+)px/.exec(cursor.style.transform)?.[1])
    expect(x).toBeGreaterThan(300)
    expect(x).toBeLessThan(400)

    // Over a text field the circle steps aside for the system's caret.
    const input = document.createElement('input')
    document.body.append(input)
    act(() => {
      input.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 10,
          clientY: 10,
          pointerType: 'mouse',
        }),
      )
    })
    expect(cursor.style.opacity).toBe('0')
    input.remove()

    unmount()
    expect(document.documentElement.hasAttribute('data-smooth-cursor')).toBe(false)
  })
})

describe('Particles', () => {
  it('renders aria-hidden canvas and honors reduced motion without animation frame loop', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
    })
    HTMLCanvasElement.prototype.getContext =
      getContext as unknown as typeof HTMLCanvasElement.prototype.getContext

    const raf = vi.spyOn(window, 'requestAnimationFrame')
    render(<Particles data-testid="particles" quantity={20} connect={40} />)

    const canvas = screen.getByTestId('particles')
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(raf).not.toHaveBeenCalled()
  })
})

describe('NoiseTexture', () => {
  it('renders procedural SVG turbulence in background and is aria-hidden', () => {
    render(<NoiseTexture data-testid="noise" opacity={0.15} animated />)
    const noise = screen.getByTestId('noise')
    expect(noise.getAttribute('aria-hidden')).toBe('true')
    expect(noise.style.opacity).toBe('0.15')
    const inner = noise.querySelector('[data-slot="noise-texture-grain"]')
    expect(inner?.className).toContain('motion-reduce:animate-none')
  })
})

describe('Ambilight', () => {
  it('mirrors images behind content using CSS filter and aria-hidden', () => {
    render(
      <Ambilight blur={50} spread={1.2}>
        <img src="/art.png" alt="Art preview" />
      </Ambilight>,
    )

    // Real accessible image exists exactly once
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(1)

    const glow = document.querySelector('[data-slot="ambilight-glow"]')
    expect(glow?.getAttribute('aria-hidden')).toBe('true')
    expect(glow?.getAttribute('style')).toContain('blur(50px)')
    expect(glow?.getAttribute('style')).toContain('scale(1.2)')
  })

  it('lights a video from a canvas and never clones the video', () => {
    render(
      <Ambilight>
        <video src="/clip.webm" muted />
      </Ambilight>,
    )
    expect(document.querySelectorAll('video')).toHaveLength(1)
    expect(document.querySelectorAll('[data-slot="ambilight-glow"] canvas')).toHaveLength(2)
  })

  it('lights a YouTube player with a muted copy of it', () => {
    render(
      <Ambilight>
        <iframe src="https://www.youtube-nocookie.com/embed/PWgvGjAhvIw" title="Player" />
      </Ambilight>,
    )
    const [player, mirror] = [
      document.querySelector<HTMLIFrameElement>('[data-slot="ambilight-content"] iframe'),
      document.querySelector<HTMLIFrameElement>('[data-slot="ambilight-glow"] iframe'),
    ]
    expect(player?.src).toContain('enablejsapi=1')
    expect(mirror?.src).toContain('/embed/PWgvGjAhvIw?enablejsapi=1&mute=1&controls=0')
    expect(mirror?.tabIndex).toBe(-1)
    expect(mirror?.closest('[inert]')).toBeTruthy()
  })

  it('tells the copy to play, pause and catch up with the player', () => {
    const at = (state: number, time: number) => ({ state, time })
    expect(followCommands(at(1, 10), at(2, 10), true)).toEqual([['playVideo', []]])
    expect(followCommands(at(2, 10), at(1, 10), true)).toEqual([['pauseVideo', []]])
    expect(followCommands(at(1, 10), at(1, 10), false)).toEqual([['pauseVideo', []]])
    expect(followCommands(at(1, 42), at(1, 10.2), true)).toEqual([['seekTo', [42, true]]])
    expect(followCommands(at(1, 10.3), at(1, 10), true)).toEqual([])
  })

  it('lights the glow from an image when the content cannot be read', () => {
    render(
      <Ambilight glow="/thumb.jpg">
        <iframe src="https://player.vimeo.com/video/1" title="Player" />
      </Ambilight>,
    )
    expect(document.querySelectorAll('iframe')).toHaveLength(1)
    expect(document.querySelector('[data-slot="ambilight-glow"] img')?.getAttribute('src')).toBe(
      '/thumb.jpg',
    )
  })
})

describe('ScrollProgress', () => {
  it('renders bar variant with aria-hidden', () => {
    render(<ScrollProgress data-testid="progress-bar" variant="bar" />)
    const el = screen.getByTestId('progress-bar')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.getAttribute('data-variant')).toBe('bar')
  })

  it('renders circle variant as a button with localized accessible back-to-top label', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(<ScrollProgress variant="circle" />)
    const button = screen.getByRole('button', { name: 'Back to top' })
    expect(button).toBeTruthy()

    fireEvent.click(button)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: expect.any(String) })
  })
})
