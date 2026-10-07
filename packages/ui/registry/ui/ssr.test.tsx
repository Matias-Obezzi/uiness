import { act } from '@testing-library/react'
import type * as React from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Android } from './android'
import { CodeComparison } from './code-comparison'
import { DottedMap } from './dotted-map'
import { Globe } from './globe'
import { IPad } from './ipad'
import { IPhone } from './iphone'
import { MacBook } from './macbook'
import { Meteors } from './meteors'
import { NumberTicker } from './number-ticker'
import { Odometer } from './odometer'
import { OgPreview } from './og-preview'
import { Reveal } from './reveal'
import { Safari } from './safari'
import { ScrambleText } from './scramble-text'
import { TextGenerate } from './text-generate'
import { TextReveal } from './text-reveal'
import { Timeline, TimelineItem } from './timeline'
import { TweetCard } from './tweet-card'
import { Typewriter } from './typewriter'
import { VelocityMarquee } from './velocity-marquee'

let root: Root | undefined
let host: HTMLElement | undefined

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = undefined
  host = undefined
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** The server HTML, parsed into a detached element to query it. */
function serverHtml(ui: React.ReactElement) {
  const html = renderToString(ui)
  const el = document.createElement('div')
  el.innerHTML = html
  return { html, el }
}

/**
 * Put the server HTML in the page and hydrate it, as a framework would. Returns every error
 * React reported: a hydration mismatch shows up here or on the console.
 */
function hydrate(ui: React.ReactElement) {
  const errors: unknown[] = []
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args)
  })
  host = document.createElement('div')
  host.innerHTML = renderToString(ui)
  document.body.append(host)
  act(() => {
    root = hydrateRoot(host as HTMLElement, ui, {
      onRecoverableError: (error) => errors.push(error),
    })
  })
  consoleError.mockRestore()
  return { errors, host }
}

/** Pretend every element is on screen, as a page that hydrates above the fold. */
const onScreen = () =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 100,
    top: 100,
    left: 0,
    right: 400,
    bottom: 140,
    width: 400,
    height: 40,
    toJSON() {},
  } as DOMRect)

const text = (el: ParentNode, slot: string) =>
  el.querySelector(`[data-slot=${slot}]`)?.textContent ?? null

describe('the hydration check', () => {
  it('catches a mismatch', () => {
    function Mismatch() {
      return <span>{typeof window === 'undefined' ? 'server' : 'client'}</span>
    }
    const errors: unknown[] = []
    vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
    host = document.createElement('div')
    host.innerHTML = '<span>server</span>'
    document.body.append(host)
    act(() => {
      root = hydrateRoot(host as HTMLElement, <Mismatch />, {
        onRecoverableError: (error) => errors.push(error),
      })
    })
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('server rendering of the text animations', () => {
  it('typewriter sends its first word typed in full', () => {
    const ui = <Typewriter words={['Ship faster', 'Sleep more']} />
    const { el } = serverHtml(ui)
    expect(text(el, 'typewriter-text')).toBe('Ship faster')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('text generate sends every word visible, and hides them only after mount', () => {
    const ui = <TextGenerate text="Hello brave new world" />
    const { html, el } = serverHtml(ui)
    expect(el.textContent).toBe('Hello brave new world')
    expect(html).not.toContain('opacity-0')
    expect(html).not.toContain('data-animate')
    const { errors, host } = hydrate(ui)
    expect(errors).toEqual([])
    // Off screen at hydration, so it arms and plays as before.
    expect(host.querySelector('[data-slot=text-generate]')?.hasAttribute('data-animate')).toBe(true)
  })

  it('scramble text sends the real text in its glyph layer', () => {
    const ui = <ScrambleText text="Decode me" trigger="mount" />
    const { el } = serverHtml(ui)
    expect(el.querySelector('.sr-only')?.textContent).toBe('Decode me')
    const glyphs = el.querySelector('[data-slot=scramble-text-glyphs]')
    const shown = [...(glyphs?.querySelectorAll('.inline-grid') ?? [])]
      .map((cell) => cell.lastElementChild?.textContent)
      .join('')
    expect(shown).toBe('Decodeme')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('reveal sends its content visible', () => {
    const ui = (
      <Reveal>
        <p>Above the fold</p>
      </Reveal>
    )
    const { el } = serverHtml(ui)
    const reveal = el.querySelector('[data-slot=reveal]')
    expect(reveal?.getAttribute('data-state')).toBe('visible')
    expect(reveal?.textContent).toBe('Above the fold')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('reveal with stagger sends every child visible', () => {
    const ui = (
      <Reveal stagger={100}>
        <p>a</p>
        <p>b</p>
      </Reveal>
    )
    const { el } = serverHtml(ui)
    const states = [...el.querySelectorAll('p')].map((p) => p.getAttribute('data-state'))
    expect(states).toEqual(['visible', 'visible'])
    expect(hydrate(ui).errors).toEqual([])
  })

  it('odometer sends the final digits', () => {
    const ui = <Odometer value={1234} locale="en-US" />
    const { el } = serverHtml(ui)
    expect(el.querySelector('.sr-only')?.textContent).toBe('1,234')
    // The number once, not the strips from 0 to 9: the digits are generated content.
    expect(el.textContent).toBe('1,234')
    const digits = [...el.querySelectorAll<HTMLElement>('[data-slot=odometer-digit] > .invisible')]
      .map((d) => d.dataset.char)
      .join('')
    expect(digits).toBe('1234')
    const strips = [...el.querySelectorAll<HTMLElement>('[data-slot=odometer-strip]')]
    expect(strips.map((s) => s.style.transform)).toEqual([
      'translateY(-10%)',
      'translateY(-20%)',
      'translateY(-30%)',
      'translateY(-40%)',
    ])
    expect(hydrate(ui).errors).toEqual([])
  })

  it('number ticker sends the final number, not its starting point', () => {
    const ui = <NumberTicker value={1234} locale="en-US" />
    const { el } = serverHtml(ui)
    expect(text(el, 'number-ticker-value')).toBe('1,234')
    expect(el.querySelector('.sr-only')?.textContent).toBe('1,234')
    const { errors, host } = hydrate(ui)
    expect(errors).toEqual([])
    // Armed after hydration: back to the start, with the final value holding the width.
    expect(text(host, 'number-ticker-value')).toBe('0')
    const sizer = host.querySelector<HTMLElement>('[data-slot=number-ticker-sizer]')
    expect(sizer?.dataset.value).toBe('1,234')
    expect(sizer?.textContent).toBe('')
  })

  it('number ticker shows the number as written with format false', () => {
    const ui = <NumberTicker value={1500} locale="es-AR" format={false} />
    const { el } = serverHtml(ui)
    expect(text(el, 'number-ticker-value')).toBe('1500')
    expect(el.querySelector('.sr-only')?.textContent).toBe('1500')
    expect(
      serverHtml(<NumberTicker value={2.5} format={false} decimals={2} />).el.querySelector(
        '.sr-only',
      )?.textContent,
    ).toBe('2.50')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('keeps what the reader already sees when the page hydrates on screen', () => {
    onScreen()
    const { errors, host } = hydrate(
      <div>
        <Typewriter words="Hello" />
        <TextGenerate text="Hi there" />
        <Reveal>
          <p>Shown</p>
        </Reveal>
        <NumberTicker value={42} locale="en-US" />
      </div>,
    )
    expect(errors).toEqual([])
    expect(text(host, 'typewriter-text')).toBe('Hello')
    expect(host.querySelector('[data-slot=text-generate] .opacity-0')).toBeNull()
    expect(host.querySelector('[data-slot=reveal]')?.getAttribute('data-state')).toBe('visible')
    expect(text(host, 'number-ticker-value')).toBe('42')
  })
})

describe('server rendering of the scroll pieces', () => {
  it('text reveal sends every word at full opacity until something drives it', () => {
    const ui = <TextReveal text="Words light up" />
    const { el } = serverHtml(ui)
    expect(el.textContent).toBe('Words light up')
    const word = el.querySelector<HTMLElement>('[data-slot=text-reveal-word]')
    expect(word?.style.opacity).toContain('var(--text-reveal-progress, 1)')
    expect(word?.className).toContain('[animation-name:text-reveal-word]')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('timeline renders as a server component, lit until CSS drives it', () => {
    const ui = (
      <Timeline>
        <TimelineItem title="Launch">Body</TimelineItem>
      </Timeline>
    )
    const { el } = serverHtml(ui)
    expect(el.querySelector('[data-slot=timeline-progress]')?.className).toContain('h-full')
    expect(el.querySelector('[data-slot=timeline-dot]')?.className).toContain(
      'bg-(--timeline-color)',
    )
    expect(hydrate(ui).errors).toEqual([])
  })

  it('velocity marquee hydrates in both drivers', () => {
    for (const driver of ['js', 'css'] as const) {
      const ui = (
        <VelocityMarquee driver={driver}>
          <span>Row</span>
        </VelocityMarquee>
      )
      expect(serverHtml(ui).el.textContent).toContain('Row')
      expect(hydrate(ui).errors).toEqual([])
      act(() => root?.unmount())
      root = undefined
    }
  })
})

describe('meteors', () => {
  it('writes positions with two decimals, so a slightly different Math.sin agrees', () => {
    const ui = <Meteors count={20} />
    const { html, el } = serverHtml(ui)
    expect(el.querySelectorAll('[data-slot=meteor]')).toHaveLength(20)
    // The raw markup, not the parsed style, which would normalize the numbers.
    const positions = [...html.matchAll(/(?:top|left):([^;"]+)/g)].map((m) => m[1])
    expect(positions).toHaveLength(40)
    for (const value of positions) expect(value).toMatch(/^-?\d+\.\d{2}%$/)
    // Node and Chrome disagree on Math.sin in the last bits for some inputs (meteor 8 did).
    const sin = Math.sin
    vi.spyOn(Math, 'sin').mockImplementation((x) => sin(x) * (1 + 1e-15))
    expect(renderToString(ui)).toBe(html)
    vi.restoreAllMocks()
    expect(hydrate(ui).errors).toEqual([])
  })
})

describe('Phase 4 map and mockup components SSR and hydration', () => {
  it('renders Globe on server and hydrates cleanly', () => {
    const ui = <Globe aria-label="Globe preview" />
    const { el } = serverHtml(ui)
    expect(el.querySelector('canvas')).toBeTruthy()
    expect(hydrate(ui).errors).toEqual([])
  })

  it('renders DottedMap on server with stable SVG path', () => {
    const ui = <DottedMap step={10} aria-label="World" />
    const { html, el } = serverHtml(ui)
    expect(el.querySelector('path')).toBeTruthy()
    expect(renderToString(ui)).toBe(html)
    expect(hydrate(ui).errors).toEqual([])
  })

  it('renders TweetCard on server without mismatch', () => {
    const ui = (
      <TweetCard
        author={{ name: 'Jane', handle: 'jane', avatar: '/avatar.jpg' }}
        text="Hello world"
        createdAt="2026-10-07T00:00:00Z"
      />
    )
    const { el } = serverHtml(ui)
    expect(el.textContent).toContain('Hello world')
    expect(hydrate(ui).errors).toEqual([])
  })

  it('renders OgPreview on server for all variants', () => {
    for (const variant of ['x', 'slack', 'discord', 'imessage', 'linkedin'] as const) {
      const ui = <OgPreview url="https://example.com" title="Example Site" variant={variant} />
      const { el } = serverHtml(ui)
      expect(el.textContent).toContain('Example Site')
      expect(hydrate(ui).errors).toEqual([])
      act(() => root?.unmount())
      root = undefined
    }
  })

  it('renders CodeComparison on server in split and unified modes', () => {
    for (const mode of ['split', 'unified'] as const) {
      const ui = <CodeComparison before="a = 1" after="a = 2" mode={mode} />
      const { el } = serverHtml(ui)
      expect(el.querySelector('table')).toBeTruthy()
      expect(hydrate(ui).errors).toEqual([])
      act(() => root?.unmount())
      root = undefined
    }
  })

  it('renders device mockups on server and hydrates cleanly', () => {
    const ui = (
      <div>
        <IPhone src="/iphone.jpg" alt="iphone" />
        <Android src="/android.jpg" alt="android" />
        <IPad src="/ipad.jpg" alt="ipad" />
        <MacBook src="/macbook.jpg" alt="macbook" />
        <Safari src="/safari.jpg" alt="safari" />
      </div>
    )
    const { el } = serverHtml(ui)
    expect(el.querySelectorAll('img')).toHaveLength(5)
    expect(hydrate(ui).errors).toEqual([])
  })
})
