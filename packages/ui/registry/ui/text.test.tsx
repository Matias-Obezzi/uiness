import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GradientBorder, GradientText } from './gradient-text'
import { Odometer } from './odometer'
import { ScrambleText } from './scramble-text'
import { TextReveal } from './text-reveal'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Pretend the user asked for less motion. */
const reduceMotion = () =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })),
  )

describe('GradientText', () => {
  it('fills the text with a looping gradient of the given colors', () => {
    render(
      <GradientText colors={['red', 'blue']} speed={2}>
        Hello
      </GradientText>,
    )
    const el = screen.getByText('Hello')
    expect(el.dataset.slot).toBe('gradient-text')
    expect(el.className).toContain('bg-clip-text')
    expect(el.className).toContain('animate-[gradient-text')
    expect(el.className).toContain('motion-reduce:animate-none')
    expect(el.style.backgroundImage).toContain('red, blue, red')
    expect(el.style.getPropertyValue('--gradient-duration')).toBe('4s')
  })

  it('can hold still and render as its child', () => {
    render(
      <GradientText asChild animate={false}>
        <h1>Title</h1>
      </GradientText>,
    )
    const heading = screen.getByRole('heading', { name: 'Title' })
    expect(heading.dataset.slot).toBe('gradient-text')
    expect(heading.className).not.toContain('animate-')
  })

  it('draws a gradient ring around a box', () => {
    render(<GradientBorder width="2px">Inside</GradientBorder>)
    const box = screen.getByText('Inside')
    expect(box.style.getPropertyValue('--gradient-border-width')).toBe('2px')
    const ring = box.querySelector<HTMLElement>('[data-slot=gradient-border-ring]')
    expect(ring?.getAttribute('aria-hidden')).toBe('true')
    expect(ring?.className).toContain('animate-[gradient-text')
  })
})

describe('ScrambleText', () => {
  const glyphs = () => document.querySelector('[data-slot=scramble-text-glyphs]')
  /** What is on screen: the last layer of each cell, without the invisible sizers. */
  const visible = () =>
    [...(glyphs()?.children ?? [])]
      .map((word) => [...word.children].map((cell) => cell.lastElementChild?.textContent).join(''))
      .join(' ')
  const scrambled = () => document.querySelectorAll('[data-scrambled]').length

  it('scrambles on mount and resolves into the text', () => {
    vi.useFakeTimers()
    const done = vi.fn()
    render(
      <ScrambleText
        text="HELLO"
        trigger="mount"
        characters="#"
        duration={100}
        speed={10}
        onComplete={done}
      />,
    )
    expect(screen.getByText('HELLO', { selector: '.sr-only' })).toBeTruthy()
    expect(glyphs()?.getAttribute('aria-hidden')).toBe('true')
    act(() => vi.advanceTimersByTime(0))
    expect(visible()).toBe('#####')
    expect(scrambled()).toBeGreaterThan(0)
    expect(document.querySelector('[data-slot=scramble-text]')?.getAttribute('data-state')).toBe(
      'scrambling',
    )
    act(() => vi.advanceTimersByTime(50))
    // Settles from the left.
    expect(visible().startsWith('HE')).toBe(true)
    act(() => vi.advanceTimersByTime(60))
    expect(visible()).toBe('HELLO')
    expect(scrambled()).toBe(0)
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('keeps spaces and wraps each word whole', () => {
    vi.useFakeTimers()
    render(<ScrambleText text="AB CD" trigger="mount" characters="#" duration={100} speed={10} />)
    act(() => vi.advanceTimersByTime(0))
    expect(visible()).toBe('## ##')
    expect(glyphs()?.querySelectorAll('.whitespace-nowrap')).toHaveLength(2)
  })

  it('plays on hover of the surrounding link, and not before', () => {
    vi.useFakeTimers()
    render(
      <a href="#docs">
        <ScrambleText text="Docs" trigger="hover" characters="#" duration={40} speed={10} />
      </a>,
    )
    act(() => vi.advanceTimersByTime(100))
    expect(visible()).toBe('Docs')
    fireEvent.pointerEnter(screen.getByRole('link'))
    act(() => vi.advanceTimersByTime(0))
    expect(visible()).toBe('####')
    act(() => vi.advanceTimersByTime(40))
    expect(visible()).toBe('Docs')
  })

  it('shows the text straight away with reduced motion', () => {
    reduceMotion()
    vi.useFakeTimers()
    render(<ScrambleText text="Calm" trigger="mount" characters="#" />)
    act(() => vi.advanceTimersByTime(0))
    expect(visible()).toBe('Calm')
    expect(scrambled()).toBe(0)
  })

  it('stops its timers on unmount', () => {
    vi.useFakeTimers()
    const done = vi.fn()
    const { unmount } = render(
      <ScrambleText text="Bye" trigger="mount" duration={100} speed={10} onComplete={done} />,
    )
    act(() => vi.advanceTimersByTime(20))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(done).not.toHaveBeenCalled()
  })
})

describe('Odometer', () => {
  const strips = () =>
    [...document.querySelectorAll<HTMLElement>('[data-slot=odometer-strip]')].map(
      (s) => s.style.transform,
    )
  const frames = () =>
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })

  it('rolls each digit strip to its value and keeps separators still', () => {
    frames()
    const { rerender } = render(<Odometer value={42} locale="en-US" />)
    expect(strips()).toEqual(['translateY(-40%)', 'translateY(-20%)'])
    expect(screen.getByText('42', { selector: '.sr-only' })).toBeTruthy()

    rerender(<Odometer value={1047} locale="en-US" />)
    act(() => vi.advanceTimersByTime(20))
    expect(strips()).toEqual([
      // The new thousands column rolls up from zero.
      'translateY(-10%)',
      'translateY(-0%)',
      'translateY(-40%)',
      'translateY(-70%)',
    ])
    const symbols = document.querySelectorAll('[data-slot=odometer-symbol]')
    expect([...symbols].map((s) => s.textContent)).toEqual([','])
    expect(screen.getByText('1,047', { selector: '.sr-only' })).toBeTruthy()
  })

  it('keeps the units column when the number grows, and staggers from the right', () => {
    frames()
    const { rerender } = render(<Odometer value={9} stagger={50} locale="en-US" />)
    const units = document.querySelector('[data-slot=odometer-digit]')
    rerender(<Odometer value={10} stagger={50} locale="en-US" />)
    const digits = document.querySelectorAll('[data-slot=odometer-digit]')
    expect(digits[1]).toBe(units)
    const delays = [...document.querySelectorAll<HTMLElement>('[data-slot=odometer-strip]')].map(
      (s) => s.style.transitionDelay,
    )
    expect(delays).toEqual(['50ms', '0ms'])
  })

  it('formats decimals and currency with Intl', () => {
    render(
      <Odometer
        value={1234.5}
        decimals={2}
        locale="en-US"
        format={{ style: 'currency', currency: 'USD' }}
      />,
    )
    expect(screen.getByText('$1,234.50', { selector: '.sr-only' })).toBeTruthy()
    expect(document.querySelectorAll('[data-slot=odometer-digit]')).toHaveLength(6)
    const symbols = [...document.querySelectorAll('[data-slot=odometer-symbol]')]
    expect(symbols.map((s) => s.textContent)).toEqual(['$', ',', '.'])
  })

  it('drops the roll with reduced motion', () => {
    render(<Odometer value={5} />)
    expect(document.querySelector('[data-slot=odometer-strip]')?.className).toContain(
      'motion-reduce:transition-none',
    )
  })

  it('cancels a pending frame on unmount', () => {
    frames()
    const { rerender, unmount } = render(<Odometer value={1} />)
    rerender(<Odometer value={2} />)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('TextReveal', () => {
  const geometry = (top: number, height = 200) =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 0,
          y: top,
          top,
          left: 0,
          right: 400,
          bottom: top + height,
          width: 400,
          height,
          toJSON() {},
        }) as DOMRect,
    )
  const progress = () =>
    document
      .querySelector<HTMLElement>('[data-slot=text-reveal]')
      ?.style.getPropertyValue('--text-reveal-progress')

  it('splits the text into words and keeps it readable', () => {
    render(<TextReveal text="We build   things that last" />)
    const p = document.querySelector('[data-slot=text-reveal]')
    expect(p?.textContent).toBe('We build things that last')
    const words = document.querySelectorAll<HTMLElement>('[data-slot=text-reveal-word]')
    expect(words).toHaveLength(5)
    expect(words[3]?.style.getPropertyValue('--i')).toBe('3')
    expect(words[0]?.className).toContain('motion-reduce:opacity-100!')
  })

  it('follows the scroll through the viewport', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    // Below the start line: nothing revealed.
    const rect = geometry(900)
    render(<TextReveal text="One two three" from={0.2} />)
    const p = document.querySelector<HTMLElement>('[data-slot=text-reveal]')
    expect(p?.style.getPropertyValue('--text-reveal-from')).toBe('0.2')
    expect(p?.style.getPropertyValue('--text-reveal-count')).toBe('3')
    expect(progress()).toBe('0.0000')

    // Bottom above 45% of the viewport: all revealed.
    rect.mockRestore()
    geometry(100)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(20)
    })
    expect(progress()).toBe('1.0000')
  })

  it('stops listening on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<TextReveal text="Gone" />)
    unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
