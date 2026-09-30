import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dock, DockItem, DockSeparator } from './dock'
import { FlipCard, FlipCardBack, FlipCardFront } from './flip-card'
import { Magnetic, MagneticInner } from './magnetic'
import { Ripple } from './ripple'

const nativeAnimate = HTMLElement.prototype.animate

afterEach(() => {
  HTMLElement.prototype.animate = nativeAnimate
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const rect = (el: Element, r: Partial<DOMRect>) =>
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    toJSON() {},
    ...r,
  } as DOMRect)

/** Answer media queries: `reduce` for reduced motion, `coarse` for a touch screen. */
const media = (...on: ('reduce' | 'coarse')[]) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion')
      ? on.includes('reduce')
      : query.includes('pointer: fine') && !on.includes('coarse'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))

const fakeFrames = () =>
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  })

const frame = () => act(() => vi.advanceTimersByTime(20))

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot=${name}]`)

describe('Magnetic', () => {
  const setup = () => {
    render(
      <Magnetic strength={0.5} radius={40}>
        <button type="button">
          <MagneticInner factor={0.5}>Go</MagneticInner>
        </button>
      </Magnetic>,
    )
    const el = slot('magnetic')
    if (!el) throw new Error('no magnetic')
    rect(el, { left: 100, top: 100, width: 100, height: 50 })
    return el
  }

  it('pulls towards a pointer that comes near and lets go when it moves away', () => {
    fakeFrames()
    media()
    const el = setup()
    expect(el.dataset.state).toBe('idle')
    fireEvent.pointerMove(window, { clientX: 220, clientY: 105 })
    frame()
    expect(el.style.getPropertyValue('--magnetic-x')).toBe('35.00px')
    expect(el.style.getPropertyValue('--magnetic-y')).toBe('-10.00px')
    expect(el.dataset.state).toBe('active')
    expect(slot('magnetic-inner')?.style.transform).toContain('calc(var(--magnetic-x, 0px) * 0.5)')
    fireEvent.pointerMove(window, { clientX: 600, clientY: 600 })
    frame()
    expect(el.style.getPropertyValue('--magnetic-x')).toBe('0.00px')
    expect(el.dataset.state).toBe('idle')
    expect(el.style.getPropertyValue('--magnetic-duration')).toBe('600ms')
  })

  it('stays put with reduced motion and on touch screens', () => {
    fakeFrames()
    media('reduce')
    const { unmount } = render(<Magnetic>a</Magnetic>)
    fireEvent.pointerMove(window, { clientX: 1, clientY: 1 })
    frame()
    expect(slot('magnetic')?.style.getPropertyValue('--magnetic-x')).toBe('')
    unmount()
    media('coarse')
    render(<Magnetic>b</Magnetic>)
    fireEvent.pointerMove(window, { clientX: 1, clientY: 1 })
    frame()
    expect(slot('magnetic')?.style.getPropertyValue('--magnetic-x')).toBe('')
  })

  it('stops listening when unmounted', () => {
    media()
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Magnetic>a</Magnetic>)
    unmount()
    const removed = remove.mock.calls.map(([type]) => type)
    expect(removed).toEqual(expect.arrayContaining(['pointermove', 'pointerout', 'blur']))
  })
})

describe('Ripple', () => {
  it('starts a wave where the pointer lands, wide enough to cover the element', () => {
    render(<Ripple>card</Ripple>)
    const host = slot('ripple')
    if (!host) throw new Error('no host')
    rect(host, { left: 0, top: 0, width: 200, height: 100 })
    fireEvent.pointerDown(host, { button: 0, clientX: 30, clientY: 20 })
    const wave = slot('ripple-wave')
    const radius = Math.hypot(170, 80)
    expect(Number.parseFloat(wave?.style.width ?? '')).toBeCloseTo(radius * 2, 1)
    expect(Number.parseFloat(wave?.style.left ?? '')).toBeCloseTo(30 - radius, 1)
    expect(wave?.dataset.state).toBe('pressed')
    expect(wave?.style.background).toBe('currentcolor')
    expect(wave?.style.opacity).toBe('0.2')
    expect(wave?.className).toContain('motion-reduce:animate-none')
    expect(slot('ripple-container')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('grows from the center for the keyboard, overlaps, fades and cleans up', () => {
    vi.useFakeTimers()
    render(<Ripple fade={300}>card</Ripple>)
    const host = slot('ripple')
    if (!host) throw new Error('no host')
    rect(host, { width: 200, height: 100 })
    fireEvent.keyDown(host, { key: 'Enter' })
    const wave = slot('ripple-wave')
    expect(Number.parseFloat(wave?.style.top ?? '')).toBeCloseTo(50 - Math.hypot(100, 50), 1)
    fireEvent.keyUp(host, { key: 'Enter' })
    expect(wave?.dataset.state).toBe('released')
    expect(wave?.style.opacity).toBe('0')
    fireEvent.pointerDown(host, { button: 0, clientX: 10, clientY: 10 })
    expect(document.querySelectorAll('[data-slot=ripple-wave]')).toHaveLength(2)
    act(() => vi.advanceTimersByTime(300))
    // The released wave is gone, the held one stays until it is let go.
    expect(document.querySelectorAll('[data-slot=ripple-wave]')).toHaveLength(1)
    fireEvent.pointerLeave(host)
    act(() => vi.advanceTimersByTime(300))
    expect(slot('ripple-wave')).toBeNull()
  })

  it('wraps a button with asChild and keeps its handlers', () => {
    vi.useFakeTimers()
    const down = vi.fn()
    const { unmount } = render(
      <Ripple asChild center>
        <button type="button" onPointerDown={down}>
          Save
        </button>
      </Ripple>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.dataset.slot).toBe('ripple')
    expect(button.className).toContain('relative')
    rect(button, { width: 100, height: 40 })
    fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 })
    expect(down).toHaveBeenCalled()
    expect(
      Number.parseFloat(
        button.querySelector<HTMLElement>('[data-slot=ripple-wave]')?.style.left ?? '',
      ),
    ).toBeCloseTo(50 - Math.hypot(50, 20), 1)
    fireEvent.pointerUp(button)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ignores other buttons and does nothing when disabled', () => {
    render(<Ripple disabled>card</Ripple>)
    const host = slot('ripple')
    if (!host) throw new Error('no host')
    fireEvent.pointerDown(host, { button: 0 })
    fireEvent.keyDown(host, { key: ' ' })
    expect(slot('ripple-wave')).toBeNull()
  })
})

describe('Dock', () => {
  const setup = (props: React.ComponentProps<typeof Dock> = {}) => {
    const utils = render(
      <Dock magnification={2} distance={100} size={40} {...props}>
        <DockItem label="Mail">m</DockItem>
        <DockItem label="Music">n</DockItem>
        <DockSeparator />
        <DockItem label="Trash">t</DockItem>
      </Dock>,
    )
    const dock = slot('dock')
    if (!dock) throw new Error('no dock')
    rect(dock, { left: 0, top: 0 })
    const items = Array.from(dock.querySelectorAll<HTMLElement>('[data-slot=dock-item]'))
    items.forEach((item, i) => {
      Object.defineProperty(item, 'offsetLeft', { value: 8 + i * 60 })
      Object.defineProperty(item, 'offsetWidth', { value: 40 })
    })
    return { ...utils, dock, items }
  }

  const scale = (el: HTMLElement | undefined) => el?.style.getPropertyValue('--dock-scale')

  it('magnifies the item under the pointer and its neighbours less', () => {
    fakeFrames()
    const { dock, items } = setup()
    // Right over the middle item.
    fireEvent.pointerMove(dock, { clientX: 88, clientY: 20 })
    frame()
    expect(dock.hasAttribute('data-active')).toBe(true)
    expect(scale(items[1])).toBe('2.000')
    const side = Number(scale(items[0]))
    expect(side).toBeGreaterThan(1)
    expect(side).toBeLessThan(2)
    expect(scale(items[2])).toBe(scale(items[0]))
    // Neighbours move out of the way symmetrically around the middle item.
    const shift = (el: HTMLElement | undefined) =>
      Number.parseFloat(el?.style.getPropertyValue('--dock-shift') ?? '')
    expect(shift(items[0])).toBeLessThan(0)
    expect(shift(items[2])).toBeCloseTo(-shift(items[0]), 1)
    expect(shift(items[1])).toBeCloseTo(0, 1)
    expect(Number.parseFloat(dock.style.getPropertyValue('--dock-extra'))).toBeGreaterThan(40)
    expect(slot('dock-separator')?.style.getPropertyValue('--dock-scale')).toBe('1.000')

    fireEvent.pointerLeave(dock)
    frame()
    expect(scale(items[1])).toBe('1.000')
    expect(dock.style.getPropertyValue('--dock-extra')).toBe('0.00px')
    expect(dock.hasAttribute('data-active')).toBe(false)
  })

  it('names each item, shows its label and magnifies on keyboard focus', () => {
    fakeFrames()
    const { items } = setup()
    const music = screen.getByRole('button', { name: 'Music' })
    expect(items[1]?.querySelector('[data-slot=dock-item-label]')?.textContent).toBe('Music')
    vi.spyOn(music, 'matches').mockReturnValue(true)
    fireEvent.focus(music)
    frame()
    expect(scale(items[1])).toBe('2.000')
    fireEvent.blur(music)
    frame()
    expect(scale(items[1])).toBe('1.000')
  })

  it('lays out as a column and hops when clicked', () => {
    const animate = vi.fn()
    HTMLElement.prototype.animate = animate as never
    setup({ direction: 'vertical' })
    expect(slot('dock')?.dataset.orientation).toBe('vertical')
    fireEvent.click(screen.getByRole('button', { name: 'Mail' }))
    expect(animate).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(animate.mock.calls[0]?.[0])).toContain('translateX')
  })

  it('keeps its size and does not hop with reduced motion', () => {
    fakeFrames()
    media('reduce')
    const animate = vi.fn()
    HTMLElement.prototype.animate = animate as never
    const { dock, items } = setup()
    fireEvent.pointerMove(dock, { clientX: 88, clientY: 20 })
    frame()
    expect(scale(items[1])).toBe('1.000')
    fireEvent.click(screen.getByRole('button', { name: 'Mail' }))
    expect(animate).not.toHaveBeenCalled()
  })

  it('cancels a pending frame when unmounted', () => {
    fakeFrames()
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { dock, unmount } = setup()
    fireEvent.pointerMove(dock, { clientX: 20, clientY: 20 })
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('FlipCard', () => {
  const card = (props: React.ComponentProps<typeof FlipCard> = {}) =>
    render(
      <FlipCard aria-label="Plan" {...props}>
        <FlipCardFront>front</FlipCardFront>
        <FlipCardBack>
          back <button type="button">Buy</button>
        </FlipCardBack>
      </FlipCard>,
    )

  it('is a toggle button when clicked, and hides the face out of view', () => {
    card({ trigger: 'click' })
    const button = screen.getByRole('button', { name: 'Plan' })
    const front = slot('flip-card-front')
    const back = slot('flip-card-back')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(back?.getAttribute('aria-hidden')).toBe('true')
    expect(back?.hasAttribute('inert')).toBe(true)
    expect(back?.style.transform).toBe('rotateY(180deg)')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(slot('flip-card-inner')?.style.transform).toBe('rotateY(180deg)')
    expect(front?.hasAttribute('inert')).toBe(true)
    expect(back?.hasAttribute('inert')).toBe(false)
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.keyDown(button, { key: ' ' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    // Clicks on something interactive inside are its own.
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }))
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  it('turns over while a mouse is on it, and on tap for touch', () => {
    card()
    const root = slot('flip-card')
    if (!root) throw new Error('no card')
    fireEvent.pointerEnter(root, { pointerType: 'mouse' })
    expect(root.dataset.state).toBe('flipped')
    fireEvent.pointerDown(root, { pointerType: 'mouse' })
    fireEvent.click(root)
    expect(root.dataset.state).toBe('flipped')
    fireEvent.pointerLeave(root, { pointerType: 'mouse' })
    expect(root.dataset.state).toBe('front')
    fireEvent.pointerDown(root, { pointerType: 'touch' })
    fireEvent.click(root)
    expect(root.dataset.state).toBe('flipped')
  })

  it('follows flipped when manual, tipping over vertically', () => {
    const change = vi.fn()
    const { rerender } = render(
      <FlipCard trigger="manual" direction="vertical" flipped={false} onFlippedChange={change}>
        <FlipCardFront>front</FlipCardFront>
        <FlipCardBack>back</FlipCardBack>
      </FlipCard>,
    )
    const root = slot('flip-card')
    expect(root?.getAttribute('role')).toBeNull()
    expect(root?.hasAttribute('tabindex')).toBe(false)
    fireEvent.click(screen.getByText('front'))
    expect(change).not.toHaveBeenCalled()
    rerender(
      <FlipCard trigger="manual" direction="vertical" flipped onFlippedChange={change}>
        <FlipCardFront>front</FlipCardFront>
        <FlipCardBack>back</FlipCardBack>
      </FlipCard>,
    )
    expect(slot('flip-card-inner')?.style.transform).toBe('rotateX(180deg)')
    expect(slot('flip-card-back')?.style.transform).toBe('rotateX(180deg)')
    expect(slot('flip-card-front')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reports changes without moving when controlled', () => {
    const change = vi.fn()
    card({ trigger: 'click', flipped: false, onFlippedChange: change })
    fireEvent.click(screen.getByRole('button', { name: 'Plan' }))
    expect(change).toHaveBeenCalledWith(true)
    expect(slot('flip-card')?.dataset.state).toBe('front')
  })

  it('cross-fades instead of turning with reduced motion', () => {
    media('reduce')
    card({ trigger: 'click', defaultFlipped: true })
    expect(slot('flip-card-inner')?.style.transform).toBe('')
    expect(slot('flip-card-back')?.style.transform).toBe('')
    expect(slot('flip-card-front')?.className).toContain('opacity-0')
    expect(slot('flip-card-back')?.className).not.toContain('opacity-0')
  })
})
