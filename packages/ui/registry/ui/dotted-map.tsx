'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { landPoints } from '@/lib/world-map'

export interface DottedMapLabels {
  /** Accessible name for the SVG map. */
  map: string
}

export const defaultDottedMapLabels: DottedMapLabels = {
  map: 'World map',
}

export interface DottedMapMarker {
  lat: number
  lng: number
  size?: number
  color?: string
  label?: string
}

export interface DottedMapArc {
  from: [number, number]
  to: [number, number]
  color?: string
}

export interface DottedMapProps extends React.ComponentProps<'div'> {
  /** Sampling density step for land points in degrees. Default 2. */
  step?: number
  /** Color of dots. Default 'currentColor'. */
  dotColor?: string
  /** Diameter of dots in SVG coordinates. Default 2. */
  dotSize?: number
  /** Latitude crop bounds [minLat, maxLat]. Default [-60, 84]. */
  crop?: [number, number]
  /** Markers on the map. */
  markers?: DottedMapMarker[]
  /** Arcs connecting pairs of coordinates. */
  arcs?: DottedMapArc[]
}

/**
 * World map rendered in SVG with equirectangular projection.
 * All land dots are combined into a single path element to eliminate DOM overhead.
 */
function DottedMap({
  step = 2,
  dotColor,
  dotSize = 2,
  crop = [-60, 84],
  markers = [],
  arcs = [],
  className,
  ...props
}: DottedMapProps) {
  const labels = useLabels('dotted-map', defaultDottedMapLabels)
  const [minLat = -60, maxLat = 84] = crop

  // Generate a single SVG path combining all land dots using "M x y h0" commands
  const landPath = React.useMemo(() => {
    const points = landPoints(step, { minLat, maxLat })
    let d = ''
    for (const [lat, lng] of points) {
      const x = ((lng + 180) / 360) * 1000
      const y = ((maxLat - lat) / (maxLat - minLat)) * 500
      d += `M${x.toFixed(1)} ${y.toFixed(1)}h0 `
    }
    return d
  }, [step, minLat, maxLat])

  const projectCoords = React.useCallback(
    (lat: number, lng: number): [number, number] => {
      const x = ((lng + 180) / 360) * 1000
      const y = ((maxLat - lat) / (maxLat - minLat)) * 500
      return [x, y]
    },
    [minLat, maxLat],
  )

  return (
    <div
      data-slot="dotted-map"
      className={cn('relative w-full overflow-hidden select-none', className)}
      {...props}
    >
      <svg
        viewBox="0 0 1000 500"
        role="img"
        aria-label={props['aria-label'] || labels.map}
        className="h-auto w-full"
      >
        {/* All dots in a single path node */}
        <path
          d={landPath}
          stroke={dotColor || 'currentColor'}
          strokeWidth={dotSize}
          strokeLinecap="round"
          fill="none"
          className="opacity-70 transition-colors"
        />

        {/* Animated Arcs */}
        {arcs.map((arc, i) => {
          const [x1, y1] = projectCoords(arc.from[0], arc.from[1])
          const [x2, y2] = projectCoords(arc.to[0], arc.to[1])
          const mx = (x1 + x2) / 2
          const dist = Math.hypot(x2 - x1, y2 - y1)
          const my = (y1 + y2) / 2 - Math.min(90, dist * 0.22)
          const color = arc.color || '#3b82f6'

          return (
            <path
              // biome-ignore lint/suspicious/noArrayIndexKey: arcs are positional
              key={`arc-${i}`}
              d={`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className="[animation:dotted-map-arc_2s_linear_infinite] motion-reduce:animate-none opacity-85"
            />
          )
        })}

        {/* Markers with pulsing rings */}
        {markers.map((marker, i) => {
          const [x, y] = projectCoords(marker.lat, marker.lng)
          const color = marker.color || '#3b82f6'
          const size = marker.size || 3.5

          return (
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: markers are positional
              key={`marker-${i}`}
              transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
            >
              {marker.label && <title>{marker.label}</title>}
              {/* Outer pulsing ring */}
              <circle
                r={size * 2}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                className="animate-sonar motion-reduce:animate-none"
                style={{ '--sonar-scale': '2.2' } as React.CSSProperties}
              />
              {/* Center point */}
              <circle r={size} fill={color} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export { DottedMap }
