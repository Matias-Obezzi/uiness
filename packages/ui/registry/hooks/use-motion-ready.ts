'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * - `idle`: on the server, in the first client render and with reduced motion. Render the final
 *   content and do not animate.
 * - `shown`: the server HTML was already on screen when the page hydrated. The reader has seen the
 *   final content, so do not hide it again; carry on from it if the component loops.
 * - `armed`: mounted on the client, or hydrated while still off screen. Switch to the start of the
 *   animation and play it as usual (on mount, or when it scrolls into view).
 */
export type MotionReady = 'idle' | 'shown' | 'armed'

const subscribe = () => () => {}

function onScreen(el: Element) {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
}

/**
 * Lets a text animation be an enhancement: the server renders the finished text or number, and
 * only after mount, with motion allowed, does the component switch to its animated start. The
 * switch happens before the browser paints, so a page rendered on the client never flashes the
 * final state, and a server-rendered page never blanks content the reader is already looking at.
 * Without JavaScript nothing switches and the content stays as rendered.
 */
export function useMotionReady(ref: React.RefObject<Element | null>): MotionReady {
  const reduced = useReducedMotion()
  // The server snapshot is what React uses while hydrating, so this is false only then.
  const client = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const hydrating = React.useRef(!client).current
  const [state, setState] = React.useState<MotionReady>('idle')
  useIsoLayoutEffect(() => {
    const el = ref.current
    setState(hydrating && el && onScreen(el) ? 'shown' : 'armed')
  }, [])
  return reduced ? 'idle' : state
}
