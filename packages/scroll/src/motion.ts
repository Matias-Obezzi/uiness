import { type Axis, scrollParent, scrollportStart } from './core'

export interface ScrollSourceOptions {
  /** Scrolling element to watch. Left out, the page. */
  container?: HTMLElement | null
  /** Scroll axis. Default `y`. */
  axis?: Axis
}

const positionOf = (container: HTMLElement | null | undefined, axis: Axis) =>
  container
    ? axis === 'y'
      ? container.scrollTop
      : container.scrollLeft
    : axis === 'y'
      ? window.scrollY
      : window.scrollX

/** Milliseconds without a scroll event after which the velocity is reported as zero. */
const IDLE = 120

/**
 * Follow how fast the page (or `container`) scrolls, in pixels per second, positive towards the
 * end. Reported at most once per frame while it moves, then 0 once it rests. Returns a function
 * that stops it.
 */
export function observeScrollVelocity(
  callback: (velocity: number) => void,
  { container, axis = 'y' }: ScrollSourceOptions = {},
): () => void {
  const target: EventTarget = container ?? window
  let lastPosition = positionOf(container, axis)
  let lastTime = performance.now()
  let frame = 0
  let idle: ReturnType<typeof setTimeout> | null = null

  const measure = () => {
    frame = 0
    const now = performance.now()
    const position = positionOf(container, axis)
    const dt = now - lastTime
    if (dt > 0) callback(((position - lastPosition) / dt) * 1000)
    lastPosition = position
    lastTime = now
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(measure)
    if (idle) clearTimeout(idle)
    idle = setTimeout(() => {
      lastPosition = positionOf(container, axis)
      lastTime = performance.now()
      callback(0)
    }, IDLE)
  }
  target.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    target.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
    if (idle) clearTimeout(idle)
  }
}

/** `down` and `up` on the vertical axis, `right` and `left` on the horizontal one. */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right'

export interface DirectionOptions extends ScrollSourceOptions {
  /** Pixels to travel the other way before the direction flips. Default 8. */
  threshold?: number
}

/**
 * Follow which way the page (or `container`) scrolls: `down` towards the end, `up` back, or
 * `right` and `left` on the horizontal axis.
 * The callback runs only when it changes, after `threshold` pixels the other way, so a
 * trackpad's jitter does not flip a header back and forth. Returns a function that stops it.
 */
export function observeScrollDirection(
  callback: (direction: ScrollDirection) => void,
  { container, axis = 'y', threshold = 8 }: DirectionOptions = {},
): () => void {
  const target: EventTarget = container ?? window
  let anchor = positionOf(container, axis)
  let current: ScrollDirection | null = null
  const onScroll = () => {
    const position = positionOf(container, axis)
    const travelled = position - anchor
    if (Math.abs(travelled) < threshold) {
      // Keep the anchor on the far end of the current direction, so turning around is measured
      // from where it turned.
      if ((current === 'down' && travelled > 0) || (current === 'up' && travelled < 0))
        anchor = position
      return
    }
    anchor = position
    const next: ScrollDirection =
      axis === 'y' ? (travelled > 0 ? 'down' : 'up') : travelled > 0 ? 'right' : 'left'
    if (next !== current) {
      current = next
      callback(next)
    }
  }
  target.addEventListener('scroll', onScroll, { passive: true })
  return () => target.removeEventListener('scroll', onScroll)
}

export interface ScrollToOptions {
  /** Pixels to stop short of the element, for a sticky header. Default 0. */
  offset?: number
  /** Milliseconds the scroll takes. Default 600. */
  duration?: number
  /** Easing from 0 to 1. Default an ease out cubic. */
  easing?: (t: number) => number
  /** Scrolling element. Left out, the nearest one that scrolls, or the page. */
  container?: HTMLElement | null
  axis?: Axis
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll so `target` sits `offset` pixels from the start of the viewport, over `duration` ms,
 * which the browser's `smooth` behaviour does not let you choose. Stops if the reader scrolls
 * themselves (wheel, touch, keys), and jumps straight there with reduced motion. Resolves when
 * it arrives or stops.
 */
export function scrollToElement(target: Element, options: ScrollToOptions = {}): Promise<void> {
  const { offset = 0, duration = 600, easing = easeOutCubic, axis = 'y' } = options
  const container = options.container === undefined ? scrollParent(target, axis) : options.container
  const start = positionOf(container, axis)
  const rect = target.getBoundingClientRect()
  const viewportStart = scrollportStart(container, axis)
  const end = start + (axis === 'y' ? rect.top : rect.left) - viewportStart - offset
  const set = (position: number) => {
    const to = axis === 'y' ? { top: position } : { left: position }
    if (container) container.scrollTo({ ...to, behavior: 'instant' })
    else window.scrollTo({ ...to, behavior: 'instant' })
  }
  if (duration <= 0 || prefersReducedMotion() || start === end) {
    set(end)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const began = performance.now()
    let frame = 0
    const interrupters = ['wheel', 'touchstart', 'keydown'] as const
    const stop = () => {
      cancelAnimationFrame(frame)
      for (const type of interrupters) window.removeEventListener(type, stop)
      resolve()
    }
    for (const type of interrupters) window.addEventListener(type, stop, { passive: true })
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / duration)
      set(start + (end - start) * easing(t))
      if (t < 1) frame = requestAnimationFrame(step)
      else stop()
    }
    frame = requestAnimationFrame(step)
  })
}

let locks = 0
let restore: (() => void) | null = null

/**
 * Stop the page from scrolling, for a modal or a drawer, without the layout jumping: the
 * scrollbar's width is kept as padding. Nested locks are counted, and the page scrolls again
 * once every one is released. Returns the release.
 */
export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (locks++ === 0) {
    const root = document.documentElement
    const { overflow, paddingRight } = root.style
    const scrollbar = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (scrollbar > 0) {
      const current = Number.parseFloat(getComputedStyle(root).paddingRight) || 0
      root.style.paddingRight = `${current + scrollbar}px`
    }
    restore = () => {
      root.style.overflow = overflow
      root.style.paddingRight = paddingRight
    }
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks === 0) {
      restore?.()
      restore = null
    }
  }
}

/**
 * How far `transform` and `translate` move the box along `axis`, in pixels. Measured boxes
 * include them, and a sticky header that slides away with a transform is still pinned.
 */
function shift(style: CSSStyleDeclaration, axis: Axis): number {
  let px = 0
  if (style.transform && style.transform !== 'none' && typeof DOMMatrixReadOnly === 'function') {
    const m = new DOMMatrixReadOnly(style.transform)
    px += axis === 'y' ? m.m42 : m.m41
  }
  if (style.translate && style.translate !== 'none') {
    const [x = '0', y = '0'] = style.translate.split(' ')
    const part = axis === 'y' ? y : x
    // shortcut: a percentage needs the box's size; only pixel offsets are taken out.
    if (part.endsWith('px')) px += Number.parseFloat(part)
  }
  return px
}

/** Whether a `position: sticky` element is pinned at its offset right now. */
export function isStuck(element: Element, axis: Axis = 'y'): boolean {
  const style = getComputedStyle(element)
  const edge = Number.parseFloat(axis === 'y' ? style.top : style.left)
  if (Number.isNaN(edge)) return false
  const container = scrollParent(element, axis)
  const viewportStart = scrollportStart(container, axis)
  const rect = element.getBoundingClientRect()
  const at = (axis === 'y' ? rect.top : rect.left) - viewportStart - shift(style, axis)
  // Pinned means held at its offset while the content scrolls on; at the very start nothing
  // has scrolled, so an element resting there naturally is not stuck.
  return Math.abs(at - edge) < 1 && positionOf(container, axis) > 0
}

export interface ScrollEdges {
  /** Scrolled all the way to the start: nothing more before. */
  atStart: boolean
  /** Scrolled all the way to the end: nothing more after. */
  atEnd: boolean
}

/** Whether `element` sits at the start or the end of its own scroll along `axis`. */
export function scrollEdges(element: Element, axis: Axis = 'x'): ScrollEdges {
  const position = axis === 'x' ? Math.abs(element.scrollLeft) : element.scrollTop
  const room =
    axis === 'x'
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight
  // A pixel of slack: zoomed pages scroll by fractions and stop half a pixel short.
  return { atStart: position <= 1, atEnd: position >= room - 1 }
}

/**
 * Let a vertical mouse wheel scroll `element` sideways, for a row of cards with no vertical
 * scroll of its own. Trackpads that already scroll sideways are left alone, and at either end
 * the wheel goes back to scrolling the page. Returns a function that stops it.
 */
export function wheelToHorizontal(element: HTMLElement): () => void {
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
    const { atStart, atEnd } = scrollEdges(element, 'x')
    if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return
    event.preventDefault()
    // deltaMode 1 counts lines: about 16 pixels each.
    element.scrollLeft += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
  }
  element.addEventListener('wheel', onWheel, { passive: false })
  return () => element.removeEventListener('wheel', onWheel)
}
