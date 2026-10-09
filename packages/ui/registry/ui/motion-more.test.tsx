import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedBeam } from './animated-beam'
import { FlickeringGrid } from './flickering-grid'
import { FlipClock } from './flip-clock'
import { PixelTrail } from './pixel-trail'
import { ProximityGlow, ProximityGlowItem } from './proximity-glow'
import { RollText } from './roll-text'
import { ScratchReveal } from './scratch-reveal'
import { SplitText } from './split-text'
import { StackScroll, StackScrollItem } from './stack-scroll'
import { Warp } from './warp'

beforeEach(() => {
  // Run frames at once, so what a pointer or a scroll schedules is there to check.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(performance.now())
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** jsdom lays nothing out: boxes by `data-box`. */
function layout(boxes: Record<string, { x: number; y: number; width: number; height: number }>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const b = boxes[this.dataset.box ?? ''] ?? { x: 0, y: 0, width: 0, height: 0 }
    return {
      left: b.x,
      top: b.y,
      right: b.x + b.width,
      bottom: b.y + b.height,
      width: b.width,
      height: b.height,
      x: b.x,
      y: b.y,
    } as DOMRect
  })
}

describe('RollText', () => {
  it('reads the text once and rolls each letter to its copy, one after another', () => {
    const { container } = render(<RollText text="Go on" stagger={40} />)
    expect(screen.getByText('Go on').className).toContain('sr-only')
    const rollers = container.querySelectorAll('[aria-hidden] > span > span')
    expect(rollers).toHaveLength(5)
    expect((rollers[2] as HTMLElement).style.transitionDelay).toBe('80ms')
    // Each letter carries its copy underneath.
    expect(rollers[0]?.textContent).toBe('GG')
  })
})

describe('SplitText', () => {
  it('scatters the same way every time, so a server render matches the browser', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    const one = render(<SplitText text="Hello world" />).container.innerHTML
    const two = render(<SplitText text="Hello world" />).container.innerHTML
    expect(one).toBe(two)
    expect(one).toContain('translate:')
  })

  it('keeps words whole and lands the letters once in view', () => {
    const { container } = render(<SplitText text="Hi there" stagger={10} />)
    const words = container.querySelectorAll('.whitespace-nowrap')
    expect(Array.from(words, (w) => w.textContent)).toEqual(['Hi', 'there'])
    const last = container.querySelectorAll<HTMLElement>('.whitespace-nowrap > span')[6]
    expect(last?.style.translate).toBe('')
    expect(last?.style.transitionDelay).toBe('60ms')
  })
})

describe.each([
  ['FlickeringGrid', FlickeringGrid],
  ['Warp', Warp],
  ['PixelTrail', PixelTrail],
])('%s', (_, Canvas) => {
  // jsdom has no 2D context, like an old browser or a blocked canvas: decoration must not throw.
  it('survives no canvas context and stays out of the accessibility tree', () => {
    const { container } = render(
      <div>
        <Canvas />
      </div>,
    )
    const canvas = container.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
    expect(canvas?.className).toContain('pointer-events-none')
  })
})

describe('ProximityGlow', () => {
  it('hands each card the pointer in its own coordinates, and goes dark when it leaves', () => {
    layout({
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 200, y: 0, width: 100, height: 100 },
    })
    const { container } = render(
      <ProximityGlow>
        <ProximityGlowItem data-box="a">A</ProximityGlowItem>
        <ProximityGlowItem data-box="b">B</ProximityGlowItem>
      </ProximityGlow>,
    )
    const root = container.firstElementChild as HTMLElement
    fireEvent.pointerMove(root, { clientX: 150, clientY: 40 })
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>('[data-box]'))
    expect(a?.style.getPropertyValue('--glow-x')).toBe('150px')
    expect(b?.style.getPropertyValue('--glow-x')).toBe('-50px')
    expect(b?.style.getPropertyValue('--glow-y')).toBe('40px')
    expect(root.hasAttribute('data-glowing')).toBe(true)
    fireEvent.pointerLeave(root)
    expect(root.hasAttribute('data-glowing')).toBe(false)
  })
})

describe('ScratchReveal', () => {
  it('keeps the content out of reach until revealed, from the keyboard', () => {
    const onReveal = vi.fn()
    render(
      <ScratchReveal onReveal={onReveal}>
        <a href="/prize">Your prize</a>
      </ScratchReveal>,
    )
    expect(screen.queryByRole('link')).toBeNull()
    const cover = screen.getByRole('button', { name: 'Reveal the hidden content' })
    // A pointer click is the end of a scratch, not a reveal.
    fireEvent.click(cover, { detail: 1 })
    expect(onReveal).not.toHaveBeenCalled()
    fireEvent.click(cover, { detail: 0 })
    fireEvent.click(cover, { detail: 0 })
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Your prize' })).toBeTruthy()
    // Content that fills the card has a full-size box to fill, not one as tall as its text.
    expect(screen.getByRole('link').parentElement?.className).toContain('size-full')
  })
})

describe('AnimatedBeam', () => {
  function Diagram({ reverse }: { reverse?: boolean }) {
    const box = React.useRef<HTMLDivElement>(null)
    const from = React.useRef<HTMLDivElement>(null)
    const to = React.useRef<HTMLDivElement>(null)
    return (
      <div ref={box} data-box="box">
        <div ref={from} data-box="from" />
        <div ref={to} data-box="to" />
        <AnimatedBeam containerRef={box} fromRef={from} toRef={to} reverse={reverse} />
      </div>
    )
  }

  it('runs a line between the centers of both ends, and the pulse either way', () => {
    layout({
      box: { x: 10, y: 10, width: 400, height: 200 },
      from: { x: 30, y: 60, width: 40, height: 40 },
      to: { x: 330, y: 60, width: 40, height: 40 },
    })
    const { container, rerender } = render(<Diagram />)
    const [line, pulse] = Array.from(container.querySelectorAll('path'))
    expect(line?.getAttribute('d')).toBe('M 40,70 Q 190,70 340,70')
    expect(pulse?.style.getPropertyValue('--beam-to')).toBe('-1')
    rerender(<Diagram reverse />)
    expect(container.querySelectorAll('path')[1]?.style.getPropertyValue('--beam-from')).toBe('-1')
  })
})

describe('FlipClock', () => {
  it('reads the value, and flips only the characters that changed', () => {
    const { container, rerender } = render(<FlipClock value="12:45" />)
    expect(screen.getByText('12:45').className).toContain('sr-only')
    const flaps = () => container.querySelectorAll('[class*="flip-clock-top"]')
    expect(flaps()).toHaveLength(0)
    rerender(<FlipClock value="12:46" />)
    expect(flaps()).toHaveLength(1)
    // The colon sits between flaps, not in one.
    expect(container.querySelectorAll('.text-muted-foreground')[0]?.textContent).toBe(':')
  })
})

describe('StackScroll', () => {
  it('sticks each card lower than the last and shrinks the ones covered', () => {
    layout({
      one: { x: 0, y: 96, width: 300, height: 200 },
      two: { x: 0, y: 112, width: 300, height: 200 },
    })
    const { container } = render(
      <StackScroll shrink={0.1}>
        <StackScrollItem index={0} data-box="one">
          One
        </StackScrollItem>
        <StackScrollItem index={1} data-box="two">
          Two
        </StackScrollItem>
      </StackScroll>,
    )
    const [one, two] = Array.from(container.querySelectorAll<HTMLElement>('[data-box]'))
    expect(two?.style.top).toBe('calc(var(--stack-top) + 1 * var(--stack-offset))')
    // Two covers 184 of One's 200 pixels.
    const card = (item?: HTMLElement) => item?.firstElementChild as HTMLElement | null
    expect(Number(card(one)?.style.scale)).toBeCloseTo(0.908, 3)
    expect(card(two)?.style.scale).toBe('1')
    // Scrolling anywhere updates it: the card moves off the one below.
    layout({
      one: { x: 0, y: 96, width: 300, height: 200 },
      two: { x: 0, y: 400, width: 300, height: 200 },
    })
    act(() => {
      fireEvent.scroll(document)
    })
    expect(card(one)?.style.scale).toBe('1')
  })
})
