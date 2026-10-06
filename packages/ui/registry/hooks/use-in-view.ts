'use client'

import * as React from 'react'

export interface UseInViewOptions {
  /** Keep reporting true after the first time. Default true. */
  once?: boolean
  /** How much of the element has to be visible, 0 to 1. Default 0.2. */
  amount?: number
  /** Margin around the viewport, CSS syntax. */
  margin?: string
}

/**
 * Whether an element is on screen. Without IntersectionObserver, as in tests and old
 * browsers, it reports true right away.
 */
export function useInView<T extends Element = HTMLDivElement>(
  ref: React.RefObject<T | null>,
  { once = true, amount = 0.2, margin }: UseInViewOptions = {},
) {
  const [inView, setInView] = React.useState(false)
  // False on the server and while hydrating, like the observer before its first report.
  const unobservable = React.useSyncExternalStore(
    subscribeNever,
    () => typeof IntersectionObserver === 'undefined',
    () => false,
  )

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold: amount, rootMargin: margin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, once, amount, margin])

  return inView || unobservable
}

const subscribeNever = () => () => {}
