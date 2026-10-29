'use client'

import { MapPinIcon } from 'lucide-react'
import * as React from 'react'
import { type LngLat, Map as MapView, useMap, type MapView as View } from '@/components/ui/map'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PickedLocation {
  lngLat: LngLat
  address?: string
}

export interface LocationPickerLabels {
  /** Names the map. */
  map: string
  /** While the address is looked up. */
  finding: string
  /** Read out with the address. */
  pickup: (address: string) => string
  hint: string
}

export const defaultLocationPickerLabels: LocationPickerLabels = {
  map: 'Pickup point',
  finding: 'Finding the address…',
  pickup: (address) => `Pickup at ${address}`,
  hint: 'Move the map to place the pin. The arrow keys move it too.',
}

/** Quiet this long after a move, the map is taken to have stopped. */
const SETTLE_MS = 350
const GLIDE_MS = 350

export interface LocationPickerProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'onChange'> {
  defaultCenter: LngLat
  /** Default 17. */
  defaultZoom?: number
  /** The address of a point, from your geocoder. */
  resolve: (lngLat: LngLat) => string | Promise<string>
  /** Moves a point to where a car can stop, such as the nearest curb, from your routing service. */
  snap?: (lngLat: LngLat) => LngLat | Promise<LngLat>
  onValueChange?: (location: PickedLocation) => void
  labels?: Partial<LocationPickerLabels>
}

/**
 * Set a pickup point the way ride apps do: drag the map under a fixed pin. While it moves the
 * pin lifts off its shadow; when it stops, it glides onto the point `snap` gives, drops, and the
 * address rolls in under it.
 */
function LocationPicker({
  defaultCenter,
  defaultZoom = 17,
  resolve,
  snap,
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: LocationPickerProps) {
  const labels = useLabels('location-picker', defaultLocationPickerLabels, labelsProp)
  const [address, setAddress] = React.useState<string | null>(null)
  const [moving, setMoving] = React.useState(false)
  const hintId = React.useId()

  return (
    <div
      data-slot="location-picker"
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      <div className="relative h-72 overflow-hidden rounded-xl border">
        <MapView
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          aria-label={labels.map}
          aria-describedby={hintId}
          className="absolute inset-0 h-full rounded-none border-0"
        >
          <Pin
            moving={moving}
            setMoving={setMoving}
            resolve={resolve}
            snap={snap}
            onAddress={(lngLat, next) => {
              setAddress(next)
              onValueChange?.({ lngLat, address: next ?? undefined })
            }}
          />
        </MapView>
      </div>
      <p aria-live="polite" className="flex min-h-6 items-center gap-1.5 text-sm">
        <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        {moving || address === null ? (
          <span className="text-muted-foreground">{labels.finding}</span>
        ) : (
          <span
            key={address}
            className="truncate font-medium animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
          >
            <span className="sr-only">{labels.pickup(address)}</span>
            <span aria-hidden="true">{address}</span>
          </span>
        )}
      </p>
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
    </div>
  )
}

function Pin({
  moving,
  setMoving,
  resolve,
  snap,
  onAddress,
}: {
  moving: boolean
  setMoving: (moving: boolean) => void
  resolve: LocationPickerProps['resolve']
  snap?: LocationPickerProps['snap']
  onAddress: (lngLat: LngLat, address: string | null) => void
}) {
  const map = useMap()
  const reduced = useReducedMotion()
  const [lng, lat] = map.center
  // Ours, not a person's: gliding onto the snapped point must not count as a new move.
  const gliding = React.useRef(false)
  const first = React.useRef(true)
  const latest = React.useRef({ map, resolve, snap, onAddress, setMoving })
  React.useEffect(() => {
    latest.current = { map, resolve, snap, onAddress, setMoving }
  })

  // Where the last snap left the map, so arriving there is not taken for a new move.
  const landed = React.useRef<LngLat | null>(null)

  React.useEffect(() => {
    if (gliding.current) return
    const at = landed.current
    if (at && Math.abs(at[0] - lng) < 1e-9 && Math.abs(at[1] - lat) < 1e-9) return
    const { setMoving: setMovingNow } = latest.current
    if (!first.current) setMovingNow(true)
    first.current = false
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const { map: m, snap: snapTo, resolve: find, onAddress: report } = latest.current
      const from: LngLat = [lng, lat]
      const to = snapTo ? await snapTo(from) : from
      if (cancelled) return
      if (to[0] !== from[0] || to[1] !== from[1]) {
        landed.current = to
        await glide(m.setView, from, to, reduced ? 0 : GLIDE_MS, gliding)
      }
      if (cancelled) return
      latest.current.setMoving(false)
      report(to, null)
      const address = await find(to)
      if (!cancelled) report(to, address)
    }, SETTLE_MS)
    return () => {
      // The glide moves the map too; that must not cancel the lookup waiting for it.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- the flag as it is now, not when the effect ran
      if (gliding.current) return
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [lng, lat, reduced])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
      {/* The shadow stays on the ground; the pin lifts off it while the map moves. */}
      <span
        className={cn(
          'absolute top-0 left-0 h-1.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 blur-[1px] transition-transform duration-(--duration-normal,200ms)',
          moving && 'scale-75 opacity-60',
        )}
      />
      <span
        className={cn(
          'absolute bottom-0 left-0 flex -translate-x-1/2 flex-col items-center transition-transform duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) motion-reduce:transition-none',
          moving ? '-translate-y-3' : 'translate-y-0',
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary shadow-md ring-4 ring-primary/20">
          <span className="size-2.5 rounded-full bg-primary-foreground" />
        </span>
        <span className="h-4 w-0.5 bg-primary" />
      </span>
    </div>
  )
}

/** Moves the map's center from one point to another over `ms`, eased. */
function glide(
  setView: (view: Partial<View>) => void,
  from: LngLat,
  to: LngLat,
  ms: number,
  flag: React.RefObject<boolean>,
) {
  return new Promise<void>((done) => {
    flag.current = true
    const start = performance.now()
    const frame = (now: number) => {
      const t = ms ? Math.min(1, (now - start) / ms) : 1
      const e = 1 - (1 - t) ** 3
      setView({ center: [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e] })
      if (t < 1) requestAnimationFrame(frame)
      else
        requestAnimationFrame(() => {
          flag.current = false
          done()
        })
    }
    requestAnimationFrame(frame)
  })
}

export { LocationPicker }
