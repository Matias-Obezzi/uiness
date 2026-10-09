import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { choreograph } from './choreograph'
import { framesFor } from './effects'
import { Choreo } from './react'
import { scan } from './scan'
import type { Choreography, ChoreoOptions } from './types'

interface Fake {
  target: Element
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  delay: number
  endDelay: number
  playState: 'paused' | 'running' | 'idle'
  reversed: boolean
  finish(): void
}

let animations: Fake[] = []
let observed: Element[] = []
let report: (targets: Element[]) => void = () => {}
const running: Choreography[] = []

const page = (html: string) => {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

const start = (options: ChoreoOptions) => {
  const choreo = choreograph({ observe: false, ...options })
  running.push(choreo)
  return choreo
}

const settle = async () => {
  for (const a of animations) a.finish()
  for (let i = 0; i < 4; i++) await Promise.resolve()
}

beforeEach(() => {
  animations = []
  observed = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        report = (targets) =>
          callback(
            targets.map((target) => ({
              target,
              isIntersecting: true,
              intersectionRatio: 1,
              intersectionRect: { height: 100 },
              rootBounds: { height: 800 },
            })) as unknown as IntersectionObserverEntry[],
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
      target: this,
      keyframes,
      options,
      delay: 0,
      endDelay: 0,
      playState: 'running' as Fake['playState'],
      reversed: false,
      finished,
      effect: {
        updateTiming: (t: { delay?: number; endDelay?: number }) => {
          if (t.delay !== undefined) animation.delay = t.delay
          if (t.endDelay !== undefined) animation.endDelay = t.endDelay
        },
      },
      pause() {
        animation.playState = 'paused'
      },
      play() {
        animation.playState = 'running'
      },
      reverse() {
        animation.reversed = true
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
  for (const choreo of running.splice(0)) choreo.stop()
  document.body.innerHTML = ''
  delete (HTMLElement.prototype as { animate?: unknown }).animate
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('words', () => {
  it('brings a line in word by word and puts the same text node back', async () => {
    const root = page('<h2 data-choreo="words">Hello big world</h2>')
    const heading = root.firstElementChild as HTMLElement
    const text = heading.firstChild
    start({ root, stagger: 60 })
    // Waiting whole: nothing is split until it plays.
    expect(heading.children).toHaveLength(0)

    report([heading])
    const words = Array.from(heading.children) as HTMLElement[]
    expect(words.map((w) => w.textContent)).toEqual(['Hello', 'big', 'world'])
    expect(heading.textContent).toBe('Hello big world')
    const delays = words.map((w) => animations.find((a) => a.target === w)?.delay)
    expect(delays).toEqual([0, 30, 60])

    await settle()
    expect(heading.children).toHaveLength(0)
    expect(heading.firstChild).toBe(text)
  })

  it('puts the text back when stopped halfway', () => {
    const root = page('<p data-choreo="words">One <em>two</em> three</p>')
    const before = root.innerHTML
    const choreo = start({ root })
    report([root.firstElementChild as Element])
    expect(root.querySelectorAll('span')).toHaveLength(3)
    choreo.stop()
    expect(root.innerHTML).toBe(before)
  })
})

describe('rotate and flip', () => {
  it('are effects the markup can ask for', () => {
    const root = page(
      '<div data-choreo="rotate"><b>a</b></div><div data-choreo="flip"><b>b</b></div>',
    )
    expect(scan(root).map((p) => p.effect)).toEqual(['rotate', 'flip'])
    const options = { distance: 20, opacity: 1, fadeOnly: false }
    expect(framesFor('rotate', options).added?.[0]?.transform).toContain('rotate(')
    expect(framesFor('flip', options).added?.[0]?.transform).toContain('rotateX(')
  })
})

describe('scrub', () => {
  it('hands each entrance to the scroll instead of waiting to be seen', () => {
    const subjects: Element[] = []
    vi.stubGlobal(
      'ViewTimeline',
      class {
        constructor({ subject }: { subject: Element }) {
          subjects.push(subject)
        }
      },
    )
    const root = page('<p>Scroll me</p>')
    start({ root, scrub: true })
    expect(subjects).toEqual([root.firstElementChild])
    expect(observed).toHaveLength(0)
    expect(animations.every((a) => a.options.timeline && a.playState === 'running')).toBe(true)
  })

  it('plays on its own without scroll driven animations', () => {
    const root = page('<p>Scroll me</p>')
    start({ root, scrub: true })
    expect(observed).toHaveLength(1)
    expect(animations.every((a) => a.playState === 'paused')).toBe(true)
  })
})

describe('leave', () => {
  it('plays what is on screen out, in order, and keeps it hidden', async () => {
    const root = page('<p>Top</p><p>Middle</p><p>Below</p>')
    const [top, middle, below] = Array.from(root.children) as HTMLElement[]
    const boxes = new Map([
      [top, 0],
      [middle, 100],
      [below, 5000],
    ])
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const y = boxes.get(this) ?? 0
      return { top: y, bottom: y + 50, left: 0, right: 100 } as DOMRect
    })
    const choreo = start({ root, stagger: 80 })
    report([top as Element, middle as Element])
    await settle()
    animations = []

    let left = false
    const done = choreo.leave().then(() => {
      left = true
    })
    expect(new Set(animations.map((a) => a.target))).toEqual(new Set([top, middle]))
    expect(animations.every((a) => a.reversed)).toBe(true)
    expect([...new Set(animations.map((a) => a.endDelay))]).toEqual([0, 40])
    expect(left).toBe(false)

    await settle()
    await done
    expect(left).toBe(true)
    const held = animations.filter((a) => a.playState === 'paused')
    expect(new Set(held.map((a) => a.target))).toEqual(new Set([top, middle]))
  })
})

describe('onEnter', () => {
  it('reports each element as it comes in, from the component too', () => {
    const onEnter = vi.fn()
    const { container } = render(
      <Choreo onEnter={onEnter} observe={false}>
        <h2>Hello</h2>
      </Choreo>,
    )
    const heading = container.querySelector('h2') as Element
    expect(onEnter).not.toHaveBeenCalled()
    report([heading])
    expect(onEnter).toHaveBeenCalledWith(
      expect.objectContaining({ element: heading, role: 'heading' }),
    )
  })
})
