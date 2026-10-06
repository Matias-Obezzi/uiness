'use client'

import { type Edge, type Offset, type OffsetEntry, scrollParent } from '@uiness/scroll'
import * as React from 'react'

/**
 * What moves a scroll-linked component. `css` uses CSS scroll-driven animations
 * (`animation-timeline: view()`), which run without JavaScript. `js` measures the scroll with
 * `@uiness/scroll`. `auto` takes CSS where the browser has it and the timeline can follow the
 * right scroller, and JavaScript everywhere else.
 */
export type ScrollDriver = 'auto' | 'css' | 'js'

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Whether the browser runs CSS scroll-driven animations. */
export function supportsScrollTimeline(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()')
  )
}

const isPage = (el: Element | null) =>
  !el || el === document.documentElement || el === document.body

/**
 * The scroller a CSS `view()` timeline follows: the nearest ancestor that is a scroll container,
 * which includes `overflow: hidden` boxes that never scroll. `null` for the page.
 */
function timelineScroller(el: Element): Element | null {
  for (let node = el.parentElement; node && !isPage(node); node = node.parentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(node)
    if (/auto|scroll|hidden|overlay/.test(`${overflow} ${overflowX} ${overflowY}`)) return node
  }
  return null
}

/**
 * Which driver actually runs. The server and the first client render say `css` (unless `js` was
 * asked for), so the markup carries the scroll-driven styles and works with JavaScript off. After
 * mount, `auto` falls back to `js` when the browser lacks scroll timelines, when a `container` was
 * named, when `supported` is false, or when an `overflow: hidden` ancestor would catch the CSS
 * timeline and freeze it.
 */
export function useScrollDriver(
  ref: React.RefObject<Element | null>,
  driver: ScrollDriver = 'auto',
  { container, supported = true }: { container?: HTMLElement | null; supported?: boolean } = {},
): 'css' | 'js' {
  const [mode, setMode] = React.useState<'css' | 'js'>(driver === 'js' ? 'js' : 'css')
  useIsoLayoutEffect(() => {
    if (driver !== 'auto') {
      setMode(driver)
      return
    }
    const el = ref.current
    const same = (a: Element | null, b: Element | null) => (isPage(a) ? isPage(b) : a === b)
    const css =
      !!el &&
      supported &&
      container === undefined &&
      supportsScrollTimeline() &&
      same(timelineScroller(el), scrollParent(el, 'y'))
    setMode(css ? 'css' : 'js')
  }, [ref, driver, container, supported])
  return mode
}

const edgeFractions: Record<string, number> = { start: 0, center: 0.5, end: 1 }

function fraction(edge: Edge | undefined): number | null {
  if (typeof edge === 'number') return edge
  if (edge === undefined) return null
  return edgeFractions[edge] ?? null
}

function split(entry: OffsetEntry): [number | null, number | null] {
  const [a, b] = Array.isArray(entry)
    ? entry
    : entry.split(/\s+/).map((s): Edge => (s in edgeFractions ? (s as Edge) : Number(s)))
  return [fraction(a), fraction(b)]
}

export interface ViewTimelineRange {
  /** For `view-timeline-inset`: how much of the viewport to cut from the top and the bottom. */
  inset: string
  /** Where the progress starts and ends on the `cover` range, in percent. */
  start: number
  end: number
}

const pct = (n: number) => `${Number((n * 100).toFixed(4))}%`

/**
 * The view timeline that matches an `@uiness/scroll` offset, so the CSS and the JavaScript
 * drivers start and end at the same scroll positions. Pixel edges, and offsets whose entries
 * name the same element edge, have no match and give `null`.
 */
export function viewTimelineFor(offset: Offset): ViewTimelineRange | null {
  const [e0, v0] = split(offset[0])
  const [e1, v1] = split(offset[1])
  if (e0 === null || v0 === null || e1 === null || v1 === null || e0 === e1) return null
  if (Number.isNaN(e0 + v0 + e1 + v1)) return null
  // Shrink the viewport with insets until its `cover` range lines up with both entries.
  const size = (v0 - v1) / (e1 - e0)
  if (size < 0) return null
  const bottom = 1 - v0 - e0 * size
  const top = 1 - bottom - size
  return { inset: `${pct(top)} ${pct(bottom)}`, start: e0 * 100, end: e1 * 100 }
}
