'use client'

import * as React from 'react'

/**
 * What moves a scroll-linked component. `css` uses CSS scroll-driven animations
 * (`animation-timeline: view()`), which run without JavaScript. `js` measures the scroll with
 * the small observer below. `auto` takes CSS where the browser has it and the timeline can
 * follow the right scroller, and JavaScript everywhere else.
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
      same(timelineScroller(el), scrollParent(el))
    setMode(css ? 'css' : 'js')
  }, [ref, driver, container, supported])
  return mode
}

/** A point on the element or the viewport: a named edge, a fraction from 0 to 1, or pixels. */
export type Edge = 'start' | 'center' | 'end' | number | `${number}px`
/** "<element edge> <viewport edge>": `'start end'` is the element's top at the viewport's bottom. */
export type OffsetEntry = `${Edge} ${Edge}` | [Edge, Edge]
/** Where the progress is 0 and where it is 1. */
export type Offset = [OffsetEntry, OffsetEntry]

const edgeFractions: Record<string, number> = { start: 0, center: 0.5, end: 1 }

function parseEdge(s: string): Edge {
  if (s in edgeFractions) return s as Edge
  if (s.endsWith('px')) return s as `${number}px`
  const n = Number.parseFloat(s)
  return Number.isNaN(n) ? 'start' : n
}

function edges(entry: OffsetEntry): [Edge, Edge] {
  if (Array.isArray(entry)) return entry
  const [a = 'start', b = 'end'] = entry.split(/\s+/)
  return [parseEdge(a), parseEdge(b)]
}

function edgePx(edge: Edge, size: number): number {
  if (typeof edge === 'number') return edge * size
  const named = edgeFractions[edge]
  if (named !== undefined) return named * size
  const px = Number.parseFloat(edge)
  return Number.isNaN(px) ? 0 : px
}

/**
 * The nearest ancestor that actually scrolls vertically, or `null` when that is the page. A box
 * with `overflow: auto` that fits its content does not count: it never moves.
 */
export function scrollParent(target: Element): HTMLElement | null {
  if (typeof getComputedStyle !== 'function') return null
  for (let el = target.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') continue
    if (el.scrollHeight > el.clientHeight) return el
  }
  return null
}

/** How far `target` is through `offset`, 0 to 1, against `container` or the window. */
function progressOf(target: Element, offset: Offset, container: HTMLElement | null): number {
  const rect = target.getBoundingClientRect()
  const position = container ? rect.top - container.getBoundingClientRect().top : rect.top
  const viewport = container ? container.clientHeight : window.innerHeight
  const [e0, v0] = edges(offset[0])
  const [e1, v1] = edges(offset[1])
  // How far the element edge sits below the viewport edge, at each end.
  const d0 = position + edgePx(e0, rect.height) - edgePx(v0, viewport)
  const d1 = position + edgePx(e1, rect.height) - edgePx(v1, viewport)
  if (d0 === d1) return d0 <= 0 ? 1 : 0
  const p = d0 / (d0 - d1)
  return p <= 0 ? 0 : p > 1 ? 1 : p
}

/**
 * The JavaScript driver: calls `callback` with the progress of `target` through `offset` right
 * away, then at most once a frame while it changes on scroll or resize. Left out, `container` is
 * the nearest ancestor that scrolls, looked up again when sizes change; `null` is the window.
 * Returns a function that stops it.
 */
export function observeScrollProgress(
  target: Element,
  { offset, container: given }: { offset: Offset; container?: HTMLElement | null },
  callback: (progress: number) => void,
): () => void {
  const find = () => (given === undefined ? scrollParent(target) : given)
  let container = find()
  let scroller: EventTarget = container ?? window
  let frame = 0
  let last: number | null = null

  const update = () => {
    frame = 0
    const progress = progressOf(target, offset, container)
    if (progress === last) return
    last = progress
    callback(progress)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  // A panel only starts scrolling once it holds more than it shows, often after images load.
  const resize = () => {
    const next = find()
    if (next !== container) {
      scroller.removeEventListener('scroll', schedule)
      container = next
      scroller = container ?? window
      scroller.addEventListener('scroll', schedule, { passive: true })
    }
    last = null
    schedule()
  }

  update()
  scroller.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  ro?.observe(target)
  if (target.parentElement) ro?.observe(target.parentElement)
  return () => {
    if (frame) cancelAnimationFrame(frame)
    scroller.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    ro?.disconnect()
  }
}

function fraction(edge: Edge | undefined): number | null {
  if (typeof edge === 'number') return edge
  if (edge === undefined) return null
  return edgeFractions[edge] ?? null
}

function split(entry: OffsetEntry): [number | null, number | null] {
  const [a, b] = edges(entry)
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
 * The view timeline that matches an offset, so the CSS and the JavaScript
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
