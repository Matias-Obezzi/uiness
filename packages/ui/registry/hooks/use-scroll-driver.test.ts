import { afterEach, describe, expect, it, vi } from 'vitest'
import { observeScrollProgress, scrollParent, viewTimelineFor } from './use-scroll-driver'

/** An element whose top sits `top()` pixels down the viewport, `height` tall. */
function placed(height: number, top: () => number) {
  const el = document.createElement('div')
  document.body.append(el)
  vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, top(), 100, height))
  return el
}

describe('observeScrollProgress', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('reports the progress through the offset against the window, and follows the scroll', () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    // Frames run at once. The id is 0, so the frame never looks pending after it has run.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    let top = 1000
    const el = placed(200, () => top)
    const seen: number[] = []
    // From its top at the bottom of the screen to its bottom at the top: 1200px of travel.
    const stop = observeScrollProgress(el, { offset: ['start end', 'end start'] }, (p) =>
      seen.push(p),
    )
    top = 400
    window.dispatchEvent(new Event('scroll'))
    top = -500
    window.dispatchEvent(new Event('scroll'))
    stop()
    top = 0
    window.dispatchEvent(new Event('scroll'))
    expect(seen).toEqual([0, 0.5, 1])
  })

  it('reads fractions and pixel edges', () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    const el = placed(400, () => 500)
    const seen: number[] = []
    observeScrollProgress(el, { offset: ['start 0.75', '100px 0.25'] }, (p) => seen.push(p))()
    // Starts at top 750, ends at top 150: at 500 it is 250 of 600 along.
    expect(seen[0]).toBeCloseTo(250 / 600)
  })
})

describe('scrollParent', () => {
  it('skips boxes that declare a scroll but have nowhere to go', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    const el = document.createElement('div')
    outer.style.overflowY = 'auto'
    inner.style.overflowY = 'auto'
    outer.append(inner)
    inner.append(el)
    document.body.append(outer)
    Object.defineProperty(outer, 'scrollHeight', { value: 900 })
    Object.defineProperty(outer, 'clientHeight', { value: 300 })
    expect(scrollParent(el)).toBe(outer)
    outer.remove()
  })
})

describe('viewTimelineFor', () => {
  it('maps an offset to a view timeline, and gives up on pixels', () => {
    expect(viewTimelineFor(['start 0.6', 'end 0.6'])).toEqual({
      inset: '60% 40%',
      start: 0,
      end: 100,
    })
    expect(viewTimelineFor(['start end', '100px start'])).toBeNull()
  })
})
