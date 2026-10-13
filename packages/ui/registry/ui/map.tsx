'use client'

import {
  type MapProps,
  Map as MapRoot,
  Marker,
  type MarkerProps,
  Popup,
  type PopupProps,
  useMap,
} from '@uiness/map'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type {
  EngineMap,
  LngLat,
  MapContextValue,
  MapEngine,
  MapProps,
  MapView,
  MarkerProps,
  Point,
  PopupProps,
  TileProvider,
} from '@uiness/map'
export { appleMaps, googleMaps, providers, useMap } from '@uiness/map'

export interface MapLabels {
  /** Accessible name of the map. */
  map: string
  zoomIn: string
  zoomOut: string
  /** The close button of a popup. */
  close: string
}

export const defaultMapLabels: MapLabels = {
  map: 'Map',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  close: 'Close',
}

/**
 * `<Map />` with theme defaults: a rounded, bordered box with a muted background while tiles
 * load and the focus ring. 20rem tall unless you size it.
 */
function Map({ className, ...props }: MapProps) {
  const t = useLabels('map', defaultMapLabels)
  return (
    <MapRoot
      data-slot="map"
      aria-label={t.map}
      className={cn(
        'h-80 w-full rounded-lg border bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_[data-map-attribution]_a]:underline',
        className,
      )}
      {...props}
    />
  )
}

/** A pin in the primary color, or whatever you pass as children. */
function MapMarker({ children, className, ...props }: MarkerProps) {
  return (
    <Marker
      className={cn(
        'rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    >
      {children ?? (
        <svg
          width="28"
          height="40"
          viewBox="0 0 28 40"
          aria-hidden="true"
          className="block drop-shadow-md"
        >
          <path
            d="M14 1C6.8 1 1 6.8 1 14c0 9.8 13 25 13 25s13-15.2 13-25C27 6.8 21.2 1 14 1Z"
            className="fill-primary stroke-primary-foreground"
            strokeWidth="2"
          />
          <circle cx="14" cy="14" r="4.5" className="fill-primary-foreground" />
        </svg>
      )}
    </Marker>
  )
}

/** A popover card above a coordinate. Render it while it should be open. */
function MapPopup({ className, closeLabel, ...props }: PopupProps) {
  const t = useLabels('map', defaultMapLabels)
  return (
    <Popup
      data-slot="map-popup"
      closeLabel={closeLabel ?? t.close}
      className={cn(
        'w-max max-w-64 rounded-md border bg-popover px-3 py-2 text-popover-foreground text-sm shadow-md',
        '[&_[data-map-popup-close]]:float-right [&_[data-map-popup-close]]:-mr-1 [&_[data-map-popup-close]]:ml-2 [&_[data-map-popup-close]]:cursor-pointer [&_[data-map-popup-close]]:text-muted-foreground [&_[data-map-popup-close]]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

/** Zoom buttons in the top right corner of the map. */
function MapZoomControl({ className }: { className?: string }) {
  const t = useLabels('map', defaultMapLabels)
  const map = useMap()
  return (
    <div
      data-map-overlay=""
      data-slot="map-zoom-control"
      className={cn(
        'pointer-events-auto absolute top-2 right-2 flex flex-col overflow-hidden rounded-md border bg-background shadow-xs',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none"
        aria-label={t.zoomIn}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) + 1 })}
      >
        <PlusIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-none border-t"
        aria-label={t.zoomOut}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) - 1 })}
      >
        <MinusIcon />
      </Button>
    </div>
  )
}

export { Map, MapMarker, MapPopup, MapZoomControl }
