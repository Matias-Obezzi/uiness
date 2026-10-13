<div align="center">

<img src="https://raw.githubusercontent.com/Matias-Obezzi/uiness/main/assets/logo.png" alt="" width="72" height="72" />

</div>

# @uiness/map

Maps for React with zero runtime dependencies. OpenStreetMap by default, any XYZ tile service by passing an object, and the same `<Map>`, `<Marker>` and `<Popup>` on Google Maps or Apple Maps.

[Documentation](https://uiness.vercel.app/docs/map) · [Registry](https://uiness.vercel.app/docs/installation) · [GitHub](https://github.com/Matias-Obezzi/uiness)

- Drag or touch to pan, pinch to zoom, the wheel zooms with Ctrl or ⌘ held and scrolls the page otherwise, double click to zoom in (Shift to zoom out).
- Keyboard when focused: arrows pan, `+` and `-` zoom.
- Controlled or uncontrolled `center` and `zoom`.
- The tile service's attribution is shown in the corner, as OpenStreetMap requires.
- `useMap()` gives `project` and `unproject`, to lay anything over the map.

```bash
pnpm add @uiness/map
```

## Usage

```tsx
import { Map, Marker, Popup, ZoomControl } from '@uiness/map'

function Office() {
  const [open, setOpen] = useState(false)
  return (
    <Map defaultCenter={[-58.3816, -34.6037]} defaultZoom={13} style={{ height: 400 }}>
      <Marker lngLat={[-58.3816, -34.6037]} label="Office" onClick={() => setOpen((o) => !o)} />
      {open && (
        <Popup lngLat={[-58.3816, -34.6037]} onClose={() => setOpen(false)}>
          We are here
        </Popup>
      )}
      <ZoomControl />
    </Map>
  )
}
```

Coordinates are `[lng, lat]`, the GeoJSON order. The map fills its box and has no height of its own, so give it one.

### `<Map>` props

| Prop | Default | Description |
| --- | --- | --- |
| `center`, `zoom` | | Controlled view. Fractional zoom levels are fine. |
| `defaultCenter`, `defaultZoom` | `[0, 20]`, `2` | Starting view when uncontrolled. |
| `onViewChange` | | `({ center, zoom }) => void` on every move. |
| `minZoom`, `maxZoom` | `0`, the provider's | Zoom range. |
| `wheelZoom` | `'modifier'` | When the wheel zooms: `'modifier'` (Ctrl, ⌘ or a trackpad pinch), `'always'` or `'never'`. Tiles only. |
| `provider` | `providers.osm` | Where the tiles come from. |
| `engine` | | Draw with another platform instead, see below. |

Every other prop goes to the `<section>` that holds the map. Its accessible name is `"Map"` unless you pass `aria-label`.

`<Marker lngLat>` takes any children as the pin, its bottom center on the coordinate. With `onClick` it is a button, so give it a `label`. `<Popup lngLat>` is rendered while it should be open; `onClose` adds a close button and closes on Escape; `closeIcon` replaces its default `×`. `<Popup>` and `<ZoomControl>` drop their default look when you pass a `className`.

### Tile providers

```tsx
import { providers } from '@uiness/map'

<Map provider={providers.cartoDark} />

<Map
  provider={{
    url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    attribution: '© Example',
    maxZoom: 18,
    subdomains: ['a', 'b'], // for {s} in the url
  }}
/>
```

Presets: `osm`, `cartoLight`, `cartoDark`, `openTopoMap`. CARTO needs a key: `{ ...providers.cartoDark, url: providers.cartoDark.url + '?key=YOUR_KEY' }`. The public OpenStreetMap tile servers are for light use only, read their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before you ship.

### Your own overlays

```tsx
import { useMap } from '@uiness/map'

function Label({ lngLat, children }) {
  const map = useMap()
  const [x, y] = map.project(lngLat)
  return <div style={{ position: 'absolute', left: x, top: y }}>{children}</div>
}
```

`useMap()` also returns `center`, `zoom`, `size` and `setView({ center?, zoom? })`.

### Google Maps and Apple Maps

```tsx
import { appleMaps, googleMaps, Map, Marker } from '@uiness/map'

// Once, outside the component: a new engine mounts a new map.
const google = googleMaps({ apiKey: 'YOUR_KEY' })
const apple = appleMaps({ token: 'YOUR_MAPKIT_TOKEN' })

<Map engine={google} defaultCenter={[2.35, 48.85]} defaultZoom={12}>
  <Marker lngLat={[2.35, 48.85]} />
</Map>
```

Each engine loads the platform's official script the first time a map mounts, from your key or token, and tears its map down on unmount. `googleMaps()` sets `gestureHandling: 'cooperative'`, the same Ctrl or ⌘ rule as `wheelZoom`, pass `options: { gestureHandling: 'greedy' }` to always zoom. MapKit JS has no equivalent, and `wheelZoom` is not read when an `engine` is set. The platform does the panning and zooming; markers, popups and controls are the same React elements, placed with the platform's projection.

### Writing an engine

An engine is a function that draws into an element and returns four methods:

```ts
import type { MapEngine } from '@uiness/map'

const myEngine: MapEngine = async (container, view, onMove) => {
  const map = new SomeSdk.Map(container, { center: view.center, zoom: view.zoom })
  map.on('move', () => onMove({ center: map.getCenter(), zoom: map.getZoom() }))
  return {
    setView: ({ center, zoom }) => map.jumpTo({ center, zoom }),
    project: (lngLat) => map.project(lngLat), // [x, y] from the container's top left
    unproject: (point) => map.unproject(point), // [lng, lat]
    destroy: () => map.remove(),
  }
}
```

Call `onMove` on every move while it happens, so markers follow. `loadScript(src, callbackName, attributes?)` is exported to load an SDK once.

## License

MIT

## With the uiness registry

Prefer components that already follow your theme? uiness is also a registry for the shadcn CLI. Register it once in `components.json`:

```json
{
  "registries": {
    "@uiness": "https://uiness.vercel.app/r/{name}.json"
  }
}
```

Then add the item:

```bash
npx shadcn@latest add @uiness/map
```

The `map` item installs this package and a thin wrapper in `components/ui` that connects it to your theme tokens.
