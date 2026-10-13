import type { ReactNode } from 'react'

/** Any XYZ raster tile service. */
export interface TileProvider {
  /** Template with `{z}`, `{x}`, `{y}` and optionally `{s}` for a subdomain. */
  url: string
  /** Credit the service asks for, shown in the corner of the map. */
  attribution: ReactNode
  /** Deepest zoom level it serves. Default 19. */
  maxZoom?: number
  /** Values for `{s}`, spread across tiles so the browser fetches in parallel. */
  subdomains?: string[]
}

const link = (href: string, text: string) => (
  <a href={href} target="_blank" rel="noreferrer">
    {text}
  </a>
)

const osmCredit = (
  <>© {link('https://www.openstreetmap.org/copyright', 'OpenStreetMap')} contributors</>
)

export const providers = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: osmCredit,
    maxZoom: 19,
  },
  // CARTO watermarks its tiles without `?key=` appended to the url.
  cartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: (
      <>
        {osmCredit} © {link('https://carto.com/attributions', 'CARTO')}
      </>
    ),
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: (
      <>
        {osmCredit} © {link('https://carto.com/attributions', 'CARTO')}
      </>
    ),
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  openTopoMap: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: (
      <>
        {osmCredit}, SRTM | © {link('https://opentopomap.org', 'OpenTopoMap')} (CC-BY-SA)
      </>
    ),
    maxZoom: 17,
    subdomains: ['a', 'b', 'c'],
  },
} satisfies Record<string, TileProvider>

/** The address of one tile. */
export function tileUrl(provider: TileProvider, z: number, x: number, y: number): string {
  const subdomains = provider.subdomains ?? []
  return provider.url
    .replace('{s}', subdomains[(x + y) % subdomains.length] ?? '')
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
}
