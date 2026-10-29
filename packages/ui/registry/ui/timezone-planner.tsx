'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PlannerPerson {
  name: string
  /** IANA zone, such as `Asia/Tokyo`. */
  timeZone: string
  /** Working hours in their own time. Default 9 to 18. */
  workStart?: number
  workEnd?: number
}

export type DayPart = 'work' | 'awake' | 'asleep'

export interface TimezonePlannerLabels {
  /** Names the dial. */
  dial: string
  /** The handle's value. */
  meeting: (time: string) => string
  parts: Record<DayPart, string>
  /** Under the list once every one is working. */
  allWorking: string
  /** How many of them are outside working hours. */
  outside: (count: number) => string
}

export const defaultTimezonePlannerLabels: TimezonePlannerLabels = {
  dial: 'Meeting time',
  meeting: (time) => `Meeting at ${time}`,
  parts: { work: 'Working', awake: 'Off work', asleep: 'Asleep' },
  allWorking: 'Everyone is in working hours.',
  outside: (count) =>
    count === 1
      ? '1 person is outside working hours.'
      : `${count} people are outside working hours.`,
}

/** Minutes a zone is ahead of UTC on a given day. */
export function offsetOf(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const local = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return Math.round((local - Math.floor(date.getTime() / 60000) * 60000) / 60000)
}

/** What a local hour is for someone: work, awake off work, or asleep (11pm to 7am). */
export function dayPart(hour: number, workStart = 9, workEnd = 18): DayPart {
  const h = ((hour % 24) + 24) % 24
  if (h >= workStart && h < workEnd) return 'work'
  if (h >= 23 || h < 7) return 'asleep'
  return 'awake'
}

const partColor: Record<DayPart, string> = {
  work: 'fill-emerald-500/80',
  awake: 'fill-sky-400/40',
  asleep: 'fill-muted-foreground/25',
}

const STEP = 15
const SIZE = 280
const C = SIZE / 2

/** A ring segment from one share of the day to another, between two radii. */
function arc(from: number, to: number, r1: number, r2: number) {
  const point = (share: number, r: number) => {
    const a = share * 2 * Math.PI - Math.PI / 2
    return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`
  }
  const large = to - from > 0.5 ? 1 : 0
  return `M ${point(from, r2)} A ${r2} ${r2} 0 ${large} 1 ${point(to, r2)} L ${point(to, r1)} A ${r1} ${r1} 0 ${large} 0 ${point(from, r1)} Z`
}

export interface TimezonePlannerProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** The first is the one planning: the dial is in their time. */
  people: PlannerPerson[]
  /** The meeting, in minutes from midnight in the first person's time. */
  value?: number
  defaultValue?: number
  onValueChange?: (minutes: number) => void
  /** The day planned, for daylight saving. Default today. */
  date?: Date
  locale?: string
  labels?: Partial<TimezonePlannerLabels>
}

/**
 * Find a meeting time across time zones. Each ring of the 24-hour dial is someone's day, with
 * their working hours in green and their night in grey; turn the meeting round the dial and the
 * list says what time it is for each of them. On the keyboard the handle is a slider.
 */
function TimezonePlanner({
  people,
  value,
  defaultValue = 10 * 60,
  onValueChange,
  date,
  locale,
  labels: labelsProp,
  className,
  ...props
}: TimezonePlannerProps) {
  const labels = useLabels('timezone-planner', defaultTimezonePlannerLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const minutes = value ?? own
  const svg = React.useRef<SVGSVGElement>(null)
  const dragging = React.useRef<number | null>(null)
  const day = React.useMemo(() => date ?? new Date(), [date])
  const home = people[0]
  const homeOffset = home ? offsetOf(home.timeZone, day) : 0
  const shifts = people.map((p) => offsetOf(p.timeZone, day) - homeOffset)

  const set = (next: number) => {
    const wrapped = (((Math.round(next / STEP) * STEP) % 1440) + 1440) % 1440
    if (wrapped === minutes) return
    if (value === undefined) setOwn(wrapped)
    onValueChange?.(wrapped)
  }
  const fromPointer = (event: React.PointerEvent) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const angle = Math.atan2(
      event.clientY - (box.top + box.height / 2),
      event.clientX - (box.left + box.width / 2),
    )
    set((((angle + Math.PI / 2) / (2 * Math.PI) + 1) % 1) * 1440)
  }
  const clock = (m: number) => {
    const d = new Date(Date.UTC(2000, 0, 1, 0, ((m % 1440) + 1440) % 1440))
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(d)
  }

  const ring = 22
  const gap = 3
  const share = minutes / 1440
  const angle = share * 360
  const rows = people.map((p, i) => {
    const local = minutes + (shifts[i] ?? 0)
    const dayShift = Math.floor(local / 1440)
    return { p, local, part: dayPart(local / 60, p.workStart, p.workEnd), dayShift }
  })
  const outside = rows.filter((r) => r.part !== 'work').length

  return (
    <div
      data-slot="timezone-planner"
      className={cn('flex w-full max-w-sm flex-col items-center gap-4', className)}
      {...props}
    >
      <svg
        ref={svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-72 touch-none select-none"
        onPointerDown={(event) => {
          dragging.current = event.pointerId
          event.currentTarget.setPointerCapture?.(event.pointerId)
          fromPointer(event)
        }}
        onPointerMove={(event) => {
          if (dragging.current === event.pointerId) fromPointer(event)
        }}
        onPointerUp={() => {
          dragging.current = null
        }}
        aria-hidden="true"
      >
        {people.map((p, i) => {
          const r2 = C - 4 - i * (ring + gap)
          const r1 = r2 - ring
          // The person's day, hour by hour, placed at the home hour it falls on.
          return Array.from({ length: 24 }, (_, h) => {
            const part = dayPart(h + (shifts[i] ?? 0) / 60, p.workStart, p.workEnd)
            return (
              <path
                // biome-ignore lint/suspicious/noArrayIndexKey: one segment per hour of the day
                key={`${p.name}-${h}`}
                d={arc(h / 24, (h + 1) / 24 - 0.002, r1, r2)}
                className={partColor[part]}
              />
            )
          })
        })}
        {Array.from({ length: 4 }, (_, i) => {
          const a = (i / 4) * 2 * Math.PI - Math.PI / 2
          const r = C - 4 - people.length * (ring + gap) - 10
          return (
            <text
              // biome-ignore lint/suspicious/noArrayIndexKey: one label per quarter of the day
              key={i}
              x={C + r * Math.cos(a)}
              y={C + r * Math.sin(a)}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[10px]"
            >
              {clock(i * 360)}
            </text>
          )
        })}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px` }}>
          <line
            x1={C}
            y1={C}
            x2={C}
            y2={2}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="stroke-foreground"
          />
          <circle cx={C} cy={10} r={7} className="fill-foreground" />
        </g>
        <circle cx={C} cy={C} r={4} className="fill-foreground" />
      </svg>
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.dial}
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={minutes}
        aria-valuetext={labels.meeting(clock(minutes))}
        onKeyDown={(event) => {
          const by =
            event.key === 'ArrowRight' || event.key === 'ArrowUp'
              ? STEP
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                ? -STEP
                : event.key === 'PageUp'
                  ? 60
                  : event.key === 'PageDown'
                    ? -60
                    : 0
          if (!by) return
          event.preventDefault()
          set(minutes + by)
        }}
        className="rounded-md px-2 font-semibold text-2xl tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {clock(minutes)}
      </div>
      <ul className="flex w-full flex-col gap-1.5 text-sm">
        {rows.map(({ p, local, part, dayShift }) => (
          <li key={p.name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                part === 'work'
                  ? 'bg-emerald-500'
                  : part === 'awake'
                    ? 'bg-sky-400'
                    : 'bg-muted-foreground/50',
              )}
            />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="tabular-nums">
              {clock(local)}
              {dayShift !== 0 && (
                <sup className="ml-0.5 text-muted-foreground text-[10px]">
                  {dayShift > 0 ? '+1' : '−1'}
                </sup>
              )}
            </span>
            <span className="w-16 text-right text-muted-foreground text-xs">
              {labels.parts[part]}
            </span>
          </li>
        ))}
      </ul>
      <p
        role="status"
        className={cn(
          'text-sm',
          outside ? 'text-muted-foreground' : 'text-emerald-700 dark:text-emerald-400',
        )}
      >
        {outside ? labels.outside(outside) : labels.allWorking}
      </p>
    </div>
  )
}

export { TimezonePlanner }
