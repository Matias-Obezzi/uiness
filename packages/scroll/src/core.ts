/**
 * Scroll progress of an element through a viewport, framework agnostic.
 *
 * An offset pair describes when progress is 0 and when it is 1. Each entry is
 * "<element edge> <viewport edge>": `'start end'` means the top of the element meets the
 * bottom of the viewport, `'end start'` means the bottom of the element meets the top.
 * Edges are `start`, `center`, `end`, a number from 0 to 1, or a pixel string.
 */

export type Edge = 'start' | 'center' | 'end' | number | `${number}px`
export type OffsetEntry = `${Edge} ${Edge}` | [Edge, Edge]
export type Offset = [OffsetEntry, OffsetEntry]

export interface ProgressOptions {
  /** When progress is 0 and when it is 1. Default `['start end', 'end start']`. */
  offset?: Offset
  /** Scroll axis. Default `y`. */
  axis?: 'x' | 'y'
  /** Scrolling ancestor. Default the window. */
  container?: HTMLElement | null
  /** Keep the value between 0 and 1. Default true. */
  clamp?: boolean
}

export interface ProgressInfo {
  /** 0 to 1 unless `clamp` is off. */
  progress: number
  /** Element size along the axis. */
  size: number
  /** Viewport size along the axis. */
  viewport: number
  /** Element start relative to the viewport start, in pixels. */
  position: number
}

const edgeNames: Record<string, number> = { start: 0, center: 0.5, end: 1 }

/** Resolve an edge to pixels for an extent of `size` pixels. */
function edgePx(edge: Edge, size: number): number {
  if (typeof edge === 'number') return edge * size
  const named = edgeNames[edge]
  if (named !== undefined) return named * size
  const px = Number.parseFloat(edge)
  return Number.isNaN(px) ? 0 : px
}

function splitEntry(entry: OffsetEntry): [Edge, Edge] {
  if (Array.isArray(entry)) return entry
  const [a = 'start', b = 'end'] = entry.split(/\s+/)
  const parse = (s: string): Edge => {
    if (s in edgeNames) return s as Edge
    if (s.endsWith('px')) return s as `${number}px`
    const n = Number.parseFloat(s)
    return Number.isNaN(n) ? 'start' : n
  }
  return [parse(a), parse(b)]
}

/** Also turns -0 into 0, so equality checks and string output stay clean. */
export const clamp01 = (n: number) => (n <= 0 ? 0 : n > 1 ? 1 : n)
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map `value` from one range to another, clamped to the output by default. */
export function mapRange(
  value: number,
  from: [number, number],
  to: [number, number],
  shouldClamp = true,
): number {
  const [a, b] = from
  const [c, d] = to
  const t = b === a ? 0 : (value - a) / (b - a)
  const out = c + (d - c) * t
  if (!shouldClamp) return out
  const lo = Math.min(c, d)
  const hi = Math.max(c, d)
  return clamp(out, lo, hi)
}

interface Geometry {
  position: number
  size: number
  viewport: number
}

function measure(target: Element, axis: 'x' | 'y', container?: HTMLElement | null): Geometry {
  const rect = target.getBoundingClientRect()
  if (container) {
    const c = container.getBoundingClientRect()
    return axis === 'y'
      ? { position: rect.top - c.top, size: rect.height, viewport: container.clientHeight }
      : { position: rect.left - c.left, size: rect.width, viewport: container.clientWidth }
  }
  return axis === 'y'
    ? { position: rect.top, size: rect.height, viewport: window.innerHeight }
    : { position: rect.left, size: rect.width, viewport: window.innerWidth }
}

/** Progress from raw geometry. Exposed for tests and for custom scrollers. */
export function progressFrom(
  geometry: Geometry,
  offset: Offset = ['start end', 'end start'],
  shouldClamp = true,
): number {
  const [e0, v0] = splitEntry(offset[0])
  const [e1, v1] = splitEntry(offset[1])
  const { position, size, viewport } = geometry
  // How far the element edge sits below the viewport edge for each pair.
  const d0 = position + edgePx(e0, size) - edgePx(v0, viewport)
  const d1 = position + edgePx(e1, size) - edgePx(v1, viewport)
  const span = d0 - d1
  if (span === 0) return d0 <= 0 ? 1 : 0
  const p = d0 / span
  return shouldClamp ? clamp01(p) : p === 0 ? 0 : p
}

/** Read the progress once. */
export function scrollProgress(target: Element, options: ProgressOptions = {}): ProgressInfo {
  const { offset, axis = 'y', container, clamp: shouldClamp = true } = options
  const geometry = measure(target, axis, container)
  return { progress: progressFrom(geometry, offset, shouldClamp), ...geometry }
}

/**
 * Follow the progress of an element. The callback runs once right away, then at most once
 * per frame while the page scrolls or resizes. Returns a function that stops it.
 */
export function observeScrollProgress(
  target: Element,
  options: ProgressOptions,
  callback: (info: ProgressInfo) => void,
): () => void {
  const scroller: EventTarget = options.container ?? window
  let frame = 0
  let last: number | null = null

  const update = () => {
    frame = 0
    const info = scrollProgress(target, options)
    if (info.progress === last && last !== null) return
    last = info.progress
    callback(info)
  }
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(update)
  }

  update()
  scroller.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          last = null
          schedule()
        })
      : null
  ro?.observe(target)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    scroller.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    ro?.disconnect()
  }
}

/**
 * Which of several elements is closest to a line across the viewport, at `anchor`
 * (0 top, 1 bottom, default 0.5). Returns -1 when the list is empty.
 */
export function activeIndexAt(
  elements: ArrayLike<Element>,
  anchor = 0.5,
  container?: HTMLElement | null,
): number {
  if (elements.length === 0) return -1
  const line = container
    ? container.getBoundingClientRect().top + container.clientHeight * anchor
    : window.innerHeight * anchor
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    // Zero while the line is inside the element, else the distance to the nearest edge.
    const distance = line < rect.top ? rect.top - line : line > rect.bottom ? line - rect.bottom : 0
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}
