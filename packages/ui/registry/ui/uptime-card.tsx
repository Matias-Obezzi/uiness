'use client'

import * as React from 'react'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type UptimeStatus = 'up' | 'degraded' | 'down'

export interface UptimeIncident {
  title: string
  /** When, as shown, like "14:02 UTC". */
  time: string
  note?: string
}

export interface UptimeDay {
  /** ISO date, like "2026-10-29". */
  date: string
  status: UptimeStatus
  incidents?: UptimeIncident[]
}

export interface UptimeService {
  name: string
  /** Oldest first, usually 90. */
  days: UptimeDay[]
}

export interface UptimeCardLabels {
  up: string
  degraded: string
  down: string
  /** The share of days without an outage, formatted. */
  uptime: (share: string) => string
  /** A day's bar, read out. */
  day: (date: string, status: string, incidents: number) => string
  noIncidents: string
  /** The ends of the strip. */
  ago: (days: number) => string
  today: string
}

export const defaultUptimeCardLabels: UptimeCardLabels = {
  up: 'Operational',
  degraded: 'Degraded',
  down: 'Outage',
  uptime: (share) => `${share} uptime`,
  day: (date, status, incidents) =>
    `${date}, ${status}${incidents ? `, ${incidents} incident${incidents === 1 ? '' : 's'}` : ''}`,
  noIncidents: 'No incidents this day.',
  ago: (days) => `${days} days ago`,
  today: 'Today',
}

const BAR: Record<UptimeStatus, string> = {
  up: 'bg-emerald-500',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
}

/** The share of days without an outage, 0 to 1. A degraded day still counts as up. */
export function uptimeOf(days: UptimeDay[]) {
  return days.length ? days.filter((d) => d.status !== 'down').length / days.length : 1
}

export interface UptimeCardProps extends React.ComponentProps<'div'> {
  services: UptimeService[]
  labels?: Partial<UptimeCardLabels>
}

/**
 * A status page card: a strip of days per service, coloured by how each went, that swell
 * under the pointer like a magnifier. Pressing a day opens its incident log under the strip.
 * Each strip is one stop for the keyboard; the arrows move along the days.
 */
function UptimeCard({ services, labels: labelsProp, className, ...props }: UptimeCardProps) {
  const labels = useLabels('uptime-card', defaultUptimeCardLabels, labelsProp)
  const locale = useLocale()
  const [open, setOpen] = React.useState<{ service: number; day: number } | null>(null)
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })

  return (
    <div
      data-slot="uptime-card"
      className={cn('flex w-full max-w-xl flex-col gap-6 rounded-xl border bg-card p-5', className)}
      {...props}
    >
      {services.map((service, s) => {
        const day = open?.service === s ? service.days[open.day] : undefined
        return (
          <div key={service.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{service.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {labels.uptime(percent.format(uptimeOf(service.days)))}
              </span>
            </div>
            <Strip
              service={service}
              selected={open?.service === s ? open.day : null}
              onSelect={(d) =>
                setOpen(open?.service === s && open.day === d ? null : { service: s, day: d })
              }
              describe={(d) =>
                labels.day(
                  date.format(new Date(d.date)),
                  labels[d.status],
                  d.incidents?.length ?? 0,
                )
              }
            />
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{labels.ago(service.days.length)}</span>
              <span>{labels.today}</span>
            </div>
            {day && (
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <span className={cn('size-2 rounded-full', BAR[day.status])} />
                  {date.format(new Date(day.date))} · {labels[day.status]}
                </div>
                {day.incidents?.length ? (
                  <ol className="flex flex-col gap-2">
                    {day.incidents.map((incident) => (
                      <li key={`${incident.time}${incident.title}`}>
                        <span className="text-muted-foreground tabular-nums">{incident.time}</span>{' '}
                        {incident.title}
                        {incident.note && <p className="text-muted-foreground">{incident.note}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">{labels.noIncidents}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Strip({
  service,
  selected,
  onSelect,
  describe,
}: {
  service: UptimeService
  selected: number | null
  onSelect: (day: number) => void
  describe: (day: UptimeDay) => string
}) {
  const strip = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(service.days.length - 1)

  // The magnifier: bars near the pointer grow taller, falling off with distance.
  const swell = (x: number | null) => {
    const bars = strip.current?.children
    if (!bars) return
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLElement
      const r = bar.getBoundingClientRect()
      const d = x === null ? Infinity : Math.abs(r.left + r.width / 2 - x) / 14
      bar.style.setProperty('--swell', String(1 + 0.6 * Math.exp(-d * d)))
    }
  }

  const move = (to: number) => {
    const next = Math.max(0, Math.min(service.days.length - 1, to))
    setActive(next)
    ;(strip.current?.children[next] as HTMLElement | undefined)?.focus()
  }

  return (
    <div
      ref={strip}
      className="flex h-8 items-end gap-px"
      onPointerMove={(e) => e.pointerType === 'mouse' && swell(e.clientX)}
      onPointerLeave={() => swell(null)}
    >
      {service.days.map((day, i) => (
        <button
          key={day.date}
          type="button"
          tabIndex={i === active ? 0 : -1}
          aria-label={describe(day)}
          aria-expanded={selected === i}
          onClick={() => {
            setActive(i)
            onSelect(i)
          }}
          onKeyDown={(e) => {
            const step = { ArrowLeft: -1, ArrowRight: 1, Home: -i, End: service.days.length }[e.key]
            if (step === undefined) return
            e.preventDefault()
            move(i + step)
          }}
          className={cn(
            'h-6 min-w-0 flex-1 origin-bottom rounded-[2px] outline-none [scale:1_var(--swell,1)] transition-[scale,opacity] duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            BAR[day.status],
            selected === i && 'ring-2 ring-foreground ring-offset-1 ring-offset-card',
          )}
        />
      ))}
    </div>
  )
}

export { UptimeCard }
