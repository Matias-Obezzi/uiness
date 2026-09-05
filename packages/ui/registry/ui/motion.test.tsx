import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimatedTooltip } from './animated-tooltip'
import { Compare } from './compare'
import { FlipWords } from './flip-words'
import { HoverHighlight, HoverHighlightItem } from './hover-highlight'
import { Marquee } from './marquee'
import { Meteors } from './meteors'
import { MovingBorder } from './moving-border'
import { NumberTicker } from './number-ticker'
import { Pattern } from './pattern'
import { Reveal } from './reveal'
import { Shimmer } from './shimmer'
import { Spotlight, SpotlightCard } from './spotlight'
import { TextGenerate } from './text-generate'
import { TiltCard, TiltCardItem } from './tilt-card'
import { Typewriter } from './typewriter'

afterEach(() => {
  vi.useRealTimers()
})

/** Advance fake timers in small steps, one act each, so chained timeouts get to run. */
const advance = (ms: number, step = 5) => {
  for (let t = 0; t < ms; t += step) act(() => vi.advanceTimersByTime(Math.min(step, ms - t)))
}

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

describe('TextGenerate', () => {
  it('wraps each word in a span with a growing delay and keeps the text readable', () => {
    render(<TextGenerate text="Hello brave new world" stagger={50} delay={100} />)
    const p = screen.getByText('Hello').closest('p')
    expect(p?.textContent).toBe('Hello brave new world')
    const spans = p?.querySelectorAll('span') ?? []
    expect(spans).toHaveLength(4)
    expect(spans[0]?.style.animation).toContain('100ms')
    expect(spans[3]?.style.animation).toContain('250ms')
  })

  it('can split by character', () => {
    render(<TextGenerate text="abc" by="character" />)
    expect(screen.getByText('a').closest('p')?.querySelectorAll('span')).toHaveLength(3)
  })
})

describe('Typewriter', () => {
  it('types, holds, deletes and moves to the next word', () => {
    vi.useFakeTimers()
    const typed = vi.fn()
    render(
      <Typewriter
        words={['Hi', 'Yo']}
        typeSpeed={10}
        deleteSpeed={5}
        pause={100}
        onWordTyped={typed}
      />,
    )
    const text = () => document.querySelector('[data-slot=typewriter-text]')?.textContent
    expect(text()).toBe('')
    advance(25)
    expect(text()).toBe('Hi')
    expect(typed).toHaveBeenCalledWith('Hi', 0)
    advance(100 + 10)
    expect(text()).toBe('')
    advance(25)
    expect(text()).toBe('Yo')
    expect(screen.getByText('Yo', { selector: '.sr-only' })).toBeTruthy()
  })

  it('stops after a single word', () => {
    vi.useFakeTimers()
    render(<Typewriter words="Done" typeSpeed={10} pause={50} />)
    advance(200, 10)
    expect(document.querySelector('[data-slot=typewriter-text]')?.textContent).toBe('Done')
    expect(document.querySelector('[data-slot=typewriter-cursor]')?.className).toContain('blink')
  })
})

describe('FlipWords', () => {
  it('moves to the next word after the interval and animates the old one out', () => {
    vi.useFakeTimers()
    render(<FlipWords words={['fast', 'slow']} interval={100} duration={20} />)
    const current = () => document.querySelector('[data-slot=flip-word]')?.textContent
    expect(current()).toBe('fast')
    act(() => vi.advanceTimersByTime(100))
    expect(current()).toBe('slow')
    expect(document.querySelector('[data-slot=flip-word-out]')?.textContent).toBe('fast')
    act(() => vi.advanceTimersByTime(20))
    expect(document.querySelector('[data-slot=flip-word-out]')).toBeNull()
  })
})

describe('NumberTicker', () => {
  it('counts up to the value and lands exactly on it', () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    render(<NumberTicker value={1234} duration={200} />)
    const shown = () =>
      document.querySelector('[data-slot=number-ticker] [aria-hidden]')?.textContent
    expect(shown()).toBe('0')
    act(() => vi.advanceTimersByTime(100))
    const mid = Number(shown()?.replace(/,/g, ''))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1234)
    act(() => vi.advanceTimersByTime(300))
    expect(shown()).toBe('1,234')
    expect(screen.getByText('1,234', { selector: '.sr-only' })).toBeTruthy()
  })

  it('formats decimals and currency', () => {
    render(
      <NumberTicker
        value={9.5}
        decimals={1}
        whenVisible={false}
        format={{ style: 'currency', currency: 'USD' }}
      />,
    )
    expect(screen.getByText('$9.5', { selector: '.sr-only' })).toBeTruthy()
  })
})

describe('Marquee', () => {
  it('repeats the content and hides the copies from assistive tech', () => {
    render(
      <Marquee duration={10} gap="2rem">
        <span>logo</span>
      </Marquee>,
    )
    const groups = document.querySelectorAll('[data-slot=marquee-group]')
    expect(groups).toHaveLength(2)
    expect(groups[0]?.getAttribute('aria-hidden')).toBeNull()
    expect(groups[1]?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getAllByText('logo')).toHaveLength(2)
    const root = document.querySelector<HTMLElement>('[data-slot=marquee]')
    expect(root?.style.getPropertyValue('--duration')).toBe('10s')
    expect(root?.style.getPropertyValue('--gap')).toBe('2rem')
  })

  it('goes the other way and up when asked', () => {
    render(
      <Marquee reverse vertical repeat={3}>
        <span>x</span>
      </Marquee>,
    )
    const group = document.querySelector<HTMLElement>('[data-slot=marquee-group]')
    expect(group?.style.animation).toContain('marquee-vertical')
    expect(group?.style.animation).toContain('reverse')
    expect(document.querySelectorAll('[data-slot=marquee-group]')).toHaveLength(3)
  })
})

describe('Meteors and Pattern', () => {
  it('draws the asked number of meteors with deterministic positions', () => {
    const { unmount } = render(<Meteors count={7} />)
    const first = Array.from(document.querySelectorAll<HTMLElement>('[data-slot=meteor]'))
    expect(first).toHaveLength(7)
    const positions = first.map((m) => m.style.left)
    unmount()
    render(<Meteors count={7} />)
    const again = Array.from(document.querySelectorAll<HTMLElement>('[data-slot=meteor]')).map(
      (m) => m.style.left,
    )
    expect(again).toEqual(positions)
  })

  it('switches between grid lines and dots', () => {
    const { rerender } = render(<Pattern />)
    expect(document.querySelector('pattern path')).toBeTruthy()
    rerender(<Pattern variant="dots" />)
    expect(document.querySelector('pattern circle')).toBeTruthy()
  })
})

describe('Compare', () => {
  it('moves the divider with the keyboard and reports it', () => {
    const onValueChange = vi.fn()
    render(
      <Compare
        before={<div>before</div>}
        after={<div>after</div>}
        initial={50}
        onValueChange={onValueChange}
      />,
    )
    const handle = screen.getByRole('slider', { name: 'Compare' })
    expect(handle.getAttribute('aria-valuenow')).toBe('50')
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(handle.getAttribute('aria-valuenow')).toBe('52')
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(handle.getAttribute('aria-valuenow')).toBe('42')
    fireEvent.keyDown(handle, { key: 'End' })
    expect(handle.getAttribute('aria-valuenow')).toBe('100')
    expect(onValueChange).toHaveBeenLastCalledWith(100)
    const root = document.querySelector<HTMLElement>('[data-slot=compare]')
    expect(root?.style.getPropertyValue('--position')).toBe('100%')
  })

  it('follows the pointer while dragging', () => {
    render(<Compare before={<div>b</div>} after={<div>a</div>} />)
    const root = document.querySelector<HTMLElement>('[data-slot=compare]')
    if (!root) throw new Error('no root')
    rect(root, { width: 200 })
    fireEvent.pointerDown(root, { button: 0, pointerId: 1, clientX: 50 })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('25')
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 150 })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('75')
    fireEvent.pointerUp(root, { pointerId: 1 })
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 10 })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('75')
  })
})

describe('TiltCard and Spotlight', () => {
  it('tilts towards the pointer and settles back on leave', () => {
    render(
      <TiltCard max={10}>
        <TiltCardItem depth={30}>hello</TiltCardItem>
      </TiltCard>,
    )
    const card = document.querySelector<HTMLElement>('[data-slot=tilt-card]')
    if (!card) throw new Error('no card')
    rect(card, { width: 200, height: 100 })
    fireEvent.pointerMove(card, { clientX: 200, clientY: 0 })
    expect(card.style.getPropertyValue('--tilt-y')).toBe('10.00deg')
    expect(card.style.getPropertyValue('--tilt-x')).toBe('10.00deg')
    expect(card.hasAttribute('data-hover')).toBe(true)
    fireEvent.pointerLeave(card)
    expect(card.style.getPropertyValue('--tilt-y')).toBe('0deg')
    expect(card.hasAttribute('data-hover')).toBe(false)
    expect(document.querySelector<HTMLElement>('[data-slot=tilt-card-item]')?.style.transform).toBe(
      'translateZ(30px)',
    )
  })

  it('puts the light where the pointer is', () => {
    render(
      <>
        <Spotlight>section</Spotlight>
        <SpotlightCard>card</SpotlightCard>
      </>,
    )
    for (const slot of ['spotlight', 'spotlight-card']) {
      const el = document.querySelector<HTMLElement>(`[data-slot=${slot}]`)
      if (!el) throw new Error(slot)
      rect(el, { left: 10, top: 20 })
      fireEvent.pointerMove(el, { clientX: 60, clientY: 70 })
      expect(el.style.getPropertyValue('--spotlight-x')).toBe('50px')
      expect(el.style.getPropertyValue('--spotlight-y')).toBe('50px')
    }
  })
})

describe('HoverHighlight', () => {
  it('slides the highlight to the hovered item and hides it on leave', () => {
    render(
      <HoverHighlight>
        <HoverHighlightItem>one</HoverHighlightItem>
        <HoverHighlightItem>two</HoverHighlightItem>
      </HoverHighlight>,
    )
    const root = document.querySelector<HTMLElement>('[data-slot=hover-highlight]')
    const block = document.querySelector<HTMLElement>('[data-slot=hover-highlight-block]')
    const items = document.querySelectorAll<HTMLElement>('[data-slot=hover-highlight-item]')
    if (!root || !block || items.length < 2) throw new Error('missing parts')
    rect(root, { left: 0, top: 0 })
    rect(items[1] as HTMLElement, { left: 120, top: 40, width: 80, height: 30 })
    expect(block.style.opacity).not.toBe('1')
    fireEvent.pointerEnter(items[1] as HTMLElement)
    expect(block.style.opacity).toBe('1')
    expect(block.style.transform).toBe('translate(120px, 40px)')
    expect(block.style.width).toBe('80px')
    expect(block.style.transitionDuration).toBe('0ms')
    fireEvent.pointerEnter(items[0] as HTMLElement)
    expect(block.style.transitionDuration).toBe('250ms')
    fireEvent.pointerLeave(root)
    expect(block.style.opacity).toBe('0')
  })
})

describe('Reveal', () => {
  it('is visible without an IntersectionObserver and staggers its children', () => {
    render(
      <Reveal stagger={100} delay={50}>
        <div>a</div>
        <div>b</div>
      </Reveal>,
    )
    const root = document.querySelector('[data-slot=reveal]')
    expect(root?.getAttribute('data-state')).toBe('visible')
    const a = screen.getByText('a')
    const b = screen.getByText('b')
    expect(a.style.transitionDelay).toBe('50ms')
    expect(b.style.transitionDelay).toBe('150ms')
    expect(b.getAttribute('data-state')).toBe('visible')
  })
})

describe('AnimatedTooltip, Shimmer, MovingBorder', () => {
  it('shows the card of the hovered avatar and names each one', () => {
    render(
      <AnimatedTooltip
        items={[
          { id: 1, name: 'Ada', title: 'Engineer', image: '/a.png' },
          { id: 2, name: 'Alan', image: '/b.png' },
        ]}
      />,
    )
    const ada = screen.getByRole('button', { name: 'Ada, Engineer' })
    const card = ada.querySelector('[data-slot=animated-tooltip-content]')
    expect(card?.getAttribute('aria-hidden')).toBe('true')
    fireEvent.pointerEnter(ada)
    expect(card?.getAttribute('aria-hidden')).toBe('false')
    expect(ada.getAttribute('data-state')).toBe('open')
    fireEvent.pointerLeave(ada)
    expect(ada.getAttribute('data-state')).toBe('closed')
    expect(screen.getByRole('button', { name: 'Alan' })).toBeTruthy()
  })

  it('shimmer sweeps and can wrap another element', () => {
    render(
      <Shimmer asChild duration={2}>
        <h1>Title</h1>
      </Shimmer>,
    )
    const h1 = screen.getByRole('heading', { name: 'Title' })
    expect(h1.dataset.slot).toBe('shimmer')
    expect(h1.style.animation).toContain('shimmer 2s')
  })

  it('moving border keeps its content and can wrap a button', () => {
    render(
      <MovingBorder asChild duration={3}>
        <button type="button">Go</button>
      </MovingBorder>,
    )
    const button = screen.getByRole('button', { name: 'Go' })
    expect(button.dataset.slot).toBe('moving-border-inner')
    const frame = button.closest<HTMLElement>('[data-slot=moving-border]')
    expect(
      frame?.querySelector<HTMLElement>('[data-slot=moving-border-light]')?.style.animation,
    ).toContain('moving-border 3s')
  })
})
