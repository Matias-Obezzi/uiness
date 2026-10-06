import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimatedList } from './animated-list'
import { CardStack } from './card-stack'
import { Terminal, TerminalLine, TerminalSpinner, TerminalTyping } from './terminal'
import { VelocityMarquee } from './velocity-marquee'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** Advance fake timers in small steps, one act each, so chained timeouts get to run. */
const advance = (ms: number, step = 5) => {
  for (let t = 0; t < ms; t += step) act(() => vi.advanceTimersByTime(Math.min(step, ms - t)))
}

const reduceMotion = () =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })),
  )

const frames = () =>
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ],
  })

describe('AnimatedList', () => {
  const items = () =>
    document.querySelectorAll<HTMLElement>('[data-slot=animated-list-item][data-state=visible]')

  it('adds one child at a time, newest on top', () => {
    vi.useFakeTimers()
    render(
      <AnimatedList delay={100}>
        <p>one</p>
        <p>two</p>
        <p>three</p>
      </AnimatedList>,
    )
    advance(5)
    expect(items()).toHaveLength(1)
    expect(items()[0]?.style.animation).toContain('animated-list-in')
    advance(100)
    expect(Array.from(items(), (li) => li.textContent)).toEqual(['two', 'one'])
    advance(300)
    expect(Array.from(items(), (li) => li.textContent)).toEqual(['three', 'two', 'one'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('loops with fresh ids and fades the oldest out past max', () => {
    vi.useFakeTimers()
    render(
      <AnimatedList delay={100} loop max={2}>
        <p>a</p>
        <p>b</p>
      </AnimatedList>,
    )
    advance(5)
    advance(200)
    const shown = Array.from(items())
    expect(shown.map((li) => li.textContent)).toEqual(['a', 'b'])
    expect(shown.map((li) => li.dataset.id)).toEqual(['2', '1'])
    const leaving = document.querySelector<HTMLElement>('[data-state=leaving]')
    expect(leaving?.textContent).toBe('a')
    expect(leaving?.getAttribute('aria-hidden')).toBe('true')
    expect(leaving?.style.animation).toContain('animated-list-out')
  })

  it('shows every item at once with reduced motion', () => {
    reduceMotion()
    vi.useFakeTimers()
    render(
      <AnimatedList loop>
        <p>a</p>
        <p>b</p>
      </AnimatedList>,
    )
    expect(Array.from(items(), (li) => li.textContent)).toEqual(['b', 'a'])
    expect(items()[0]?.style.animation).toBe('')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its timer on unmount', () => {
    vi.useFakeTimers()
    const { unmount } = render(
      <AnimatedList loop>
        <p>a</p>
      </AnimatedList>,
    )
    advance(5)
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('CardStack', () => {
  const front = () =>
    document.querySelector<HTMLElement>('[data-slot=card-stack-item][data-state=front]')
  const stack = () => screen.getByRole('region', { name: 'Quotes' })
  const cards = ['one', 'two', 'three'].map((text) => <p key={text}>{text}</p>)

  it('sends the front card to the back on its own and hides the rest', () => {
    vi.useFakeTimers()
    const change = vi.fn()
    render(
      <CardStack aria-label="Quotes" interval={200} duration={100} onIndexChange={change}>
        <p>one</p>
        <p>two</p>
        <p>three</p>
      </CardStack>,
    )
    expect(front()?.textContent).toBe('one')
    const behind = document.querySelectorAll('[data-state=behind]')
    expect(behind).toHaveLength(2)
    expect(behind[0]?.getAttribute('aria-hidden')).toBe('true')
    expect(behind[0]?.hasAttribute('inert')).toBe(true)
    advance(200)
    expect(change).toHaveBeenCalledWith(1)
    expect(front()?.textContent).toBe('two')
    // The old front flies out on top, then drops under the pile.
    const old = screen.getByText('one').parentElement as HTMLElement
    expect(old.style.transform).toContain('translateX(70%)')
    expect(Number(old.style.zIndex)).toBe(4)
    advance(50)
    expect(old.style.zIndex).toBe('0')
    expect(old.style.transform).toBe('translateY(-24px) scale(0.88)')
    advance(50)
    expect(old.style.zIndex).toBe('1')
  })

  it('pauses on hover', () => {
    vi.useFakeTimers()
    render(
      <CardStack aria-label="Quotes" interval={100}>
        {cards}
      </CardStack>,
    )
    fireEvent.pointerEnter(stack())
    advance(300)
    expect(front()?.textContent).toBe('one')
    fireEvent.pointerLeave(stack())
    advance(100)
    expect(front()?.textContent).toBe('two')
  })

  it('goes forwards and back with the arrow keys', () => {
    vi.useFakeTimers()
    render(
      <CardStack aria-label="Quotes" autoplay={false} duration={100}>
        {cards}
      </CardStack>,
    )
    fireEvent.keyDown(stack(), { key: 'ArrowRight' })
    expect(front()?.textContent).toBe('two')
    advance(100)
    fireEvent.keyDown(stack(), { key: 'ArrowLeft' })
    // The card coming back slides out from under the pile first.
    expect(front()?.textContent).toBe('two')
    advance(50)
    expect(front()?.textContent).toBe('one')
    advance(50)
    fireEvent.keyDown(stack(), { key: 'ArrowUp' })
    advance(100)
    expect(front()?.textContent).toBe('three')
  })

  it('moves on when the front card is clicked or swiped, and snaps back on a short drag', () => {
    vi.useFakeTimers()
    render(
      <CardStack aria-label="Quotes" autoplay={false} duration={100} threshold={50}>
        {cards}
      </CardStack>,
    )
    const card = () => front() as HTMLElement
    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, clientX: 0 })
    fireEvent.pointerUp(card(), { pointerId: 1 })
    expect(front()?.textContent).toBe('two')
    advance(100)

    fireEvent.pointerDown(card(), { button: 0, pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(card(), { pointerId: 1, clientX: 30 })
    expect(card().style.transform).toBe('translateX(30px) rotate(1.5deg)')
    fireEvent.pointerUp(card(), { pointerId: 1 })
    expect(front()?.textContent).toBe('two')
    expect(card().style.transform).toBe('translateY(0px) scale(1)')

    const swiped = card()
    fireEvent.pointerDown(swiped, { button: 0, pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(swiped, { pointerId: 1, clientX: -80 })
    fireEvent.pointerUp(swiped, { pointerId: 1 })
    expect(front()?.textContent).toBe('three')
    expect(swiped.style.transform).toContain('translateX(-70%)')
    expect(Number(swiped.style.zIndex)).toBe(4)
    advance(100)
    // Thrown to the left it still goes to the back of the pile.
    expect(front()?.textContent).toBe('three')
    expect(swiped.style.zIndex).toBe('1')
  })

  it('swaps in place and never autoplays with reduced motion', () => {
    reduceMotion()
    vi.useFakeTimers()
    const { unmount } = render(
      <CardStack aria-label="Quotes" interval={100}>
        {cards}
      </CardStack>,
    )
    advance(300)
    expect(front()?.textContent).toBe('one')
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.keyDown(stack(), { key: 'ArrowLeft' })
    expect(front()?.textContent).toBe('three')
    expect(front()?.style.transition).toBe('none')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('VelocityMarquee', () => {
  const rows = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-slot=velocity-marquee-track]'))
  const x = (el?: HTMLElement) =>
    Number(/translate3d\((-?[\d.]+)px/.exec(el?.style.transform ?? '')?.[1])

  it('runs each row the other way and hides the copies', () => {
    frames()
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000)
    render(
      <VelocityMarquee baseVelocity={100}>
        <span>first</span>
        <span>second</span>
      </VelocityMarquee>,
    )
    expect(rows()).toHaveLength(2)
    const copies = rows()[0]?.children ?? []
    expect(copies).toHaveLength(2)
    expect(copies[0]?.getAttribute('aria-hidden')).toBeNull()
    expect(copies[1]?.getAttribute('aria-hidden')).toBe('true')
    act(() => vi.advanceTimersByTime(100))
    const [a, b] = rows().map(x)
    expect(a).toBeLessThan(0)
    expect(a).toBeGreaterThan(-20)
    // The second row goes right, which wraps it round to just under a full width.
    expect(b).toBeLessThan(-980)
  })

  it('turns around when the page scrolls back up', () => {
    frames()
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000)
    vi.stubGlobal('scrollY', 5000)
    render(
      <VelocityMarquee baseVelocity={100} sensitivity={0.01}>
        <span>row</span>
      </VelocityMarquee>,
    )
    act(() => vi.advanceTimersByTime(100))
    const before = x(rows()[0])
    vi.stubGlobal('scrollY', 4000)
    act(() => vi.advanceTimersByTime(50))
    expect(x(rows()[0])).toBeGreaterThan(before)
  })

  it('stands still with reduced motion or off screen, and stops on unmount', () => {
    reduceMotion()
    frames()
    const { unmount } = render(
      <VelocityMarquee>
        <span>still</span>
      </VelocityMarquee>,
    )
    act(() => vi.advanceTimersByTime(100))
    expect(rows()[0]?.style.transform).toBe('')
    unmount()
    vi.unstubAllGlobals()

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    render(
      <VelocityMarquee>
        <span>hidden</span>
      </VelocityMarquee>,
    )
    act(() => vi.advanceTimersByTime(100))
    expect(rows()[0]?.style.transform).toBe('')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs on CSS alone with the css driver: a constant run plus a scroll-linked push', () => {
    frames()
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(500)
    render(
      <VelocityMarquee driver="css" baseVelocity={100} sensitivity={2}>
        <span>first</span>
        <span>second</span>
      </VelocityMarquee>,
    )
    const root = document.querySelector<HTMLElement>('[data-slot=velocity-marquee]')
    expect(root?.dataset.driver).toBe('css')
    expect(root?.style.getPropertyValue('view-timeline')).toBe('--velocity-marquee block')
    expect(root?.style.getPropertyValue('--velocity-marquee-loops')).toBe('2')
    const [a, b] = rows()
    expect(a?.className).toContain('[animation-name:velocity-marquee-scroll]')
    expect(a?.style.getPropertyValue('animation-timeline')).toBe('--velocity-marquee')
    expect(a?.style.getPropertyValue('animation-direction')).toBe('normal')
    expect(b?.style.getPropertyValue('animation-direction')).toBe('reverse')
    // 500px wide row and copy: one to cover it plus two spare, as the run and the push add up.
    expect(a?.children).toHaveLength(3)
    expect(a?.style.getPropertyValue('--velocity-marquee-copies')).toBe('3')
    const copy = a?.children[0] as HTMLElement
    expect(copy.className).toContain('[animation-name:velocity-marquee]')
    // 500px at 100px a second.
    expect(copy.style.animationDuration).toBe('5s')
    // No frame loop: nothing written by JavaScript.
    act(() => vi.advanceTimersByTime(100))
    expect(a?.style.transform).toBe('')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels its frame on unmount', () => {
    frames()
    const { unmount } = render(
      <VelocityMarquee>
        <span>row</span>
      </VelocityMarquee>,
    )
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('Terminal', () => {
  const session = (props: React.ComponentProps<typeof Terminal> = {}) => (
    <Terminal title="zsh" {...props}>
      <TerminalTyping speed={10} delay={20}>
        ls
      </TerminalTyping>
      <TerminalSpinner duration={50} done="Listed.">
        Listing
      </TerminalSpinner>
      <TerminalLine delay={30}>README.md</TerminalLine>
    </Terminal>
  )
  const typed = () =>
    document.querySelector('[data-slot=terminal-typing] [aria-hidden]:not(.select-none)')
      ?.textContent

  it('plays its children one after the other', () => {
    vi.useFakeTimers()
    render(session())
    expect(screen.getByText('zsh')).toBeTruthy()
    expect(typed()).toBe('')
    expect(screen.getByText('ls', { selector: '.sr-only' })).toBeTruthy()
    expect(document.querySelector('[data-slot=terminal-spinner]')).toBeNull()
    advance(30)
    expect(typed()).toBe('l')
    advance(10)
    expect(typed()).toBe('ls')
    expect(screen.getByText('Listing')).toBeTruthy()
    expect(document.querySelector('[data-slot=terminal-cursor]')).toBeNull()
    advance(50)
    expect(screen.getByText('Listed.')).toBeTruthy()
    expect(screen.queryByText('README.md')).toBeNull()
    advance(30)
    const line = screen.getByText('README.md')
    expect(line.style.animation).toContain('terminal-line-in')
    expect(document.querySelector('[data-slot=terminal]')?.getAttribute('data-state')).toBe('done')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('replays from the button and loops on its own', () => {
    vi.useFakeTimers()
    const { unmount } = render(session())
    const replay = screen.getByRole('button', { name: 'Replay' })
    expect(replay.tabIndex).toBe(-1)
    advance(200)
    expect(replay.tabIndex).toBe(0)
    fireEvent.click(replay)
    expect(screen.queryByText('README.md')).toBeNull()
    expect(typed()).toBe('')
    unmount()

    render(session({ loop: true, loopDelay: 100 }))
    advance(200)
    expect(screen.getByText('README.md')).toBeTruthy()
    advance(100)
    expect(screen.queryByText('README.md')).toBeNull()
  })

  it('shows the whole session at once with reduced motion', () => {
    reduceMotion()
    vi.useFakeTimers()
    render(session({ loop: true }))
    expect(typed()).toBe('ls')
    expect(screen.getByText('Listed.')).toBeTruthy()
    expect(screen.getByText('README.md').style.animation).toBe('')
    expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its timers on unmount', () => {
    vi.useFakeTimers()
    const { unmount } = render(session())
    advance(25)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
