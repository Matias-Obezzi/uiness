import type { LngLat, MapView, Point } from './projection'

/**
 * A map platform drawn in place of the built-in tiles. It owns the panning and zooming, the
 * `<Map>` keeps the view and lays markers and popups over it with `project`.
 *
 * Called once per mount with the element to draw into, the starting view and a callback to
 * report every move made on the platform's side, while it happens.
 */
export type MapEngine = (
  container: HTMLElement,
  view: MapView,
  onMove: (view: MapView) => void,
) => EngineMap | Promise<EngineMap>

export interface EngineMap {
  /** Move to a view the `<Map>` asks for. */
  setView(view: MapView): void
  /** A coordinate to a point in CSS pixels from the container's top left corner. */
  project(lngLat: LngLat): Point
  /** A point of the container back to a coordinate. */
  unproject(point: Point): LngLat
  /** Tear the platform's map down. */
  destroy(): void
}

const scripts: Record<string, Promise<void>> = {}

/**
 * Loads a script once per `src`, resolving when it calls back the global named `callback`.
 * Both Google and Apple announce they are ready that way.
 */
export function loadScript(
  src: string,
  callback: string,
  attributes: Record<string, string> = {},
): Promise<void> {
  scripts[src] ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    ;(window as unknown as Record<string, () => void>)[callback] = () => resolve()
    script.src = src
    script.async = true
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value)
    script.onerror = () => {
      delete scripts[src]
      script.remove()
      reject(new Error(`Could not load ${src}`))
    }
    document.head.append(script)
  })
  return scripts[src]
}
