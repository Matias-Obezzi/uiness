'use client'

import * as React from 'react'
import {
  activeIndexAt,
  observeScrollProgress,
  type ProgressInfo,
  type ProgressOptions,
} from './core'

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

/**
 * Move an element at a different rate than the page while it scrolls by. Writes a
 * `translate` to the element directly, so nothing re-renders.
 */
export function useParallax(ref: Ref<HTMLElement>, options: ParallaxOptions = {}) {
  const { speed = 0.2, ...rest } = options
  const axis = rest.axis ?? 'y'
  useScrollEffect(
    ref,
    ({ progress, viewport }) => {
      const el = ref.current
      if (!el) return
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
  /** Scrolling ancestor. Default the window. */
  container?: HTMLElement | null
}

/**
 * Index of the child of `ref` closest to a line across the viewport. Drives sticky panels
 * that change with the section being read.
 */
export function useActiveSection(
  ref: Ref<HTMLElement>,
  { anchor = 0.5, selector, container }: ActiveSectionOptions = {},
): number {
  const [active, setActive] = React.useState(0)
  useIsoLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const scroller: EventTarget = container ?? window
    let frame = 0
    const update = () => {
      frame = 0
      const sections = selector ? root.querySelectorAll(selector) : root.children
      const next = activeIndexAt(sections, anchor, container)
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
  }, [ref, anchor, selector, container])
  return active
}
