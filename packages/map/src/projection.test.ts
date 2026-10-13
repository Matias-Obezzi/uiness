import {
  lngLatToWorld,
  normalize,
  pan,
  project,
  unproject,
  visibleTiles,
  worldToLngLat,
  zoomAround,
} from './projection'
import { providers, tileUrl } from './providers'

const size: [number, number] = [800, 600]
const close = (a: number[], b: number[]) => {
  for (const [i, n] of a.entries()) expect(n).toBeCloseTo(b[i] ?? 0, 6)
}

describe('projection', () => {
  it('puts the world corners and center where Web Mercator does', () => {
    close(lngLatToWorld([0, 0], 0), [128, 128])
    close(lngLatToWorld([-180, 85.0511287798], 1), [0, 0])
    close(lngLatToWorld([180, -85.0511287798], 1), [512, 512])
  })

  it('round trips coordinates', () => {
    close(worldToLngLat(lngLatToWorld([-58.38, -34.6], 12.3), 12.3), [-58.38, -34.6])
    const view = { center: [2.35, 48.85] as [number, number], zoom: 10.5 }
    close(unproject(project([2.4, 48.8], view, size), view, size), [2.4, 48.8])
    close(project(view.center, view, size), [400, 300])
  })

  it('wraps longitude and draws markers on the copy nearest the center', () => {
    expect(normalize([190, 0])[0]).toBeCloseTo(-170)
    expect(normalize([0, 89])[1]).toBeCloseTo(85.0511287798)
    const view = { center: [179, 0] as [number, number], zoom: 3 }
    expect(project([-179, 0], view, size)[0]).toBeGreaterThan(400)
  })

  it('pans and zooms around a point', () => {
    const view = { center: [0, 0] as [number, number], zoom: 4 }
    close(project(view.center, pan(view, [100, 0], size), size), [500, 300])
    const point: [number, number] = [600, 100]
    const under = unproject(point, view, size)
    close(project(under, zoomAround(view, 6, point, size), size), point)
  })

  it('covers the map with tiles that meet', () => {
    const tiles = visibleTiles({ center: [0, 0], zoom: 2.5 }, size, 3)
    expect(tiles.every((t) => t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8)).toBe(true)
    const row = tiles.filter((t) => t.y === 4).sort((a, b) => a.left - b.left)
    expect(row[0]?.left).toBeLessThanOrEqual(0)
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1]
      expect(row[i]?.left).toBe((prev?.left ?? 0) + (prev?.width ?? 0))
    }
    expect(tileUrl(providers.cartoDark, 3, 5, 2)).toBe(
      'https://d.basemaps.cartocdn.com/dark_all/3/5/2.png',
    )
  })
})
