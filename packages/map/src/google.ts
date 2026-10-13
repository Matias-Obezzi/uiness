import { type EngineMap, loadScript, type MapEngine } from './engine'
import type { MapView } from './projection'

// biome-ignore lint/suspicious/noExplicitAny: the SDK ships no types without a dependency
type Sdk = any

export interface GoogleMapsOptions {
  /** Maps JavaScript API key. */
  apiKey: string
  /** Extra `google.maps.MapOptions`, such as `mapId` or `disableDefaultUI`. */
  options?: Record<string, unknown>
}

/**
 * Draws the map with Google Maps (Maps JavaScript API), loading it on first use.
 * Create it once, outside the component, so the map is not mounted again on every render.
 */
export function googleMaps({ apiKey, options }: GoogleMapsOptions): MapEngine {
  return async (container, view, onMove) => {
    await loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=__uinessGoogleMaps`,
      '__uinessGoogleMaps',
    )
    const maps: Sdk = (window as Sdk).google.maps
    const toLatLng = ([lng, lat]: [number, number]) => ({ lat, lng })
    const map = new maps.Map(container, {
      center: toLatLng(view.center),
      zoom: view.zoom,
      ...options,
    })
    const current = (): MapView => {
      const center = map.getCenter()
      return { center: [center.lng(), center.lat()], zoom: map.getZoom() }
    }
    // An empty overlay, only for the projection between coordinates and container pixels.
    const overlay = new maps.OverlayView()
    overlay.onAdd = () => {}
    overlay.onRemove = () => {}
    const ready = new Promise<void>((resolve) => {
      // Google calls draw whenever the projection changes: every pan and zoom.
      overlay.draw = () => {
        resolve()
        onMove(current())
      }
    })
    overlay.setMap(map)
    const listener = map.addListener('bounds_changed', () => onMove(current()))
    await ready

    const engine: EngineMap = {
      setView: ({ center, zoom }) => {
        map.setCenter(toLatLng(center))
        map.setZoom(zoom)
      },
      project: (lngLat) => {
        const p = overlay.getProjection().fromLatLngToContainerPixel(toLatLng(lngLat))
        return [p.x, p.y]
      },
      unproject: ([x, y]) => {
        const ll = overlay.getProjection().fromContainerPixelToLatLng(new maps.Point(x, y))
        return [ll.lng(), ll.lat()]
      },
      destroy: () => {
        listener.remove()
        overlay.setMap(null)
        maps.event.clearInstanceListeners(map)
        container.replaceChildren()
      },
    }
    return engine
  }
}
