import {
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { toastStore } from './store'
import type { Toast, ToastPosition, ToastStore, ToastType } from './types'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface ToasterProps {
  /** Store to render. Defaults to the shared one behind `toast()`. */
  store?: ToastStore
  /** Default 'bottom-right'. */
  position?: ToastPosition
  /** Keep the stack expanded instead of collapsing it until hovered. */
  expand?: boolean
  /** How many toasts stay visible in the collapsed stack. Default 3. */
  visibleToasts?: number
  /** Colored backgrounds for success, error, info and warning. */
  richColors?: boolean
  /** Close button on every toast. */
  closeButton?: boolean
  /** Default auto dismiss delay in ms. Default 4000. */
  duration?: number
  /** Space between toasts when expanded, in px. Default 14. */
  gap?: number
  /** Distance from the viewport edges. Default 24. */
  offset?: number | string
  /** Custom icons per type. */
  icons?: Partial<Record<ToastType, ReactNode>>
  /** Class and style for every toast card. */
  toastClassName?: string
  toastStyle?: CSSProperties
  className?: string
  style?: CSSProperties
  /** Pause timers while the page is not focused. Default true. */
  pauseWhenPageIsHidden?: boolean
}

const STYLE_ID = 'uiness-toast-styles'
const CSS = `
@keyframes uiness-toast-spin{to{transform:rotate(360deg)}}
[data-uiness-toaster]{--toast-width:356px;--toast-gap-collapsed:12px}
[data-uiness-toaster] [data-toast]{box-sizing:border-box}
[data-uiness-toaster] [data-toast] *{box-sizing:border-box}
`

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])
}

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const Icon = ({ path, color }: { path: string; color?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke={color ?? 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={path} />
  </svg>
)

const defaultIcons: Record<ToastType, ReactNode> = {
  default: null,
  success: <Icon path="M20 6 9 17l-5-5" />,
  error: <Icon path="M18 6 6 18M6 6l12 12" />,
  info: <Icon path="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />,
  warning: (
    <Icon path="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  loading: (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderRightColor: 'transparent',
        animation: 'uiness-toast-spin 0.8s linear infinite',
      }}
    />
  ),
}

const richColorVars: Partial<Record<ToastType, CSSProperties>> = {
  success: {
    '--toast-bg': 'var(--toast-success-bg, #ecfdf3)',
    '--toast-color': 'var(--toast-success-color, #027a48)',
    '--toast-border': 'var(--toast-success-border, #abefc6)',
  } as CSSProperties,
  error: {
    '--toast-bg': 'var(--toast-error-bg, #fef3f2)',
    '--toast-color': 'var(--toast-error-color, #b42318)',
    '--toast-border': 'var(--toast-error-border, #fecdca)',
  } as CSSProperties,
  info: {
    '--toast-bg': 'var(--toast-info-bg, #eff8ff)',
    '--toast-color': 'var(--toast-info-color, #175cd3)',
    '--toast-border': 'var(--toast-info-border, #b2ddff)',
  } as CSSProperties,
  warning: {
    '--toast-bg': 'var(--toast-warning-bg, #fffaeb)',
    '--toast-color': 'var(--toast-warning-color, #b54708)',
    '--toast-border': 'var(--toast-warning-border, #fedf89)',
  } as CSSProperties,
}

const SWIPE_THRESHOLD = 45

interface ToastCardProps {
  toast: Toast
  index: number
  total: number
  position: ToastPosition
  expanded: boolean
  visibleToasts: number
  offsetPx: number
  richColors: boolean
  closeButton: boolean
  icons: Partial<Record<ToastType, ReactNode>>
  className?: string
  style?: CSSProperties
  store: ToastStore
  onHeight: (id: string, height: number) => void
}

function ToastCard({
  toast,
  index,
  total,
  position,
  expanded,
  visibleToasts,
  offsetPx,
  richColors,
  closeButton,
  icons,
  className,
  style,
  store,
  onHeight,
}: ToastCardProps) {
  const ref = useRef<HTMLLIElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [swipe, setSwipe] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const isTop = position.startsWith('top')

  // Flip to the resting position right after the first paint so the enter transition plays.
  // The timeout covers environments where animation frames are throttled.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    const timer = setTimeout(() => setMounted(true), 50)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    onHeight(toast.id, el.getBoundingClientRect().height)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => onHeight(toast.id, el.getBoundingClientRect().height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [toast.id, onHeight])

  // Finish removal once the exit transition has played.
  useEffect(() => {
    if (!toast.removing) return
    const timer = setTimeout(() => store.remove(toast.id), reducedMotion() ? 0 : 260)
    return () => clearTimeout(timer)
  }, [toast.removing, toast.id, store])

  const onPointerDown = (event: ReactPointerEvent<HTMLLIElement>) => {
    if (!toast.dismissible || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLLIElement>) => {
    const start = pointerStart.current
    if (!start) return
    const dx = event.clientX - start.x
    let dy = event.clientY - start.y
    // Only allow vertical movement towards the edge the toast came from.
    dy = isTop ? Math.min(0, dy) : Math.max(0, dy)
    setSwipe({ x: dx, y: dy, active: true })
  }
  const onPointerUp = () => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    if (Math.abs(swipe.x) > SWIPE_THRESHOLD || Math.abs(swipe.y) > SWIPE_THRESHOLD) {
      store.dismiss(toast.id)
      return
    }
    setSwipe({ x: 0, y: 0, active: false })
  }

  const hidden = index >= visibleToasts
  const edgeSign = isTop ? -1 : 1
  const y = expanded ? offsetPx : index * 12
  const scale = expanded ? 1 : 1 - index * 0.05
  const entering = !mounted
  const leaving = !!toast.removing

  let transform: string
  if (entering) transform = `translateY(${edgeSign * 100}%)`
  else if (leaving) transform = `translateY(${-edgeSign * y}px) translateY(${edgeSign * 120}%)`
  else
    transform = `translateY(${-edgeSign * y}px) translate(${swipe.x}px, ${swipe.y}px) scale(${scale})`

  const opacity = entering || leaving || hidden ? 0 : 1
  const transition = swipe.active
    ? 'none'
    : reducedMotion()
      ? 'opacity 0.1s'
      : 'transform 0.4s cubic-bezier(0.21, 1.02, 0.73, 1), opacity 0.3s, height 0.3s'

  const icon =
    toast.icon !== undefined ? toast.icon : (icons[toast.type] ?? defaultIcons[toast.type])
  const showClose = toast.closeButton ?? closeButton

  const cardStyle: CSSProperties = {
    position: 'absolute',
    [isTop ? 'top' : 'bottom']: 0,
    left: 0,
    right: 0,
    width: 'var(--toast-width)',
    transformOrigin: isTop ? 'top center' : 'bottom center',
    transform,
    opacity,
    transition,
    zIndex: total - index,
    pointerEvents: leaving || hidden ? 'none' : 'auto',
    touchAction: 'none',
    userSelect: swipe.active ? 'none' : undefined,
    ...(richColors ? richColorVars[toast.type] : null),
    ...style,
    ...toast.style,
  }

  const content = toast.render ? (
    toast.render(toast)
  ) : (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--toast-radius, 12px)',
        background: 'var(--toast-bg, #fff)',
        color: 'var(--toast-color, #111)',
        border: '1px solid var(--toast-border, rgba(0,0,0,0.08))',
        boxShadow: 'var(--toast-shadow, 0 8px 30px rgba(0,0,0,0.12))',
        fontFamily: 'var(--toast-font, system-ui, -apple-system, sans-serif)',
        fontSize: 14,
        lineHeight: 1.35,
      }}
      className={className}
    >
      {icon != null && (
        <span data-toast-icon="" style={{ display: 'flex', flexShrink: 0, marginTop: 1 }}>
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {toast.title != null && (
          <div data-toast-title="" style={{ fontWeight: 600 }}>
            {toast.title}
          </div>
        )}
        {toast.description != null && (
          <div data-toast-description="" style={{ opacity: 0.75, fontSize: 13 }}>
            {toast.description}
          </div>
        )}
        {(toast.action || toast.cancel) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {toast.action && (
              <button
                type="button"
                data-toast-action=""
                onClick={(event) => {
                  toast.action?.onClick(event)
                  if (!event.defaultPrevented) store.dismiss(toast.id)
                }}
                style={actionStyle(true)}
              >
                {toast.action.label}
              </button>
            )}
            {toast.cancel && (
              <button
                type="button"
                data-toast-cancel=""
                onClick={(event) => {
                  toast.cancel?.onClick(event)
                  store.dismiss(toast.id)
                }}
                style={actionStyle(false)}
              >
                {toast.cancel.label}
              </button>
            )}
          </div>
        )}
      </div>
      {showClose && toast.dismissible && (
        <button
          type="button"
          aria-label="Close"
          data-toast-close=""
          onClick={() => store.dismiss(toast.id)}
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            marginRight: -6,
            marginTop: -4,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            opacity: 0.6,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          <Icon path="M18 6 6 18M6 6l12 12" />
        </button>
      )}
    </div>
  )

  return (
    <li
      ref={ref}
      data-toast=""
      data-type={toast.type}
      data-index={index}
      data-front={index === 0 ? '' : undefined}
      data-removing={toast.removing ? '' : undefined}
      role={toast.type === 'loading' ? 'status' : toast.important ? 'alert' : 'status'}
      aria-live={toast.important ? 'assertive' : 'polite'}
      aria-atomic
      style={cardStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {content}
    </li>
  )
}

const actionStyle = (primary: boolean): CSSProperties => ({
  font: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 10px',
  borderRadius: 8,
  border: primary ? 'none' : '1px solid var(--toast-border, rgba(0,0,0,0.12))',
  background: primary ? 'var(--toast-action-bg, #111)' : 'transparent',
  color: primary ? 'var(--toast-action-color, #fff)' : 'inherit',
  cursor: 'pointer',
})

const EMPTY: Toast[] = []
const getServerToasts = () => EMPTY

/**
 * Renders the toasts. Mount it once, then call `toast()` from anywhere.
 */
export function Toaster({
  store = toastStore,
  position = 'bottom-right',
  expand = false,
  visibleToasts = 3,
  richColors = false,
  closeButton = false,
  duration = 4000,
  gap = 14,
  offset = 24,
  icons = {},
  toastClassName,
  toastStyle,
  className,
  style,
  pauseWhenPageIsHidden = true,
}: ToasterProps) {
  useInjectStyles()
  const toasts = useSyncExternalStore(store.subscribe, store.getToasts, getServerToasts)
  const [hovered, setHovered] = useState(false)
  const [heights, setHeights] = useState<Record<string, number>>({})

  useEffect(() => {
    store.defaultDuration = duration
  }, [store, duration])

  const onHeight = useCallback((id: string, height: number) => {
    setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }))
  }, [])

  useEffect(() => {
    if (hovered) store.pause()
    else store.resume()
  }, [hovered, store])

  useEffect(() => {
    if (!pauseWhenPageIsHidden) return
    const onVisibility = () => {
      if (document.hidden) store.pause()
      else if (!hovered) store.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [store, hovered, pauseWhenPageIsHidden])

  const groups = useMemo(() => {
    const map = new Map<ToastPosition, Toast[]>()
    for (const toast of toasts) {
      const key = toast.position ?? position
      const list = map.get(key) ?? []
      list.push(toast)
      map.set(key, list)
    }
    return map
  }, [toasts, position])

  const offsetValue = typeof offset === 'number' ? `${offset}px` : offset
  const expanded = expand || hovered

  return (
    <>
      {[...groups.entries()].map(([pos, list]) => {
        const ordered = [...list].reverse() // newest first
        const [vertical, horizontal] = pos.split('-') as [
          'top' | 'bottom',
          'left' | 'center' | 'right',
        ]
        // Offsets of each toast from the edge, based on the heights of the ones in front.
        const offsets: number[] = []
        let acc = 0
        ordered.forEach((toast, i) => {
          offsets[i] = acc
          if (!toast.removing) acc += (heights[toast.id] ?? 0) + gap
        })
        const frontHeight = heights[ordered[0]?.id ?? ''] ?? 0
        const totalHeight = Math.max(0, acc - gap)
        const regionHeight = expanded
          ? totalHeight
          : frontHeight + 12 * Math.min(ordered.length - 1, visibleToasts - 1)

        return (
          <ol
            key={pos}
            data-uiness-toaster=""
            data-position={pos}
            data-expanded={expanded ? '' : undefined}
            aria-label="Notifications"
            tabIndex={-1}
            className={className}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            style={{
              position: 'fixed',
              zIndex: 9999,
              margin: 0,
              padding: 0,
              listStyle: 'none',
              width: 'var(--toast-width)',
              maxWidth: 'calc(100vw - 32px)',
              height: regionHeight,
              [vertical]: `calc(env(safe-area-inset-${vertical}, 0px) + ${offsetValue})`,
              ...(horizontal === 'center'
                ? { left: '50%', transform: 'translateX(-50%)' }
                : {
                    [horizontal]: `calc(env(safe-area-inset-${horizontal}, 0px) + ${offsetValue})`,
                  }),
              outline: 'none',
              transition: 'height 0.3s',
              ...style,
            }}
          >
            {ordered.map((toast, i) => (
              <ToastCard
                key={toast.id}
                toast={toast}
                index={i}
                total={ordered.length}
                position={pos}
                expanded={expanded}
                visibleToasts={visibleToasts}
                offsetPx={offsets[i] ?? 0}
                richColors={richColors}
                closeButton={closeButton}
                icons={icons}
                className={toastClassName}
                style={toastStyle}
                store={store}
                onHeight={onHeight}
              />
            ))}
          </ol>
        )
      })}
    </>
  )
}
