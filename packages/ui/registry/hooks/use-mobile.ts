'use client'

import * as React from 'react'

/**
 * Whether the viewport is narrower than `breakpoint` pixels, kept in step as it resizes. False on
 * the server and while hydrating.
 */
export function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`
  return React.useSyncExternalStore(
    React.useCallback(
      (notify: () => void) => {
        if (typeof matchMedia !== 'function') return () => {}
        const mq = matchMedia(query)
        mq.addEventListener('change', notify)
        return () => mq.removeEventListener('change', notify)
      },
      [query],
    ),
    () => typeof matchMedia === 'function' && matchMedia(query).matches,
    () => false,
  )
}
