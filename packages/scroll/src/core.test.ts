import { describe, expect, it, vi } from 'vitest'
import {
  activeIndexAt,
  mapRange,
  observeScrollProgress,
  progressFrom,
  scrollProgress,
} from './core'

const geometry = (position: number, size = 400, viewport = 800) => ({ position, size, viewport })

describe('progressFrom', () => {
  it('goes from 0 when the top meets the bottom of the viewport to 1 when the bottom leaves the top', () => {
    // Default offset: ['start end', 'end start'].
    expect(progressFrom(geometry(800))).toBe(0)
    expect(progressFrom(geometry(-400))).toBe(1)
    expect(progressFrom(geometry(200))).toBeCloseTo(0.5)
  })

  it('clamps outside the trip unless told otherwise', () => {
    expect(progressFrom(geometry(1200))).toBe(0)
    expect(progressFrom(geometry(-800))).toBe(1)
    expect(progressFrom(geometry(1200), undefined, false)).toBeLessThan(0)
  })

  it('understands named, numeric and pixel edges', () => {
    // From the element center at the viewport center to its end at the viewport start.
    expect(progressFrom(geometry(200), ['center center', 'end start'])).toBe(0)
    expect(progressFrom(geometry(-400), ['center center', 'end start'])).toBe(1)
    expect(
      progressFrom(geometry(0), [
        [0, 0],
        [1, 0],
      ]),
    ).toBe(0)
    expect(
      progressFrom(geometry(-200), [
        [0, 0],
        [1, 0],
      ]),
    ).toBeCloseTo(0.5)
    expect(progressFrom(geometry(100), ['start 100px', 'start 0px'])).toBe(0)
    expect(progressFrom(geometry(0), ['start 100px', 'start 0px'])).toBe(1)
  })
})

describe('scrollProgress and observeScrollProgress', () => {
  const box = (top: number, height = 400) =>
    ({ top, height, bottom: top + height, left: 0, width: 100, right: 100 }) as DOMRect

  it('measures an element against the window', () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(box(384))
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    const info = scrollProgress(el)
    expect(info.progress).toBeCloseTo((768 - 384) / (768 + 400))
    expect(info.size).toBe(400)
    expect(info.viewport).toBe(768)
  })

  it('reports once right away, then once per frame on scroll, and stops', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
    const el = document.createElement('div')
    const rect = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(box(768))
    const cb = vi.fn()
    const stop = observeScrollProgress(el, {}, cb)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb.mock.calls[0]?.[0].progress).toBe(0)
    rect.mockReturnValue(box(184))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(32)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb.mock.calls[1]?.[0].progress).toBeCloseTo(0.5)
    stop()
    rect.mockReturnValue(box(-400))
    window.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(32)
    expect(cb).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

describe('activeIndexAt', () => {
  it('picks the section under the anchor line, or the nearest one', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    const make = (top: number, height: number) => {
      const el = document.createElement('section')
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top,
        height,
        bottom: top + height,
      } as DOMRect)
      return el
    }
    const sections = [make(-600, 500), make(0, 300), make(700, 300)]
    expect(activeIndexAt(sections, 0.5)).toBe(1) // line at 500 is between 300 and 700, nearer to the second
    expect(activeIndexAt(sections, 0.8)).toBe(2) // line at 800 is inside the third
    expect(activeIndexAt(sections, 0.1)).toBe(1) // line at 100 is inside the second
    expect(activeIndexAt([], 0.5)).toBe(-1)
  })
})

describe('mapRange', () => {
  it('maps and clamps', () => {
    expect(mapRange(0.5, [0, 1], [0, 100])).toBe(50)
    expect(mapRange(2, [0, 1], [0, 100])).toBe(100)
    expect(mapRange(2, [0, 1], [0, 100], false)).toBe(200)
    expect(mapRange(0.25, [0, 1], [100, 0])).toBe(75)
  })
})
