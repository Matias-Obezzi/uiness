/** `[longitude, latitude]` in degrees, the GeoJSON order. */
export type LngLat = [lng: number, lat: number]
/** `[x, y]` in CSS pixels from the top left corner of the map. */
export type Point = [x: number, y: number]

export interface MapView {
  center: LngLat
  zoom: number
}

export interface Tile {
  /** Tile coordinates, `x` already wrapped around the world. */
  x: number
  y: number
  z: number
  /** Where it goes in the map, rounded so neighbours meet without seams. */
  left: number
  top: number
  width: number
  height: number
  key: string
}

export const TILE_SIZE = 256
/** The latitude where Web Mercator turns the world into a square. */
export const MAX_LAT = 85.0511287798

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const worldSize = (zoom: number) => TILE_SIZE * 2 ** zoom

/** Longitude into [-180, 180), latitude into what Web Mercator can draw. */
export function normalize([lng, lat]: LngLat): LngLat {
  return [((((lng + 180) % 360) + 360) % 360) - 180, clamp(lat, -MAX_LAT, MAX_LAT)]
}

/** A coordinate to pixels of the whole world at `zoom`, from its top left corner. */
export function lngLatToWorld([lng, lat]: LngLat, zoom: number): Point {
  const size = worldSize(zoom)
  const sin = Math.sin((clamp(lat, -MAX_LAT, MAX_LAT) * Math.PI) / 180)
  return [
    ((lng + 180) / 360) * size,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  ]
}

/** World pixels at `zoom` back to a coordinate. */
export function worldToLngLat([x, y]: Point, zoom: number): LngLat {
  const size = worldSize(zoom)
  const n = Math.PI - (2 * Math.PI * y) / size
  return [(x / size) * 360 - 180, (180 / Math.PI) * Math.atan(Math.sinh(n))]
}

/** A coordinate to a point of a map of `size` showing `view`, on the copy of the world nearest the center. */
export function project(lngLat: LngLat, view: MapView, size: Point): Point {
  const [cx, cy] = lngLatToWorld(view.center, view.zoom)
  const [x, y] = lngLatToWorld(lngLat, view.zoom)
  const world = worldSize(view.zoom)
  const dx = x - cx - world * Math.round((x - cx) / world)
  return [dx + size[0] / 2, y - cy + size[1] / 2]
}

/** A point of the map back to a coordinate. */
export function unproject(point: Point, view: MapView, size: Point): LngLat {
  const [cx, cy] = lngLatToWorld(view.center, view.zoom)
  return normalize(
    worldToLngLat([cx + point[0] - size[0] / 2, cy + point[1] - size[1] / 2], view.zoom),
  )
}

/** The view moved by `delta` pixels, the way a drag moves it. */
export function pan(view: MapView, delta: Point, size: Point): MapView {
  return {
    center: unproject([size[0] / 2 - delta[0], size[1] / 2 - delta[1]], view, size),
    zoom: view.zoom,
  }
}

/** The view at `zoom` that keeps the coordinate under `point` where it is. */
export function zoomAround(view: MapView, zoom: number, point: Point, size: Point): MapView {
  const [x, y] = lngLatToWorld(unproject(point, view, size), zoom)
  return {
    center: normalize(
      worldToLngLat([x - point[0] + size[0] / 2, y - point[1] + size[1] / 2], zoom),
    ),
    zoom,
  }
}

/** The tiles of zoom level `z` that cover a map of `size` showing `view`, scaled to its fractional zoom. */
export function visibleTiles(view: MapView, size: Point, z: number): Tile[] {
  const scale = 2 ** (view.zoom - z)
  const [cx, cy] = lngLatToWorld(view.center, z)
  const count = 2 ** z
  const left = (x: number) => Math.round((x * TILE_SIZE - cx) * scale + size[0] / 2)
  const top = (y: number) => Math.round((y * TILE_SIZE - cy) * scale + size[1] / 2)
  const span = (px: number, c: number): Point => [
    Math.floor((c - px / 2 / scale) / TILE_SIZE),
    Math.floor((c + px / 2 / scale) / TILE_SIZE),
  ]
  const [x0, x1] = span(size[0], cx)
  const [y0, y1] = span(size[1], cy)
  const tiles: Tile[] = []
  for (let y = Math.max(0, y0); y <= Math.min(count - 1, y1); y++) {
    for (let x = x0; x <= x1; x++) {
      tiles.push({
        x: ((x % count) + count) % count,
        y,
        z,
        left: left(x),
        top: top(y),
        width: left(x + 1) - left(x),
        height: top(y + 1) - top(y),
        key: `${z}/${x}/${y}`,
      })
    }
  }
  return tiles
}
