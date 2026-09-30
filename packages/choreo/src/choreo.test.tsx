import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { choreograph } from './choreograph'
import { formatCount, parseCount } from './counter'
import { Choreo } from './react'
import { scan } from './scan'
import type { Choreography, ChoreoOptions } from './types'

const page = (html: string) => {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

const running: Choreography[] = []
const start = (options: ChoreoOptions) => {
  const choreo = choreograph(options)
  running.push(choreo)
  return choreo
}

afterEach(() => {
  for (const choreo of running.splice(0)) choreo.stop()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('parseCount', () => {
  it.each([
    ['12,500+', 12500, 0, '12,500+'],
    ['$1.2M', 1.2, 1, '$1.2M'],
    ['4.9', 4.9, 1, '4.9'],
    ['99%', 99, 0, '99%'],
    ['1.234,5 €', 1234.5, 1, '1.234,5 €'],
    ['2024', 2024, 0, '2024'],
  ])('reads %s and writes it back the same', (text, value, decimals, back) => {
    const parsed = parseCount(text)
    expect(parsed?.value).toBe(value)
    expect(parsed?.decimals).toBe(decimals)
    if (parsed) expect(formatCount(parsed.value, parsed)).toBe(back)
  })

  it('formats the values in between with the same separators', () => {
    const parsed = parseCount('12,500+')
    if (!parsed) throw new Error('not parsed')
    expect(formatCount(1234.4, parsed)).toBe('1,234+')
  })

  it.each(['24/7', 'hello', '1 and 2', ''])('leaves %j alone', (text) => {
    expect(parseCount(text)).toBeNull()
  })
})

describe('scan', () => {
  it('works out what each element is', () => {
    const root = page(`
      <section>
        <h1>Title</h1>
        <p>Some <strong>text</strong></p>
        <img alt="" src="a.png" />
        <hr />
        <button>Go</button>
        <a href="#">Read more</a>
      </section>
    `)
    const plan = scan(root)
    expect(plan.map((p) => [p.element.localName, p.role, p.effect])).toEqual([
      ['h1', 'heading', 'blur'],
      ['p', 'text', 'up'],
      ['img', 'media', 'zoom'],
      ['hr', 'divider', 'draw'],
      ['button', 'button', 'up'],
      ['a', 'text', 'up'],
    ])
  })

  it('treats repeating siblings as one group and animates each as a unit', () => {
    const root = page(`
      <div style="display: grid">
        <div class="tile"><h3>One</h3><p>a</p></div>
        <div class="tile"><h3>Two</h3><p>b</p></div>
        <div class="tile"><h3>Three</h3><p>c</p></div>
      </div>
    `)
    const plan = scan(root)
    expect(plan).toHaveLength(3)
    expect(plan.every((p) => p.role === 'item' && p.group === plan[0]?.group)).toBe(true)
  })

  it('finds cards by their surface and gives them a hover lift', () => {
    const root = page(`
      <div style="border: 1px solid rgb(0, 0, 0)"><h3>Card</h3><p>Body</p></div>
    `)
    const [card] = scan(root)
    expect(card?.role).toBe('card')
    expect(card?.hover).toBe('lift')
  })

  it('counts big numbers but not small print', () => {
    const root = page(`
      <div style="font-size: 40px">12,500+</div>
      <div style="font-size: 12px">2024</div>
    `)
    const plan = scan(root)
    expect(plan.map((p) => [p.role, p.numbers.length])).toEqual([
      ['number', 1],
      ['text', 0],
    ])
  })

  it('finds figures inside the items of a stats row', () => {
    const root = page(`
      <div style="display: grid">
        <div><span style="font-size: 32px">120+</span><p>teams</p></div>
        <div><span style="font-size: 32px">99.9%</span><p>uptime</p></div>
      </div>
    `)
    const plan = scan(root)
    expect(plan.map((p) => p.numbers.map((n) => n.textContent))).toEqual([['120+'], ['99.9%']])
  })

  it('leaves out pinned, hidden and opted out elements', () => {
    const root = page(`
      <header style="position: fixed"><h1>Nav</h1></header>
      <div data-choreo="off"><h2>Off</h2></div>
      <div hidden><h2>Hidden</h2></div>
      <div aria-hidden="true"><h2>Decoration</h2></div>
      <h2>Kept</h2>
    `)
    expect(scan(root).map((p) => p.element.textContent)).toEqual(['Kept'])
  })

  it('honours an effect and a delay set in the markup', () => {
    const root = page(`<div data-choreo="left" data-choreo-delay="200"><span>x</span></div>`)
    const [item] = scan(root)
    expect(item).toMatchObject({ role: 'custom', effect: 'left', delay: 200 })
  })

  it('slides media in from its own side of a two column row', () => {
    const root = page(`
      <div style="display: flex">
        <img alt="" src="a.png" />
        <p>Copy</p>
      </div>
      <div style="display: flex">
        <p>Copy</p>
        <img alt="" src="b.png" />
      </div>
    `)
    const media = scan(root).filter((p) => p.role === 'media')
    expect(media.map((p) => p.effect)).toEqual(['right', 'left'])
  })

  it('takes effect overrides per role', () => {
    const root = page('<h2>Title</h2>')
    expect(scan(root, { effects: { heading: 'fade' } })[0]?.effect).toBe('fade')
  })
})

interface FakeAnimation {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  delay: number
  playState: 'paused' | 'running' | 'idle'
  finish(): void
}

describe('choreograph', () => {
  let observed: Element[]
  let report: (entries: Partial<IntersectionObserverEntry>[]) => void
  let animations: FakeAnimation[]

  beforeEach(() => {
    observed = []
    animations = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = (entries) =>
            callback(
              entries as IntersectionObserverEntry[],
              this as unknown as IntersectionObserver,
            )
        }
        observe(el: Element) {
          observed.push(el)
        }
        unobserve(el: Element) {
          observed = observed.filter((o) => o !== el)
        }
        disconnect() {
          observed = []
        }
      },
    )
    // jsdom has no Web Animations: record what would have run.
    ;(HTMLElement.prototype as { animate?: unknown }).animate = function (
      this: HTMLElement,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) {
      let resolve: () => void = () => {}
      const finished = new Promise<void>((r) => {
        resolve = r
      })
      const animation = {
        keyframes,
        options,
        delay: 0,
        playState: 'running' as FakeAnimation['playState'],
        finished,
        effect: {
          updateTiming: (t: { delay: number }) => {
            animation.delay = t.delay
          },
        },
        pause() {
          animation.playState = 'paused'
        },
        play() {
          animation.playState = 'running'
        },
        cancel() {
          animation.playState = 'idle'
        },
        finish() {
          resolve()
        },
      }
      animations.push(animation)
      return animation
    }
  })

  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate
  })

  const enter = (...els: Element[]) =>
    report(
      els.map((target) => ({
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        intersectionRect: { height: 100 } as DOMRectReadOnly,
        rootBounds: { height: 800 } as DOMRectReadOnly,
      })),
    )

  it('holds everything on its first frame, then plays what arrives with a cascade', async () => {
    const root = page('<h2>A</h2><p>B</p><p>C</p>')
    const choreo = start({ root, stagger: 50, observe: false })
    expect(choreo.plan).toHaveLength(3)
    expect(observed).toHaveLength(3)
    expect(animations.every((a) => a.playState === 'paused')).toBe(true)

    enter(...root.children)
    const running = animations.filter((a) => a.playState === 'running')
    expect(running.length).toBe(animations.length)
    expect([...new Set(running.map((a) => a.delay))]).toEqual([0, 50, 100])
    expect(observed).toHaveLength(0)

    for (const a of animations) a.finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(animations.every((a) => a.playState === 'idle')).toBe(true)
    choreo.stop()
  })

  it('adds movement on top of the element transform instead of replacing it', () => {
    const root = page('<p>Moves</p>')
    start({ root, observe: false })
    const moving = animations.find((a) => a.keyframes.some((k) => 'transform' in k))
    expect(moving?.options.composite).toBe('add')
    const fading = animations.find((a) => a.keyframes.some((k) => 'opacity' in k))
    expect(fading?.options.composite).toBeUndefined()
  })

  it('shows what is already on screen straight away when intro is off', () => {
    const root = page('<p>Here</p>')
    start({ root, intro: false, observe: false })
    enter(root.children[0] as Element)
    expect(animations.every((a) => a.playState === 'idle')).toBe(true)
  })

  it('marks roles and hover touches, and removes every trace on stop', () => {
    const root = page(
      '<button>Buy</button><div style="border: 1px solid red"><p>x</p><p>y</p></div>',
    )
    const choreo = start({ root, observe: false, debug: true })
    const button = root.querySelector('button')
    expect(button?.getAttribute('data-choreo-role')).toBe('button')
    expect(button?.getAttribute('data-choreo-hover')).toBe('press')
    expect(root.hasAttribute('data-choreo-debug')).toBe(true)
    expect(document.querySelector('[data-choreo-legend]')?.textContent).toContain('button 1')
    expect(document.querySelector('style[data-choreo-style]')).not.toBeNull()

    choreo.stop()
    expect(button?.hasAttribute('data-choreo-role')).toBe(false)
    expect(button?.hasAttribute('data-choreo-hover')).toBe(false)
    expect(root.hasAttribute('data-choreo-debug')).toBe(false)
    expect(document.querySelector('[data-choreo-legend]')).toBeNull()
    expect(document.querySelector('style[data-choreo-style]')).toBeNull()
    expect(animations.every((a) => a.playState === 'idle')).toBe(true)
  })

  it('picks up elements added later', async () => {
    const root = page('<p>First</p>')
    const onPlan = vi.fn()
    const choreo = start({ root, onPlan })
    const added = document.createElement('h2')
    added.textContent = 'Later'
    root.appendChild(added)
    await new Promise((r) => setTimeout(r, 50))
    expect(choreo.plan.map((p) => p.element)).toContain(added)
    expect(observed).toContain(added)
    expect(onPlan).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ element: added })]),
    )
    choreo.stop()
  })

  it('does nothing when reduced motion is asked for', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }))
    const root = page('<p>Still</p>')
    start({ root, observe: false })
    expect(animations).toHaveLength(0)
  })

  it('only fades with reduced motion set to fade', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }))
    const root = page('<p>Soft</p>')
    start({ root, observe: false, reducedMotion: 'fade' })
    expect(animations).toHaveLength(1)
    expect(Object.keys(animations[0]?.keyframes[0] ?? {})).toEqual(['opacity'])
  })

  it('replays everything', () => {
    const root = page('<p>Again</p>')
    const choreo = start({ root, observe: false })
    enter(root.children[0] as Element)
    expect(observed).toHaveLength(0)
    choreo.replay()
    expect(observed).toHaveLength(1)
    expect(animations.filter((a) => a.playState === 'paused').length).toBeGreaterThan(0)
  })

  it('counts a number up and lands on its original text', async () => {
    let now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => {
        now += 400
        cb(now)
      }, 0),
    )
    const root = page('<div style="font-size: 48px">1,500+</div>')
    start({ root, observe: false, duration: 500 })
    const el = root.children[0] as HTMLElement
    enter(el)
    expect(el.textContent).toBe('0+')
    await new Promise((r) => setTimeout(r, 20))
    expect(el.textContent).not.toBe('0+')
    await new Promise((r) => setTimeout(r, 40))
    expect(el.textContent).toBe('1,500+')
  })

  it('is inert without a document root', () => {
    const choreo = start({ root: null })
    expect(choreo.plan).toEqual([])
    expect(() => choreo.stop()).not.toThrow()
  })
})

describe('<Choreo>', () => {
  it('scopes itself to its children and cleans up on unmount', () => {
    const { container, unmount } = render(
      <Choreo debug>
        <h2>Hello</h2>
      </Choreo>,
    )
    const heading = container.querySelector('h2')
    expect(heading?.getAttribute('data-choreo-role')).toBe('heading')
    unmount()
    expect(heading?.hasAttribute('data-choreo-role')).toBe(false)
  })

  it('renders nothing when it animates the whole page', () => {
    const { container } = render(<Choreo />)
    expect(container.innerHTML).toBe('')
  })
})
