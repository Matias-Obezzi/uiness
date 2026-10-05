'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ActivityDay {
  /** The day, as a `Date` or an ISO date like `2026-09-01`. */
  date: Date | string
  /** How much happened that day. */
  value: number
}

export interface ActivityHeatmapProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'color' | 'onSelect'> {
  /** Activity per day, as a list or as a map of ISO dates to values. Days left out count as zero. */
  data: ActivityDay[] | Record<string, number>
  /** First day shown. Defaults to 52 weeks before `endDate`. */
  startDate?: Date | string
  /** Last day shown. Defaults to today. */
  endDate?: Date | string
  /** First day of the week, 0 for Sunday or 1 for Monday. Default 0. */
  weekStart?: 0 | 1
  /** Number of steps in the color scale, the empty one included. Default 5. */
  levels?: number
  /** Lowest value of each step after the empty one, ascending. Defaults to even steps up to the busiest day. */
  thresholds?: number[]
  /** Darkest color of the scale; lighter steps are mixed towards `--muted`. Default `var(--chart-2)`. */
  color?: string
  /** Largest size of a day in pixels. Days shrink to fit, down to 8px, then the grid scrolls. Default 12. */
  cellSize?: number
  /** Text of the tooltip and of each day for screen readers. Default "3 on Mon, Sep 1, 2026". */
  formatDay?: (day: { date: Date; value: number }) => string
  /** Locale of the month, weekday and date names. Defaults to the browser's. */
  locale?: string
  /** Called when a day is clicked or picked with Enter. */
  onSelect?: (day: { date: Date; value: number }) => void
  /** "Less … More" legend under the grid. Default true. */
  showLegend?: boolean
}

const DAY = 24 * 60 * 60 * 1000
const ISO = /^(\d{4})-(\d{2})-(\d{2})/

/** A local day at midnight, so a bare ISO date means that day where the reader is. */
function toDay(input: Date | string): Date {
  if (typeof input === 'string') {
    const m = ISO.exec(input)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    input = new Date(input)
  }
  return new Date(input.getFullYear(), input.getMonth(), input.getDate())
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
// An empty day: the muted surface a step towards the text, so it shows on white as on black.
const EMPTY = 'color-mix(in oklab, var(--foreground) 7%, var(--muted))'
const WEEKS = (n: number) => Array.from({ length: n }, (_, i) => i)

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Adding days by calendar keeps daylight saving changes from landing on the wrong day.
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY)

/**
 * A year of days at a glance, one square per day and one column per week, shaded by how much
 * happened. Hover or focus a day for its value; the arrow keys move across days and weeks.
 */
function ActivityHeatmap({
  data,
  startDate,
  endDate,
  weekStart = 0,
  levels = 5,
  thresholds,
  color = 'var(--chart-2)',
  cellSize = 12,
  formatDay,
  locale,
  onSelect,
  showLegend = true,
  className,
  style,
  'aria-label': ariaLabel,
  ...props
}: ActivityHeatmapProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const cells = React.useRef(new Map<number, HTMLTableCellElement>())

  const end = toDay(endDate ?? new Date())
  const start = startDate ? toDay(startDate) : addDays(end, -364)
  const startKey = keyOf(start)
  const endKey = keyOf(end)

  const model = React.useMemo(() => {
    const s = toDay(startKey)
    const e = toDay(endKey)
    const gridStart = addDays(s, -((s.getDay() - weekStart + 7) % 7))
    const first = daysBetween(gridStart, s)
    const last = daysBetween(gridStart, e)
    const weeks = Math.max(1, Math.ceil((last + 1) / 7))
    const values = new Map<string, number>()
    const entries = Array.isArray(data)
      ? data.map((d) => [keyOf(toDay(d.date)), d.value] as const)
      : Object.entries(data).map(([k, v]) => [keyOf(toDay(k)), v] as const)
    for (const [k, v] of entries) values.set(k, (values.get(k) ?? 0) + v)
    let max = 0
    for (let i = first; i <= last; i++) {
      max = Math.max(max, values.get(keyOf(addDays(gridStart, i))) ?? 0)
    }
    return { gridStart, first, last, weeks, values, max }
  }, [data, startKey, endKey, weekStart])

  const steps = Math.max(2, levels)
  const levelOf = (value: number) => {
    if (!(value > 0)) return 0
    if (thresholds?.length) {
      const n = thresholds.filter((t) => value >= t).length
      return Math.min(steps - 1, Math.max(1, n))
    }
    return Math.min(steps - 1, Math.max(1, Math.ceil((value / (model.max || 1)) * (steps - 1))))
  }
  // One hue from light to dark: each step mixes more of the color into the empty cell's gray.
  const fill = (level: number) =>
    level === 0
      ? EMPTY
      : `color-mix(in oklab, ${color} ${Math.round(25 + ((level - 1) / Math.max(1, steps - 2)) * 75)}%, ${EMPTY})`

  const formats = React.useMemo(
    () => ({
      day: new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      month: new Intl.DateTimeFormat(locale, { month: 'short' }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      longWeekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      range: new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }),
      number: new Intl.NumberFormat(locale),
    }),
    [locale],
  )
  const describe = (date: Date, value: number) =>
    formatDay
      ? formatDay({ date, value })
      : `${value > 0 ? formats.number.format(value) : 'Nothing'} on ${formats.day.format(date)}`

  const [focus, setFocus] = React.useState(model.last)
  const [tip, setTip] = React.useState<{
    index: number
    x: number
    y: number
    align: 'start' | 'center' | 'end'
  } | null>(null)
  const focusIndex = Math.min(model.last, Math.max(model.first, focus))

  // The latest weeks matter most, so a grid that scrolls starts at its end.
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const showTip = (index: number) => {
    const cell = cells.current.get(index)
    const root = rootRef.current
    if (!cell || !root) return
    const c = cell.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    const x = c.left - r.left + c.width / 2
    // Near an edge the tooltip hangs inwards from the day instead of centring on it.
    const align = x < 90 ? 'start' : x > r.width - 90 ? 'end' : 'center'
    setTip({ index, x, y: c.top - r.top, align })
  }

  const moveTo = (index: number) => {
    const next = Math.min(model.last, Math.max(model.first, index))
    setFocus(next)
    const cell = cells.current.get(next)
    cell?.focus()
    cell?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    showTip(next)
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const row = index % 7
    const moves: Record<string, () => number> = {
      ArrowRight: () => index + 7,
      ArrowLeft: () => index - 7,
      ArrowDown: () => index + 1,
      ArrowUp: () => index - 1,
      PageDown: () => index + 28,
      PageUp: () => index - 28,
      Home: () =>
        e.ctrlKey || e.metaKey ? model.first : row + 7 * Math.ceil((model.first - row) / 7),
      End: () =>
        e.ctrlKey || e.metaKey ? model.last : row + 7 * Math.floor((model.last - row) / 7),
    }
    const move = moves[e.key]
    if (move) {
      e.preventDefault()
      moveTo(move())
    } else if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault()
      const date = addDays(model.gridStart, index)
      onSelect({ date, value: model.values.get(keyOf(date)) ?? 0 })
    }
  }

  // A month is named over its first full week column, unless that crowds the previous name.
  const months: { week: number; label: string }[] = []
  let lastMonth = -1
  for (let w = 0; w < model.weeks; w++) {
    const date = addDays(model.gridStart, Math.max(model.first, w * 7))
    const month = date.getFullYear() * 12 + date.getMonth()
    if (month === lastMonth) continue
    lastMonth = month
    const prev = months[months.length - 1]
    if (prev && w - prev.week < 3) months.pop()
    months.push({ week: w, label: formats.month.format(date) })
  }

  const gap = 3
  const tipDate = tip ? addDays(model.gridStart, tip.index) : null
  // Each month label spans the weeks up to the next one.
  // A month with too few columns left at the end has no room for its name, which would
  // otherwise spill past the grid.
  const monthSpans = months.map((m, i) => {
    const span = (months[i + 1]?.week ?? model.weeks) - m.week
    return { ...m, span, label: i === months.length - 1 && span < 3 && i > 0 ? '' : m.label }
  })
  const lead = months[0]?.week ?? model.weeks

  return (
    <div
      ref={rootRef}
      data-slot="activity-heatmap"
      className={cn('relative grid w-full min-w-0 gap-2', className)}
      style={{ maxWidth: `calc(2rem + ${model.weeks * (cellSize + gap) + gap}px)`, ...style }}
      {...props}
    >
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1"
        onScroll={() => setTip(null)}
        onPointerLeave={() => setTip(null)}
      >
        {/* Rows are weekdays and columns weeks, so what screen readers read matches the picture. */}
        <table
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the ARIA grid pattern on a table, like the calendar
          role="grid"
          aria-label={
            ariaLabel ??
            `Activity from ${formats.range.format(start)} to ${formats.range.format(end)}`
          }
          className="w-full table-fixed border-separate"
          style={{
            borderSpacing: gap,
            minWidth: `calc(2rem + ${model.weeks * (8 + gap)}px)`,
          }}
        >
          <colgroup>
            <col style={{ width: '2rem' }} />
            <col span={model.weeks} />
          </colgroup>
          <thead aria-hidden className="text-muted-foreground text-xs">
            <tr>
              <td className="sticky left-0 z-[1] bg-background" />
              {lead > 0 && <td colSpan={lead} />}
              {monthSpans.map((m) => (
                <td
                  key={`${m.week}-${m.label}`}
                  colSpan={m.span}
                  className="overflow-visible whitespace-nowrap p-0 text-left font-normal leading-none"
                >
                  {m.label}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((row) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="sticky left-0 z-[1] bg-background p-0 pr-1 text-right font-normal text-muted-foreground text-xs leading-none"
                >
                  <span aria-hidden>
                    {row % 2 === 1 ? formats.weekday.format(addDays(model.gridStart, row)) : ''}
                  </span>
                  <span className="sr-only">
                    {formats.longWeekday.format(addDays(model.gridStart, row))}
                  </span>
                </th>
                {WEEKS(model.weeks).map((week) => {
                  const index = week * 7 + row
                  if (index < model.first || index > model.last) {
                    return <td key={week} className="p-0" />
                  }
                  const date = addDays(model.gridStart, index)
                  const value = model.values.get(keyOf(date)) ?? 0
                  const level = levelOf(value)
                  return (
                    <td
                      key={week}
                      ref={(el) => {
                        if (el) cells.current.set(index, el)
                        else cells.current.delete(index)
                      }}
                      aria-label={describe(date, value)}
                      tabIndex={index === focusIndex ? 0 : -1}
                      data-level={level}
                      data-date={keyOf(date)}
                      className="group p-0 outline-none"
                      onPointerEnter={() => showTip(index)}
                      onFocus={() => {
                        setFocus(index)
                        showTip(index)
                      }}
                      onBlur={() => setTip(null)}
                      onKeyDown={(e) => onKeyDown(e, index)}
                      onClick={onSelect ? () => onSelect({ date, value }) : undefined}
                    >
                      <div
                        className="aspect-square w-full rounded-[3px] transition-shadow group-hover:ring-1 group-hover:ring-foreground/40 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                        style={{ background: fill(level) }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tip && tipDate && (
        <div
          aria-hidden
          data-slot="activity-heatmap-tooltip"
          className={cn(
            'pointer-events-none absolute z-(--z-tooltip,80) -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-background text-xs shadow-md',
            tip.align === 'center' && '-translate-x-1/2',
            tip.align === 'start' && '-translate-x-3',
            tip.align === 'end' && '-translate-x-[calc(100%-0.75rem)]',
          )}
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          {describe(tipDate, model.values.get(keyOf(tipDate)) ?? 0)}
        </div>
      )}

      {showLegend && (
        <div
          aria-hidden
          data-slot="activity-heatmap-legend"
          className="flex items-center justify-end gap-1 text-muted-foreground text-xs"
        >
          <span className="mr-1">Less</span>
          {Array.from({ length: steps }, (_, level) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: levels are positional
              key={level}
              className="size-2.5 rounded-[3px]"
              style={{ background: fill(level) }}
            />
          ))}
          <span className="ml-1">More</span>
        </div>
      )}
    </div>
  )
}

export { ActivityHeatmap }
