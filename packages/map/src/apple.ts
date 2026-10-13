import { type EngineMap, loadScript, type MapEngine } from './engine'
import { type LngLat, type MapView, TILE_SIZE, unproject } from './projection'

// biome-ignore lint/suspicious/noExplicitAny: the SDK ships no types without a dependency
type Sdk = any

export interface AppleMapsOptions {
  /** MapKit JS token, from your Apple Developer account. */
  token: string
  /** Extra `mapkit.Map` constructor options, such as `colorScheme`. */
  options?: Record<string, unknown>
}

/**
 * Draws the map with Apple Maps (MapKit JS), loading it on first use.
 * Create it once, outside the component, so the map is not mounted again on every render.
 */
export function appleMaps({ token, options }: AppleMapsOptions): MapEngine {
  return async (container, view, onMove) => {
    await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js', '__uinessMapKit', {
      crossorigin: 'anonymous',
      'data-callback': '__uinessMapKit',
      'data-libraries': 'map',
      'data-initial-token': token,
    })
    const mapkit: Sdk = (window as Sdk).mapkit
    const map = new mapkit.Map(container, options)

    // MapKit speaks in regions, not zoom levels: the longitude span the container's width shows.
    const span = (zoom: number) => (360 * container.clientWidth) / (TILE_SIZE * 2 ** zoom)
    const current = (): MapView => {
      const { center, span: s } = map.region
      return {
        center: [center.longitude, center.latitude],
        zoom: Math.log2((360 * container.clientWidth) / (TILE_SIZE * s.longitudeDelta)),
      }
    }
    const setView = (next: MapView) => {
      const [lng, lat] = next.center
      const size: [number, number] = [container.clientWidth, container.clientHeight]
      const lngDelta = span(next.zoom)
      const latDelta = unproject([0, 0], next, size)[1] - unproject([0, size[1]], next, size)[1]
      map.setRegionAnimated(
        new mapkit.CoordinateRegion(
          new mapkit.Coordinate(lat, lng),
          new mapkit.CoordinateSpan(latDelta, lngDelta),
        ),
        false,
      )
    }
    setView(view)

    // MapKit only says when a move starts and ends, so follow it frame by frame in between.
    let frame = 0
    const follow = () => {
      onMove(current())
      frame = requestAnimationFrame(follow)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      follow()
    }
    const end = () => {
      cancelAnimationFrame(frame)
      onMove(current())
    }
    map.addEventListener('region-change-start', start)
    map.addEventListener('region-change-end', end)

    const offset = (): [number, number] => {
      const rect = container.getBoundingClientRect()
      return [rect.left + window.scrollX, rect.top + window.scrollY]
    }
    const engine: EngineMap = {
      setView,
      project: ([lng, lat]) => {
        const p = map.convertCoordinateToPointOnPage(new mapkit.Coordinate(lat, lng))
        const [x, y] = offset()
        return [p.x - x, p.y - y]
      },
      unproject: ([px, py]) => {
        const [x, y] = offset()
        const c = map.convertPointOnPageToCoordinate(new DOMPoint(px + x, py + y))
        return [c.longitude, c.latitude] as LngLat
      },
      destroy: () => {
        cancelAnimationFrame(frame)
        map.removeEventListener('region-change-start', start)
        map.removeEventListener('region-change-end', end)
        map.destroy()
      },
    }
    return engine
  }
}
