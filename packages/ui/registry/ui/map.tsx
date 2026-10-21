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
import { MinusIcon, PlusIcon, XIcon } from 'lucide-react'
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

export interface ThemedMapProps extends MapProps {
  /**
   * Tint the tiles toward the theme: muted in light mode, inverted in dark mode. Only the tile
   * images, never markers or controls. `false` shows the original tiles. Default `true`.
   */
  themed?: boolean
}

/**
 * `<Map />` with theme defaults: a rounded, bordered box with a muted background while tiles
 * load, tiles tinted to the theme and the focus ring. 20rem tall unless you size it.
 */
function Map({ themed = true, className, ...props }: ThemedMapProps) {
  const t = useLabels('map', defaultMapLabels)
  return (
    <MapRoot
      data-slot="map"
      aria-label={t.map}
      className={cn(
        'h-80 w-full rounded-lg border bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        // The tiles sit a little see-through over bg-muted, so the theme's gray tints them.
        themed &&
          '[&_[data-map-tile]]:[filter:grayscale(0.7)_contrast(0.9)_opacity(0.85)] dark:[&_[data-map-tile]]:[filter:invert(1)_hue-rotate(180deg)_grayscale(0.7)_brightness(0.9)_contrast(0.9)_opacity(0.8)]',
        // The core styles the attribution inline, so the theme has to win with !important.
        '[&_[data-map-attribution]]:!bg-background/80 [&_[data-map-attribution]]:!text-muted-foreground [&_[data-map-attribution]]:!px-1.5 [&_[data-map-attribution]]:!text-[10px] [&_[data-map-attribution]]:rounded-tl-md [&_[data-map-attribution]]:backdrop-blur-sm [&_[data-map-attribution]_a]:underline [&_[data-map-attribution]_a]:underline-offset-2 [&_[data-map-attribution]_a]:hover:text-foreground',
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
        'relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-[min(0px,calc((100%_-_44px)/2))] pointer-coarse:after:inset-y-[min(0px,calc((100%_-_44px)/2))] rounded-full outline-none transition-transform duration-(--duration-fast,150ms) hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
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

/**
 * A popover card above a coordinate, with a tail pointing at it. Render it while it should be
 * open. `offset` defaults to 52, so the tail clears the default pin.
 */
function MapPopup({ className, closeLabel, offset = 52, ...props }: PopupProps) {
  const t = useLabels('map', defaultMapLabels)
  return (
    <Popup
      data-slot="map-popup"
      closeLabel={closeLabel ?? t.close}
      closeIcon={<XIcon />}
      offset={offset}
      className={cn(
        'w-max max-w-64 rounded-lg border bg-popover px-3 py-2 text-popover-foreground text-sm shadow-md',
        // The tail: a rotated square sharing the card's fill and border.
        'after:absolute after:top-full after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:-translate-y-[calc(50%-0.5px)] after:rotate-45 after:rounded-br-[2px] after:border-r after:border-b after:bg-popover',
        '[&_[data-map-popup-close]]:float-right [&_[data-map-popup-close]]:-mt-0.5 [&_[data-map-popup-close]]:-mr-1.5 [&_[data-map-popup-close]]:ml-2 [&_[data-map-popup-close]]:flex [&_[data-map-popup-close]]:size-6 [&_[data-map-popup-close]]:cursor-pointer [&_[data-map-popup-close]]:items-center [&_[data-map-popup-close]]:justify-center [&_[data-map-popup-close]]:rounded-md [&_[data-map-popup-close]_svg]:size-4 [&_[data-map-popup-close]]:text-muted-foreground [&_[data-map-popup-close]]:leading-none [&_[data-map-popup-close]]:outline-none [&_[data-map-popup-close]]:transition-[color,background-color,box-shadow] [&_[data-map-popup-close]]:hover:bg-accent [&_[data-map-popup-close]]:hover:text-foreground [&_[data-map-popup-close]]:focus-visible:ring-[3px] [&_[data-map-popup-close]]:focus-visible:ring-ring/50',
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
        'pointer-events-auto absolute top-2 right-2 flex flex-col gap-0.5 rounded-lg border bg-background/85 p-0.5 shadow-md backdrop-blur-md',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md motion-reduce:active:scale-100"
        aria-label={t.zoomIn}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) + 1 })}
      >
        <PlusIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md motion-reduce:active:scale-100"
        aria-label={t.zoomOut}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) - 1 })}
      >
        <MinusIcon />
      </Button>
    </div>
  )
}

export { Map, MapMarker, MapPopup, MapZoomControl }
