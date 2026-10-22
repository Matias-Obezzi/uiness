# @uiness/map

## 0.1.1

### Patch Changes

- 93ad042: A popup near a side of the map slides inward to stay whole, 8px from the edge, and is never wider than the map. Before, a popup over a marker near the edge was cut off.

## 0.1.0

### Minor Changes

- b150583: Initial release: `<Map>` draws OpenStreetMap or any XYZ raster tiles in Web Mercator with no dependencies, with drag, touch, pinch, double click and keyboard panning and zooming, and a wheel that scrolls the page and zooms with Ctrl or ⌘ held (`wheelZoom`, like `@uiness/three`), controlled or uncontrolled `center` and `zoom`, and the provider's attribution in the corner. Ships `<Marker>`, `<Popup>`, `<ZoomControl>`, `useMap()` with `project` and `unproject`, presets for OpenStreetMap, CARTO light and dark and OpenTopoMap, and `googleMaps()` and `appleMaps()` engines that put the same components on Google Maps or Apple Maps, loading their SDK on demand.
