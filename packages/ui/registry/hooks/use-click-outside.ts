'use client'

import * as React from 'react'

/**
 * Calls `handler` when a press lands outside the element, by mouse, pen or touch. What it
 * renders in a portal is outside it in the DOM, so a press there counts as outside.
 */
export function useClickOutside<T extends Element>(
  ref: React.RefObject<T | null>,
  handler: (event: PointerEvent) => void,
) {
  // The latest handler, so an inline function does not re-subscribe on every render.
  const latest = React.useRef(handler)
  React.useEffect(() => {
    latest.current = handler
  })

  React.useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const el = ref.current
      if (el && !el.contains(event.target as Node)) latest.current(event)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [ref])
}
