'use client'

import * as React from 'react'
import { Globe, type GlobeArc, type GlobeMarker } from '@/components/ui/globe'
import { NumberTicker } from '@/components/ui/number-ticker'
import { cn } from '@/lib/utils'

export interface GlobalRegion {
  name: string
  /** The figure for the region, like customers or servers. */
  value: number
  /** Text after the number, like `k` or `%`. */
  suffix?: string
  /** A short line under the name. */
  caption?: string
}

export interface Global01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  regions?: GlobalRegion[]
  /** Points on the globe, one per city or data center. */
  markers?: GlobeMarker[]
  /** Lines between places, like traffic or replication. */
  arcs?: GlobeArc[]
  /** Read by screen readers for the globe. */
  globeLabel?: string
}

const city = (lat: number, lng: number, label: string): GlobeMarker => ({ lat, lng, label })

const defaultMarkers: GlobeMarker[] = [
  city(-34.6, -58.4, 'Buenos Aires'),
  city(40.7, -74, 'New York'),
  city(37.8, -122.4, 'San Francisco'),
  city(51.5, -0.1, 'London'),
  city(52.5, 13.4, 'Berlin'),
  city(19.1, 72.9, 'Mumbai'),
  city(35.7, 139.7, 'Tokyo'),
  city(-33.9, 151.2, 'Sydney'),
  city(-23.5, -46.6, 'São Paulo'),
]

const defaultArcs: GlobeArc[] = [
  { from: [-34.6, -58.4], to: [40.7, -74] },
  { from: [40.7, -74], to: [51.5, -0.1] },
  { from: [51.5, -0.1], to: [19.1, 72.9] },
  { from: [19.1, 72.9], to: [35.7, 139.7] },
  { from: [35.7, 139.7], to: [-33.9, 151.2] },
]

const defaultRegions: GlobalRegion[] = [
  { name: 'Americas', value: 18, suffix: 'k', caption: 'teams across 22 countries' },
  { name: 'Europe', value: 11, suffix: 'k', caption: 'with data kept in Frankfurt' },
  { name: 'Asia Pacific', value: 7, suffix: 'k', caption: 'and the fastest growing' },
  { name: 'Regions served', value: 14, caption: 'each under 50 ms away' },
]

/**
 * Where the product is used: a globe that turns on its own, with a marker per city and arcs
 * between them, beside a list of figures per region that count up as they come into view.
 * The globe can be dragged. The columns stack when the container is narrow.
 */
function Global01({
  eyebrow = 'Everywhere',
  title = 'Planned in more time zones than we can keep track of',
  description = 'Teams on every continent but one plan their week with us. We are working on Antarctica.',
  regions = defaultRegions,
  markers = defaultMarkers,
  arcs = defaultArcs,
  globeLabel = 'A globe marking the cities where teams use the product',
  className,
  ...props
}: Global01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-global-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full overflow-hidden', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 @3xl:grid-cols-2 @3xl:py-24">
        <div>
          {eyebrow && <p className="mb-3 text-eyebrow text-primary uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
            {regions.map((region, i) => (
              <div
                key={region.name}
                className="flex flex-col gap-1 border-l-2 border-primary/40 pl-4"
              >
                <dt className="order-2 font-medium">{region.name}</dt>
                <dd className="order-1 font-semibold text-3xl tabular-nums tracking-tight">
                  <NumberTicker value={region.value} delay={i * 120} />
                  {region.suffix && <span className="text-muted-foreground">{region.suffix}</span>}
                </dd>
                {region.caption && (
                  <dd className="order-3 text-caption text-muted-foreground">{region.caption}</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md @3xl:max-w-none">
          <Globe
            markers={markers}
            arcs={arcs}
            aria-label={globeLabel}
            className="size-full text-primary"
          />
        </div>
      </div>
    </section>
  )
}

export { Global01 }
