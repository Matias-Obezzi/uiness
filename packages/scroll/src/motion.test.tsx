import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { activeIndexAt } from './core'
import { useParallax } from './hooks'
import {
  isStuck,
  lockScroll,
  observeScrollDirection,
  observeScrollVelocity,
  scrollEdges,
  scrollToElement,
  wheelToHorizontal,
} from './motion'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const scroller = () => {
  const el = document.createElement('div')
  document.body.append(el)
  const scrollTo = (top: number) => {
    el.scrollTop = top
    el.dispatchEvent(new Event('scroll'))
  }
  return { el, scrollTo }
}

describe('observeScrollDirection', () => {
  it('reports down and up, ignoring jitter under the threshold', () => {
    const { el, scrollTo } = scroller()
    const seen: string[] = []
    const stop = observeScrollDirection((d) => seen.push(d), { container: el, threshold: 10 })
    scrollTo(5)
    expect(seen).toEqual([])
    scrollTo(40)
    scrollTo(80)
    // A small step back is jitter.
    scrollTo(74)
    scrollTo(120)
    // Ten pixels back from the furthest point turns it around.
    scrollTo(110)
    expect(seen).toEqual(['down', 'up'])
    stop()
    scrollTo(500)
    expect(seen).toEqual(['down', 'up'])
  })
})

describe('observeScrollVelocity', () => {
  it('measures pixels per second while moving and settles to zero', () => {
    vi.useFakeTimers()
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { el, scrollTo } = scroller()
    const seen: number[] = []
    observeScrollVelocity((v) => seen.push(v), { container: el })
    now += 50
    scrollTo(100)
    for (const cb of frames.splice(0)) cb(now)
    expect(seen.at(-1)).toBe(2000)
    vi.advanceTimersByTime(200)
    expect(seen.at(-1)).toBe(0)
  })
})

describe('scrollToElement', () => {
  const setup = (top: number) => {
    const { el } = scroller()
    el.scrollTop = 100
    const calls: number[] = []
    el.scrollTo = ((options: ScrollToOptions) => {
      calls.push(options.top as number)
      el.scrollTop = options.top as number
    }) as typeof el.scrollTo
    const target = document.createElement('section')
    el.append(target)
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top, left: 0 } as DOMRect)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0 } as DOMRect)
    return { el, target, calls }
  }

  it('jumps straight there, short of the offset, with reduced motion', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }))
    const { el, target, calls } = setup(400)
    await scrollToElement(target, { container: el, offset: 64 })
    expect(calls).toEqual([436])
  })

  it('eases over the duration and resolves on arrival', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { el, target, calls } = setup(300)
    const done = scrollToElement(target, { container: el, duration: 100, easing: (t) => t })
    for (const t of [50, 100]) {
      now = t
      for (const cb of frames.splice(0)) cb(now)
    }
    await done
    expect(calls).toEqual([250, 400])
  })

  it('stops when the reader scrolls', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const { el, target, calls } = setup(300)
    const done = scrollToElement(target, { container: el })
    window.dispatchEvent(new Event('wheel'))
    await done
    expect(calls).toEqual([])
  })
})

describe('lockScroll', () => {
  it('locks once for nested callers and keeps the scrollbar room', () => {
    const root = document.documentElement
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15)
    const a = lockScroll()
    const b = lockScroll()
    expect(root.style.overflow).toBe('hidden')
    expect(root.style.paddingRight).toBe('15px')
    a()
    a()
    expect(root.style.overflow).toBe('hidden')
    b()
    expect(root.style.overflow).toBe('')
    expect(root.style.paddingRight).toBe('')
  })
})

describe('isStuck', () => {
  it('is true pinned at its offset after scrolling, not resting there at the start', () => {
    const { el } = scroller()
    vi.spyOn(el, 'scrollHeight', 'get').mockReturnValue(1000)
    vi.spyOn(el, 'clientHeight', 'get').mockReturnValue(200)
    el.style.overflowY = 'auto'
    const header = document.createElement('header')
    header.style.position = 'sticky'
    header.style.top = '8px'
    el.append(header)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0 } as DOMRect)
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ top: 8, left: 0 } as DOMRect)
    el.scrollTop = 0
    expect(isStuck(header)).toBe(false)
    el.scrollTop = 300
    expect(isStuck(header)).toBe(true)
    // A bordered box: sticky offsets count from inside the border.
    vi.spyOn(el, 'clientTop', 'get').mockReturnValue(1)
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ top: 9, left: 0 } as DOMRect)
    expect(isStuck(header)).toBe(true)
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ top: 8, left: 0 } as DOMRect)
    vi.spyOn(el, 'clientTop', 'get').mockReturnValue(0)
    // Slid out of view with a translate, it is still pinned.
    header.style.translate = '0px -40px'
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ top: -32, left: 0 } as DOMRect)
    expect(isStuck(header)).toBe(true)
  })
})

describe('useParallax', () => {
  it('leaves the element in place with reduced motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }))
    function Layer() {
      const ref = useRef<HTMLDivElement>(null)
      useParallax(ref, { speed: 0.5 })
      return <div ref={ref} data-testid="layer" />
    }
    const { getByTestId } = render(<Layer />)
    window.dispatchEvent(new Event('scroll'))
    expect(getByTestId('layer').style.translate).toBe('')
  })
})

describe('horizontal', () => {
  const row = (scrollWidth = 1000, clientWidth = 300) => {
    const el = document.createElement('div')
    document.body.append(el)
    vi.spyOn(el, 'scrollWidth', 'get').mockReturnValue(scrollWidth)
    vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(clientWidth)
    return el
  }

  it('names directions left and right on the x axis', () => {
    const el = row()
    const seen: string[] = []
    observeScrollDirection((d) => seen.push(d), { container: el, axis: 'x', threshold: 5 })
    el.scrollLeft = 50
    el.dispatchEvent(new Event('scroll'))
    el.scrollLeft = 20
    el.dispatchEvent(new Event('scroll'))
    expect(seen).toEqual(['right', 'left'])
  })

  it('picks the card under a line running top to bottom', () => {
    const cards = [0, 1, 2].map((i) => {
      const card = document.createElement('div')
      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
        left: i * 200,
        right: i * 200 + 180,
        top: 0,
        bottom: 100,
      } as DOMRect)
      return card
    })
    const el = row(600, 400)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0 } as DOMRect)
    // The middle of a 400 px wide row is x = 200: the second card.
    expect(activeIndexAt(cards, 0.5, el, 'x')).toBe(1)
    expect(activeIndexAt(cards, 0, el, 'x')).toBe(0)
  })

  it('tells the start and the end of a row', () => {
    const el = row(1000, 300)
    expect(scrollEdges(el)).toEqual({ atStart: true, atEnd: false })
    el.scrollLeft = 350
    expect(scrollEdges(el)).toEqual({ atStart: false, atEnd: false })
    el.scrollLeft = 700
    expect(scrollEdges(el)).toEqual({ atStart: false, atEnd: true })
  })

  it('turns a vertical wheel sideways, and hands it back at the ends', () => {
    const el = row(1000, 300)
    const stop = wheelToHorizontal(el)
    const wheel = (deltaY: number, deltaX = 0) => {
      const event = new WheelEvent('wheel', { deltaY, deltaX, cancelable: true })
      el.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(wheel(100)).toBe(true)
    expect(el.scrollLeft).toBe(100)
    // A trackpad already scrolling sideways is left alone.
    expect(wheel(10, 80)).toBe(false)
    // Back at the start, scrolling up belongs to the page.
    el.scrollLeft = 0
    expect(wheel(-100)).toBe(false)
    stop()
    expect(wheel(100)).toBe(false)
  })
})
