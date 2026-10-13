import {
  createContext,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { EngineMap, MapEngine } from './engine'
import {
  type LngLat,
  type MapView,
  normalize,
  type Point,
  pan,
  project,
  unproject,
  visibleTiles,
  zoomAround,
} from './projection'
import { providers, type TileProvider, tileUrl } from './providers'

export interface MapContextValue extends MapView {
  /** Width and height of the map in CSS pixels. 0 until it has been measured. */
  size: Point
  /** A coordinate to a point of the map, `[NaN, NaN]` while a platform is still loading. */
  project(lngLat: LngLat): Point
  /** A point of the map back to a coordinate. */
  unproject(point: Point): LngLat
  /** Move the map. What is left out stays as it is. */
  setView(view: Partial<MapView>): void
}

const MapContext = createContext<MapContextValue | null>(null)

/** The map around a component: its view, the projection and `setView`, to overlay anything. */
export function useMap(): MapContextValue {
  const map = useContext(MapContext)
  if (!map) throw new Error('useMap must be used inside a <Map>')
  return map
}

/**
 * When the wheel zooms the map. `'modifier'`: with Ctrl or ⌘ held, which is also what a
 * trackpad pinch sends, and the page scrolls otherwise. `'always'`: every wheel turn over the
 * map zooms, and the page cannot scroll past it. `'never'`: the wheel only scrolls.
 */
export type WheelZoom = 'modifier' | 'always' | 'never'

/** Whether a wheel event over the map should zoom it rather than scroll the page. */
export function zoomsOnWheel(
  mode: WheelZoom,
  event: Pick<WheelEvent, 'ctrlKey' | 'metaKey'>,
): boolean {
  if (mode === 'always') return true
  if (mode === 'never') return false
  return event.ctrlKey || event.metaKey
}

export interface MapProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Controlled center, `[lng, lat]`. */
  center?: LngLat
  /** Controlled zoom, fractional levels allowed. */
  zoom?: number
  /** Starting center when uncontrolled. Default `[0, 20]`. */
  defaultCenter?: LngLat
  /** Starting zoom when uncontrolled. Default 2. */
  defaultZoom?: number
  /** Every move: drags, pinches, the wheel, the keyboard, the zoom buttons. */
  onViewChange?: (view: MapView) => void
  /** Default 0. */
  minZoom?: number
  /** Default the provider's `maxZoom`, or 22 with an engine. */
  maxZoom?: number
  /**
   * When the wheel zooms the map: `'modifier'` (default) with Ctrl or ⌘ held or a trackpad
   * pinch, so the page scrolls past it; `'always'`; or `'never'`. Tiles only: an `engine`
   * handles its own wheel.
   */
  wheelZoom?: WheelZoom
  /** Where the tiles come from. Default OpenStreetMap. */
  provider?: TileProvider
  /** Draw with another platform instead of tiles, like `googleMaps()` or `appleMaps()`. */
  engine?: MapEngine
  /** Markers, popups, controls and anything that reads `useMap()`. */
  children?: ReactNode
}

const KEY_PAN = 80
const NAN: Point = [Number.NaN, Number.NaN]

const sameView = (a: MapView, b: MapView) =>
  a.zoom === b.zoom && a.center[0] === b.center[0] && a.center[1] === b.center[1]

/**
 * A slippy map of XYZ raster tiles in Web Mercator, or of another platform through `engine`.
 * Give it a size: it fills its box and has no height of its own.
 */
export function Map({
  center,
  zoom,
  defaultCenter = [0, 20],
  defaultZoom = 2,
  onViewChange,
  minZoom = 0,
  maxZoom,
  wheelZoom = 'modifier',
  provider = providers.osm,
  engine,
  children,
  style,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
  ...props
}: MapProps) {
  const ref = useRef<HTMLElement>(null)
  const engineRef = useRef<HTMLDivElement>(null)
  const [inner, setInner] = useState<MapView>({ center: defaultCenter, zoom: defaultZoom })
  const [size, setSize] = useState<Point>([0, 0])
  const [platform, setPlatform] = useState<EngineMap | null>(null)
  const view: MapView = { center: center ?? inner.center, zoom: zoom ?? inner.zoom }
  const max = maxZoom ?? (engine ? 22 : (provider.maxZoom ?? 19))

  // Read by native listeners and gestures, which outlive a render.
  const latest = useRef({ view, size, setView: (_: Partial<MapView>) => {} })
  const fromPlatform = useRef<MapView | null>(null)
  const setView = (next: Partial<MapView>) => {
    const merged = { ...latest.current.view, ...next }
    const v = {
      center: normalize(merged.center),
      zoom: Math.min(max, Math.max(minZoom, merged.zoom)),
    }
    latest.current.view = v
    setInner(v)
    onViewChange?.(v)
  }
  latest.current = { view, size, setView }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize([el.clientWidth, el.clientHeight])
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Not passive, so a wheel that zooms can keep the page from scrolling; one that does not is left alone.
  useEffect(() => {
    const el = ref.current
    if (!el || engine) return
    const wheel = (e: WheelEvent) => {
      if (!zoomsOnWheel(wheelZoom, e)) return
      e.preventDefault()
      const { view, size, setView } = latest.current
      const rect = el.getBoundingClientRect()
      const delta = e.deltaY * (e.deltaMode === 1 ? 40 : 1)
      // A trackpad pinch arrives as small wheel steps with ctrlKey.
      const zoom = view.zoom - delta / (e.ctrlKey ? 50 : 100)
      setView(zoomAround(view, zoom, [e.clientX - rect.left, e.clientY - rect.top], size))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [engine, wheelZoom])

  useEffect(() => {
    const el = engineRef.current
    if (!engine || !el) return
    let alive = true
    let mounted: EngineMap | undefined
    Promise.resolve(
      engine(el, latest.current.view, (v) => {
        latest.current.setView(v)
        fromPlatform.current = latest.current.view
      }),
    )
      .then((m) => {
        if (!alive) return m.destroy()
        mounted = m
        setPlatform(m)
      })
      .catch((error) => console.error(error))
    return () => {
      alive = false
      mounted?.destroy()
      setPlatform(null)
    }
  }, [engine])

  const [lng, lat] = view.center
  useEffect(() => {
    const v = { center: [lng, lat] as LngLat, zoom: view.zoom }
    // Moves the platform reported itself are not sent back to it.
    if (platform && !(fromPlatform.current && sameView(fromPlatform.current, v))) {
      platform.setView(v)
    }
  }, [platform, lng, lat, view.zoom])

  // Pointers on the map, by id, for drags and pinches.
  const pointers = useRef<Record<number, Point>>({})
  const local = (e: { clientX: number; clientY: number }): Point => {
    const rect = ref.current?.getBoundingClientRect()
    return [e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0)]
  }
  // Markers, popups and controls keep their own clicks.
  const onOverlay = (target: EventTarget) => (target as Element).closest?.('[data-map-overlay]')

  const gestures = engine
    ? {}
    : {
        onPointerDown: (e: PointerEvent<HTMLElement>) => {
          onPointerDown?.(e)
          if (onOverlay(e.target) || e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          pointers.current[e.pointerId] = local(e)
        },
        onPointerMove: (e: PointerEvent<HTMLElement>) => {
          onPointerMove?.(e)
          const before = pointers.current
          if (!before[e.pointerId]) return
          const { view, size } = latest.current
          const after = { ...before, [e.pointerId]: local(e) }
          pointers.current = after
          const [a, b] = Object.values(before)
          const [c, d] = Object.values(after)
          if (!a || !c) return
          if (!b || !d) {
            setView(pan(view, [c[0] - a[0], c[1] - a[1]], size))
            return
          }
          // Two fingers: move with their middle, zoom with their distance.
          const mid = (p: Point, q: Point): Point => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
          const dist = (p: Point, q: Point) => Math.hypot(p[0] - q[0], p[1] - q[1]) || 1
          const [m0, m1] = [mid(a, b), mid(c, d)]
          const moved = pan(view, [m1[0] - m0[0], m1[1] - m0[1]], size)
          setView(zoomAround(moved, view.zoom + Math.log2(dist(c, d) / dist(a, b)), m1, size))
        },
        onPointerUp: (e: PointerEvent<HTMLElement>) => {
          onPointerUp?.(e)
          delete pointers.current[e.pointerId]
        },
        onPointerCancel: (e: PointerEvent<HTMLElement>) => {
          onPointerCancel?.(e)
          delete pointers.current[e.pointerId]
        },
        onDoubleClick: (e: MouseEvent<HTMLElement>) => {
          onDoubleClick?.(e)
          if (onOverlay(e.target)) return
          const { view, size } = latest.current
          setView(zoomAround(view, Math.round(view.zoom) + (e.shiftKey ? -1 : 1), local(e), size))
        },
      }

  const keyDown = (e: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(e)
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
    const { view, size } = latest.current
    const step: Record<string, Point> = {
      ArrowLeft: [KEY_PAN, 0],
      ArrowRight: [-KEY_PAN, 0],
      ArrowUp: [0, KEY_PAN],
      ArrowDown: [0, -KEY_PAN],
    }
    const by = step[e.key]
    if (by) setView(pan(view, by, size))
    else if (e.key === '+' || e.key === '=') setView({ zoom: Math.round(view.zoom) + 1 })
    else if (e.key === '-' || e.key === '_') setView({ zoom: Math.round(view.zoom) - 1 })
    else return
    e.preventDefault()
  }

  const z = Math.round(Math.min(view.zoom, provider.maxZoom ?? 19))
  const value: MapContextValue = {
    ...view,
    size,
    project: engine ? (ll) => platform?.project(ll) ?? NAN : (ll) => project(ll, view, size),
    unproject: engine ? (p) => platform?.unproject(p) ?? NAN : (p) => unproject(p, view, size),
    setView,
  }

  return (
    <section
      ref={ref}
      aria-roledescription="map"
      aria-label="Map"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the map takes the keyboard to pan and zoom
      tabIndex={0}
      {...props}
      {...gestures}
      onKeyDown={keyDown}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: engine ? undefined : 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {engine ? (
        <div ref={engineRef} style={{ position: 'absolute', inset: 0 }} />
      ) : (
        size[0] > 0 &&
        visibleTiles(view, size, Math.max(0, z)).map((t) => (
          <img
            key={t.key}
            src={tileUrl(provider, t.z, t.x, t.y)}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: t.left,
              top: t.top,
              width: t.width,
              height: t.height,
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        ))
      )}
      <MapContext.Provider value={value}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{children}</div>
      </MapContext.Provider>
      {!engine && (
        <div
          data-map-attribution=""
          data-map-overlay=""
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            padding: '1px 5px',
            font: '11px/1.4 system-ui, sans-serif',
            color: '#333',
            background: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {provider.attribution}
        </div>
      )}
    </section>
  )
}
