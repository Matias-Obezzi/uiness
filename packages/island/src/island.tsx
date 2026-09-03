import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useIsland, useIslandEntry } from './context'
import { type SpringConfig, type SpringPreset, springEasing } from './spring'
import type { IslandEntry, IslandMode, IslandStore } from './types'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface IslandProps {
  /** Store to render. Defaults to the shared `island` store. */
  store?: IslandStore
  /** Screen edge the island sticks to. Default 'top'. */
  position?: 'top' | 'bottom'
  /** Distance from the edge in px. Added to the safe area inset unless `anchor` is 'edge'. Default 12. */
  offset?: number
  /**
   * 'safe-area' (default) keeps the island below the status bar / notch.
   * 'edge' measures from the physical screen edge, which lets a standalone PWA
   * overlay the island on the real Dynamic Island. See the README.
   */
  anchor?: 'safe-area' | 'edge'
  /**
   * Content shown when nothing is on the stack. Defaults to an empty pill.
   * Pass `false` to hide the island completely while idle.
   */
  idle?: ReactNode | false
  /** Width of the idle pill and minimum width of compact entries. Default 120. */
  idleWidth?: number
  /** Height of the idle pill and of compact entries. Default 36. */
  idleHeight?: number
  /** Corner radius of expanded entries. Default 28. */
  expandedRadius?: number
  /** Spring used for the size morph. Preset name or `{ stiffness, damping, mass }`. */
  spring?: SpringConfig | SpringPreset
  /** Pause auto dismiss timers while the pointer is over the island. Default true. */
  pauseOnHover?: boolean
  zIndex?: number
  className?: string
  /** Applied to the island box. Use CSS variables here to theme it. */
  style?: CSSProperties
}

interface Size {
  width: number
  height: number
  radius: number
}

interface Rendered {
  key: string
  mode: IslandMode
  node: ReactNode
}

const STYLE_ID = 'uiness-island-styles'
const KEYFRAMES = `@keyframes uiness-island-spin{to{transform:rotate(360deg)}}`

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = KEYFRAMES
    document.head.appendChild(style)
  }, [])
}

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const canAnimate = (el: Element | null): el is HTMLElement =>
  !!el && typeof (el as HTMLElement).animate === 'function'

function entryNode(entry: IslandEntry, idleWidth: number): ReactNode {
  if (entry.mode === 'expanded') return entry.content
  const hasSides = entry.leading != null || entry.trailing != null
  return (
    <>
      {entry.leading != null && (
        <span
          data-island-leading=""
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          {entry.leading}
        </span>
      )}
      {entry.content != null && (
        <span data-island-center="" style={{ display: 'flex', alignItems: 'center' }}>
          {entry.content}
        </span>
      )}
      {hasSides && entry.content == null && <span style={{ flex: 1, minWidth: idleWidth / 3 }} />}
      {entry.trailing != null && (
        <span
          data-island-trailing=""
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          {entry.trailing}
        </span>
      )}
    </>
  )
}

/**
 * Renders the island. Mount it once, anywhere in the tree, then drive it with
 * `useIsland()` or the exported `island` object.
 */
export function Island({
  store: storeProp,
  position = 'top',
  offset = 12,
  anchor = 'safe-area',
  idle,
  idleWidth = 120,
  idleHeight = 36,
  expandedRadius = 28,
  spring,
  pauseOnHover = true,
  zIndex = 9999,
  className,
  style,
}: IslandProps) {
  const store = useIsland(storeProp)
  const entry = useIslandEntry(store)
  useInjectStyles()

  const boxRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const outgoingRef = useRef<HTMLDivElement | null>(null)

  const mode: IslandMode = entry?.mode ?? 'compact'
  const key = entry ? `${entry.id}:${entry.mode}` : 'idle'
  const node = entry ? entryNode(entry, idleWidth) : idle
  const shouldShow = !!entry || idle !== false

  const [visible, setVisible] = useState(shouldShow)
  const [outgoing, setOutgoing] = useState<Rendered | null>(null)
  const renderedRef = useRef<Rendered | null>(null)

  // Remember what was on screen so it can animate out when the entry changes.
  useIsomorphicLayoutEffect(() => {
    const previous = renderedRef.current
    if (previous && previous.key !== key && shouldShow) setOutgoing(previous)
    renderedRef.current = { key, mode, node }
  })

  // Size morph: FLIP from the box's current size to the content's natural size.
  const sizeRef = useRef<Size | null>(null)
  const animationRef = useRef<Animation | null>(null)
  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return
    const radius = mode === 'expanded' ? expandedRadius : idleHeight / 2
    const rect = content.getBoundingClientRect()
    const last: Size = { width: rect.width, height: rect.height, radius }
    const target = sizeRef.current
    sizeRef.current = last
    if (!target) return
    if (
      target.width === last.width &&
      target.height === last.height &&
      target.radius === last.radius
    ) {
      return
    }

    let first = target
    const running = animationRef.current
    if (running) {
      const current = box.getBoundingClientRect()
      const currentRadius = Number.parseFloat(getComputedStyle(box).borderRadius)
      first = {
        width: current.width,
        height: current.height,
        radius: Number.isNaN(currentRadius) ? target.radius : currentRadius,
      }
      running.cancel()
      animationRef.current = null
    }
    if (!canAnimate(box)) return
    // A collapsed box (hidden container, zero viewport) has nothing sensible to morph from.
    if (first.width === 0 || first.height === 0 || last.width === 0 || last.height === 0) return

    const { easing, duration } = springEasing(spring)
    const reduce = reducedMotion()
    const animation = box.animate(
      [
        {
          width: `${first.width}px`,
          height: `${first.height}px`,
          borderRadius: `${first.radius}px`,
        },
        { width: `${last.width}px`, height: `${last.height}px`, borderRadius: `${last.radius}px` },
      ],
      { duration: reduce ? 0 : duration, easing: reduce ? 'linear' : easing, fill: 'none' },
    )
    animationRef.current = animation
    const clear = () => {
      if (animationRef.current === animation) animationRef.current = null
    }
    animation.onfinish = clear
    animation.oncancel = clear
  })

  // Incoming content: blur in while the box grows, so clipped edges stay soft.
  // Re-runs whenever the rendered entry changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the trigger, not a value used inside
  useEffect(() => {
    const content = contentRef.current
    if (!canAnimate(content) || reducedMotion()) return
    const morph = springEasing(spring).duration
    const duration = Math.min(450, Math.max(220, morph * 0.55))
    const animation = content.animate(
      [
        { opacity: 0, filter: 'blur(12px)', transform: 'scale(0.85)' },
        { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
      ],
      { duration, delay: 30, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
    )
    return () => animation.cancel()
  }, [key, spring])

  // Outgoing content: blur out, then drop it.
  useEffect(() => {
    if (!outgoing) return
    const el = outgoingRef.current
    if (!canAnimate(el) || reducedMotion()) {
      setOutgoing(null)
      return
    }
    const animation = el.animate(
      [
        { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
        { opacity: 0, filter: 'blur(8px)', transform: 'scale(0.9)' },
      ],
      { duration: 140, easing: 'ease-in', fill: 'forwards' },
    )
    animation.onfinish = () => setOutgoing(null)
    return () => animation.cancel()
  }, [outgoing])

  // Whole island in and out when `idle={false}`.
  const wasVisible = useRef(shouldShow)
  useEffect(() => {
    const box = boxRef.current
    if (shouldShow === wasVisible.current) return
    wasVisible.current = shouldShow
    if (shouldShow) {
      setVisible(true)
      if (canAnimate(box) && !reducedMotion()) {
        box.animate(
          [
            { opacity: 0, transform: 'scale(0.6)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        )
      }
      return
    }
    if (canAnimate(box) && !reducedMotion()) {
      const animation = box.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.6)' },
        ],
        { duration: 200, easing: 'ease-in', fill: 'forwards' },
      )
      animation.onfinish = () => {
        setVisible(false)
        animation.cancel()
      }
      return () => animation.cancel()
    }
    setVisible(false)
  }, [shouldShow])

  // Escape and outside pointer down.
  useEffect(() => {
    if (!entry?.dismissible) return
    const id = entry.id
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') store.dismiss(id)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) store.dismiss(id)
    }
    document.addEventListener('keydown', onKeyDown)
    // Defer so the interaction that opened the entry does not close it.
    const timer = setTimeout(() => document.addEventListener('pointerdown', onPointerDown), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [entry?.id, entry?.dismissible, store])

  // Focus management for dialogs.
  const isDialog =
    entry?.mode === 'expanded' && (entry.role === 'dialog' || entry.role === 'alertdialog')
  useEffect(() => {
    if (!isDialog) return
    const previous = document.activeElement
    const box = boxRef.current
    const focusable = box?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    ;(focusable ?? box)?.focus({ preventScroll: true })
    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [isDialog])

  const onPointerEnter = useCallback(() => {
    if (pauseOnHover && entry) store.pause(entry.id)
  }, [pauseOnHover, entry, store])
  const onPointerLeave = useCallback(() => {
    if (pauseOnHover && entry) store.resume(entry.id)
  }, [pauseOnHover, entry, store])

  const edge =
    anchor === 'edge' ? `${offset}px` : `calc(env(safe-area-inset-${position}, 0px) + ${offset}px)`
  const layerStyle: CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    [position]: edge,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex,
  }

  const boxStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    // Center the content so a box narrower than its content clips both edges evenly.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    background: 'var(--island-bg, #000)',
    color: 'var(--island-color, #fff)',
    borderRadius: mode === 'expanded' ? expandedRadius : idleHeight / 2,
    boxShadow: 'var(--island-shadow, 0 8px 32px rgba(0, 0, 0, 0.35))',
    fontFamily: 'var(--island-font, system-ui, -apple-system, sans-serif)',
    fontSize: 14,
    lineHeight: 1.2,
    outline: 'none',
    visibility: visible ? undefined : 'hidden',
    willChange: 'width, height',
    ...style,
  }

  const contentStyle: CSSProperties =
    mode === 'expanded'
      ? {
          boxSizing: 'border-box',
          flexShrink: 0,
          width: entry?.width ?? 'max-content',
          maxWidth: 'var(--island-max-width, min(420px, calc(100vw - 24px)))',
          padding: 'var(--island-padding, 16px)',
        }
      : {
          boxSizing: 'border-box',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          height: idleHeight,
          minWidth: idleWidth,
          maxWidth: 'calc(100vw - 24px)',
          padding: '0 14px',
          whiteSpace: 'nowrap',
        }

  return (
    <div data-uiness-island-layer="" style={layerStyle}>
      <div
        ref={boxRef}
        data-uiness-island=""
        data-mode={entry ? mode : 'idle'}
        data-entry={entry?.id}
        className={className}
        style={boxStyle}
        role={entry?.role ?? 'status'}
        aria-live={isDialog ? undefined : 'polite'}
        tabIndex={isDialog ? -1 : undefined}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div key={key} ref={contentRef} data-island-content="" style={contentStyle}>
          {node}
        </div>
        {outgoing && (
          <div
            ref={outgoingRef}
            aria-hidden
            data-island-outgoing=""
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={
                outgoing.mode === 'expanded'
                  ? {
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: 'var(--island-padding, 16px)',
                    }
                  : {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      width: '100%',
                      height: idleHeight,
                      padding: '0 14px',
                      whiteSpace: 'nowrap',
                    }
              }
            >
              {outgoing.node}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Props that overlay the island on the physical Dynamic Island of recent iPhones.
 * Only meaningful for a standalone PWA with `viewport-fit=cover` and a translucent
 * status bar, where the page extends under the status bar. In a browser tab the
 * island can never reach the hardware one because the browser toolbar sits above the page.
 *
 * @example <Island {...(standalone ? hardwareIsland : {})} />
 */
export const hardwareIsland = {
  anchor: 'edge',
  offset: 11,
  idleWidth: 126,
  idleHeight: 37,
} as const satisfies Partial<IslandProps>

const standaloneQuery = '(display-mode: standalone), (display-mode: fullscreen)'
const isStandalone = () =>
  typeof window !== 'undefined' &&
  ((typeof matchMedia === 'function' && matchMedia(standaloneQuery).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)
const subscribeStandalone = (onChange: () => void) => {
  if (typeof matchMedia !== 'function') return () => {}
  const query = matchMedia(standaloneQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const serverStandalone = () => false

/** True when the page runs as an installed app (standalone or fullscreen display mode). */
export function useStandalone(): boolean {
  return useSyncExternalStore(subscribeStandalone, isStandalone, serverStandalone)
}
