'use client'

import * as React from 'react'
import {
  type Axis,
  activeIndexAt,
  observeScrollProgress,
  type ProgressInfo,
  type ProgressOptions,
  scrollParent,
  scrolls,
} from './core'
import {
  type DirectionOptions,
  isStuck,
  lockScroll,
  observeScrollDirection,
  observeScrollVelocity,
  type ScrollDirection,
  type ScrollEdges,
  type ScrollSourceOptions,
  scrollEdges,
  wheelToHorizontal,
} from './motion'

type Ref<T> = React.RefObject<T | null>

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * Run `callback` whenever the element's scroll progress changes, without re-rendering.
 * Use it to write styles straight to the DOM.
 */
export function useScrollEffect(
  ref: Ref<Element>,
  callback: (info: ProgressInfo) => void,
  options: ProgressOptions = {},
) {
  const cb = React.useRef(callback)
  cb.current = callback
  const { offset, axis, container, clamp } = options
  const offsetKey = JSON.stringify(offset ?? null)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    return observeScrollProgress(el, { offset, axis, container, clamp }, (info) => cb.current(info))
  }, [ref, offsetKey, axis, container, clamp])
}

/** The element's scroll progress as state, 0 to 1, updated at most once per frame. */
export function useScrollProgress(ref: Ref<Element>, options: ProgressOptions = {}): number {
  const [progress, setProgress] = React.useState(0)
  useScrollEffect(ref, (info) => setProgress(info.progress), options)
  return progress
}

export interface ParallaxOptions extends ProgressOptions {
  /**
   * How far the element moves over its trip through the viewport, as a fraction of the
   * viewport. Positive lags behind the scroll, negative runs ahead. Default 0.2.
   */
  speed?: number
}

function useReducedMotion(): boolean {
  // Read on mount, so the first frame already stays put.
  const [reduced, setReduced] = React.useState(
    () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

/**
 * Move an element at a different rate than the page while it scrolls by. Writes a
 * `translate` to the element directly, so nothing re-renders. Stays put for readers who ask
 * for reduced motion.
 */
export function useParallax(ref: Ref<HTMLElement>, options: ParallaxOptions = {}) {
  const { speed = 0.2, ...rest } = options
  const axis = rest.axis ?? 'y'
  const reduced = useReducedMotion()
  useIsoLayoutEffect(() => {
    if (reduced && ref.current) ref.current.style.translate = ''
  }, [reduced, ref])
  useScrollEffect(
    ref,
    ({ progress, viewport }) => {
      const el = ref.current
      if (!el || reduced) return
      const px = ((0.5 - progress) * speed * viewport).toFixed(2)
      el.style.translate = axis === 'y' ? `0 ${px}px` : `${px}px 0`
    },
    rest,
  )
}

export interface ActiveSectionOptions {
  /** Line across the viewport the sections are compared to, 0 top to 1 bottom. Default 0.5. */
  anchor?: number
  /** Which descendants count as sections. Default the direct children. */
  selector?: string
  /**
   * Scrolling ancestor. Left out, the nearest one that actually scrolls is found for you.
   * Pass `null` to measure against the window whatever the list sits inside.
   */
  container?: HTMLElement | null
  /** `x` for a row: the line runs top to bottom and `anchor` 0 is the left edge. Default `y`. */
  axis?: Axis
}

/**
 * Index of the child of `ref` closest to a line across the viewport. Drives sticky panels
 * that change with the section being read, or the dots under a row of cards.
 */
export function useActiveSection(
  ref: Ref<HTMLElement>,
  { anchor = 0.5, selector, container, axis = 'y' }: ActiveSectionOptions = {},
): number {
  const [active, setActive] = React.useState(0)
  useIsoLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    // Same rule as the progress hooks: a list inside a scrolling panel is read against that
    // panel unless the caller says otherwise.
    // A row of cards is often its own scroller: then the list is what to measure against.
    const resolved =
      container === undefined ? (scrolls(root, axis) ? root : scrollParent(root, axis)) : container
    const scroller: EventTarget = resolved ?? window
    let frame = 0
    const update = () => {
      frame = 0
      const sections = selector ? root.querySelectorAll(selector) : root.children
      const next = activeIndexAt(sections, anchor, resolved, axis)
      setActive((prev) => (next === -1 || next === prev ? prev : next))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref, anchor, selector, container, axis])
  return active
}

/**
 * How fast the page (or `container`) scrolls, in pixels per second, positive towards the end.
 * Updates at most once per frame and settles to 0 when the scrolling stops.
 */
export function useScrollVelocity({ container, axis }: ScrollSourceOptions = {}): number {
  const [velocity, setVelocity] = React.useState(0)
  React.useEffect(
    () => observeScrollVelocity((v) => setVelocity(Math.round(v)), { container, axis }),
    [container, axis],
  )
  return velocity
}

/**
 * Which way the page (or `container`) scrolled last: `down`, `up`, or `null` before it moved.
 * Flips only after `threshold` pixels the other way. Hides a header on the way down.
 */
export function useScrollDirection({
  container,
  axis,
  threshold,
}: DirectionOptions = {}): ScrollDirection | null {
  const [direction, setDirection] = React.useState<ScrollDirection | null>(null)
  React.useEffect(
    () => observeScrollDirection(setDirection, { container, axis, threshold }),
    [container, axis, threshold],
  )
  return direction
}

/** Whether a `position: sticky` element is pinned at its offset right now. */
export function useStuck(ref: Ref<Element>, axis: Axis = 'y'): boolean {
  const [stuck, setStuck] = React.useState(false)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const scroller: EventTarget = scrollParent(el, axis) ?? window
    let frame = 0
    const update = () => {
      frame = 0
      setStuck(isStuck(el, axis))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref, axis])
  return stuck
}

/** Keep the page from scrolling while `active`, for a modal or a drawer. */
export function useScrollLock(active = true) {
  useIsoLayoutEffect(() => (active ? lockScroll() : undefined), [active])
}

/**
 * Whether the scrolling element in `ref` is at the start or the end of its own scroll, for
 * the arrows or fades of a row of cards. Updates on scroll and on resize.
 */
export function useScrollEdges(ref: Ref<HTMLElement>, axis: Axis = 'x'): ScrollEdges {
  const [edges, setEdges] = React.useState<ScrollEdges>({ atStart: true, atEnd: false })
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges((prev) => {
        const next = scrollEdges(el, axis)
        return prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next
      })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [ref, axis])
  return edges
}

/** Let a vertical mouse wheel scroll the row in `ref` sideways, handing back to the page at the ends. */
export function useHorizontalWheel(ref: Ref<HTMLElement>) {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    return wheelToHorizontal(el)
  }, [ref])
}
