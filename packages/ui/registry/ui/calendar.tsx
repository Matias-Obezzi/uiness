'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------------------------------
 * Dates. Plain Date objects at local midnight, no library.
 * -----------------------------------------------------------------------------------------------*/

export interface DateRange {
  from?: Date
  to?: Date
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
export const isSameDay = (a?: Date | null, b?: Date | null) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
export const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
const dayValue = (d: Date) => startOfDay(d).getTime()
export const isBefore = (a: Date, b: Date) => dayValue(a) < dayValue(b)
export const isAfter = (a: Date, b: Date) => dayValue(a) > dayValue(b)
export const isBetween = (d: Date, from: Date, to: Date) =>
  dayValue(d) >= dayValue(from) && dayValue(d) <= dayValue(to)
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function weekStartFor(locale?: string): number {
  try {
    const info = new Intl.Locale(locale ?? navigator.language) as Intl.Locale & {
      weekInfo?: { firstDay: number }
      getWeekInfo?: () => { firstDay: number }
    }
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay
    if (first) return first % 7 // Intl uses 7 for Sunday
  } catch {}
  return 1
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

interface CalendarBaseProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  /** Month shown. Controlled. */
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  /** Earliest selectable day. */
  min?: Date
  /** Latest selectable day. */
  max?: Date
  /** Days that cannot be picked. */
  disabled?: (date: Date) => boolean
  /** BCP 47 locale for names and the first day of the week. Default the browser's. */
  locale?: string
  /** 0 Sunday to 6 Saturday. Default from the locale. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Months side by side. Default 1. */
  numberOfMonths?: number
  /** Show the days of the neighbouring months that fill the grid. Default true. */
  showOutsideDays?: boolean
  /** Always six rows, so the height never jumps. Default false. */
  fixedWeeks?: boolean
  /** The day marked as today. Default now. */
  today?: Date
  footer?: React.ReactNode
}

export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: 'single'
  selected?: Date | null
  onSelect?: (date: Date | null) => void
}

export interface CalendarMultipleProps extends CalendarBaseProps {
  mode: 'multiple'
  selected?: Date[]
  onSelect?: (dates: Date[]) => void
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: 'range'
  selected?: DateRange
  onSelect?: (range: DateRange) => void
}

export type CalendarProps = CalendarSingleProps | CalendarMultipleProps | CalendarRangeProps

/* -------------------------------------------------------------------------------------------------
 * Calendar
 * -----------------------------------------------------------------------------------------------*/

/**
 * A month grid to pick a day, several days or a range. Arrow keys move between days, Page
 * Up and Down between months, Home and End across the week. Built on plain dates, no
 * library.
 */
function Calendar(props: CalendarProps) {
  const {
    mode = 'single',
    month: monthProp,
    defaultMonth,
    onMonthChange,
    min,
    max,
    disabled,
    locale,
    weekStartsOn,
    numberOfMonths = 1,
    showOutsideDays = true,
    fixedWeeks = false,
    today: todayProp,
    footer,
    className,
    onKeyDown,
    ...rest
  } = props
  // The union members share every other prop; only these three differ.
  const {
    selected: _s,
    onSelect: _o,
    ...divProps
  } = rest as CalendarBaseProps & {
    selected?: unknown
    onSelect?: unknown
  }

  const today = React.useMemo(() => startOfDay(todayProp ?? new Date()), [todayProp])
  const firstSelected = React.useMemo(() => {
    const s = props.selected
    if (!s) return undefined
    if (s instanceof Date) return s
    if (Array.isArray(s)) return s[0]
    return s.from
  }, [props.selected])

  const [uncontrolledMonth, setUncontrolledMonth] = React.useState(() =>
    startOfMonth(defaultMonth ?? firstSelected ?? today),
  )
  const month = monthProp ? startOfMonth(monthProp) : uncontrolledMonth
  const setMonth = (next: Date) => {
    const m = startOfMonth(next)
    if (!monthProp) setUncontrolledMonth(m)
    onMonthChange?.(m)
  }

  const [internal, setInternal] = React.useState<unknown>(() =>
    mode === 'multiple' ? [] : mode === 'range' ? {} : null,
  )
  const selected = props.selected !== undefined ? props.selected : internal
  const commit = (next: unknown) => {
    if (props.selected === undefined) setInternal(next)
    ;(props.onSelect as ((v: unknown) => void) | undefined)?.(next)
  }

  const [focused, setFocused] = React.useState<Date>(() => firstSelected ?? today)
  const [hovered, setHovered] = React.useState<Date | null>(null)
  const pendingFocus = React.useRef(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dateKey(focused)}"]`)?.focus()
  }, [focused])

  const weekStart = weekStartsOn ?? weekStartFor(locale)
  const monthLabel = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )
  const dayLabel = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
    [locale],
  )
  const weekdays = React.useMemo(() => {
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
    const base = new Date(2024, 0, 7) // a Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, ((weekStart + i) % 7) - 0)
      return { short: short.format(d), long: long.format(d) }
    })
  }, [locale, weekStart])

  const isDisabled = (d: Date) =>
    (min ? isBefore(d, min) : false) || (max ? isAfter(d, max) : false) || !!disabled?.(d)

  const isSelected = (d: Date) => {
    if (mode === 'single') return isSameDay(selected as Date | null, d)
    if (mode === 'multiple') return (selected as Date[]).some((s) => isSameDay(s, d))
    const r = selected as DateRange
    return isSameDay(r.from, d) || isSameDay(r.to, d)
  }

  const rangeState = (d: Date): 'start' | 'end' | 'middle' | null => {
    if (mode !== 'range') return null
    const r = selected as DateRange
    const from = r.from
    const to = r.to ?? (from && hovered && !isBefore(hovered, from) ? hovered : undefined)
    if (!from) return null
    if (isSameDay(d, from) && (!to || isSameDay(to, from))) return 'start'
    if (isSameDay(d, from)) return 'start'
    if (to && isSameDay(d, to)) return 'end'
    if (to && isBetween(d, from, to)) return 'middle'
    return null
  }

  const pick = (d: Date) => {
    if (isDisabled(d)) return
    setFocused(d)
    if (mode === 'single') {
      commit(isSameDay(selected as Date | null, d) ? null : d)
    } else if (mode === 'multiple') {
      const list = selected as Date[]
      commit(
        list.some((s) => isSameDay(s, d)) ? list.filter((s) => !isSameDay(s, d)) : [...list, d],
      )
    } else {
      const r = selected as DateRange
      if (!r.from || r.to) commit({ from: d })
      else if (isBefore(d, r.from)) commit({ from: d, to: r.from })
      else commit({ from: r.from, to: d })
    }
  }

  const lastVisible = addMonths(month, numberOfMonths - 1)
  const moveFocus = (next: Date) => {
    if (isBefore(next, month)) setMonth(next)
    else if (isAfter(next, addDays(addMonths(lastVisible, 1), -1)))
      setMonth(addMonths(next, 1 - numberOfMonths))
    pendingFocus.current = true
    setFocused(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const f = focused
    const map: Record<string, Date | undefined> = {
      ArrowLeft: addDays(f, -1),
      ArrowRight: addDays(f, 1),
      ArrowUp: addDays(f, -7),
      ArrowDown: addDays(f, 7),
      Home: addDays(f, -((f.getDay() - weekStart + 7) % 7)),
      End: addDays(f, 6 - ((f.getDay() - weekStart + 7) % 7)),
      PageUp: e.shiftKey
        ? new Date(f.getFullYear() - 1, f.getMonth(), f.getDate())
        : new Date(f.getFullYear(), f.getMonth() - 1, f.getDate()),
      PageDown: e.shiftKey
        ? new Date(f.getFullYear() + 1, f.getMonth(), f.getDate())
        : new Date(f.getFullYear(), f.getMonth() + 1, f.getDate()),
    }
    const next = map[e.key]
    if (next) {
      e.preventDefault()
      moveFocus(next)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(f)
    }
  }

  const renderMonth = (offset: number) => {
    const m = addMonths(month, offset)
    const first = startOfMonth(m)
    const lead = (first.getDay() - weekStart + 7) % 7
    const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
    const rows = fixedWeeks ? 6 : Math.ceil((lead + daysInMonth) / 7)
    const start = addDays(first, -lead)
    return (
      <div key={offset} data-slot="calendar-month" className="flex flex-col gap-3">
        <div className="relative flex h-8 items-center justify-center">
          {offset === 0 && (
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth(addMonths(month, -1))}
              className="absolute left-0 inline-flex size-8 items-center justify-center rounded-lg border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <ChevronLeftIcon />
            </button>
          )}
          <span aria-live="polite" data-slot="calendar-caption" className="font-medium text-sm">
            {monthLabel.format(m)}
          </span>
          {offset === numberOfMonths - 1 && (
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
              className="absolute right-0 inline-flex size-8 items-center justify-center rounded-lg border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
        {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the ARIA date picker pattern is a table with role grid */}
        <table role="grid" aria-label={monthLabel.format(m)} className="border-collapse">
          <thead>
            <tr>
              {weekdays.map((w) => (
                <th
                  key={w.long}
                  scope="col"
                  abbr={w.long}
                  className="size-9 font-normal text-[0.8rem] text-muted-foreground"
                >
                  {w.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: weeks are positional
              <tr key={r}>
                {Array.from({ length: 7 }, (_, c) => {
                  const d = addDays(start, r * 7 + c)
                  const outside = !isSameMonth(d, m)
                  if (outside && !showOutsideDays) {
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional
                    return <td key={c} className="size-9" />
                  }
                  const selectedDay = isSelected(d)
                  const range = rangeState(d)
                  const off = isDisabled(d)
                  const focusable = isSameDay(d, focused) && !outside
                  return (
                    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: inside a role="grid" table a td is a gridcell, which takes aria-selected
                    <td
                      key={dateKey(d)}
                      aria-selected={selectedDay || undefined}
                      data-slot="calendar-cell"
                      data-range={range ?? undefined}
                      className={cn(
                        'p-0 text-center text-sm',
                        range === 'middle' && 'bg-accent',
                        range === 'start' && 'rounded-l-lg bg-accent',
                        range === 'end' && 'rounded-r-lg bg-accent',
                      )}
                    >
                      <button
                        type="button"
                        data-day={dateKey(d)}
                        data-selected={selectedDay ? '' : undefined}
                        data-today={isSameDay(d, today) ? '' : undefined}
                        data-outside={outside ? '' : undefined}
                        data-disabled={off ? '' : undefined}
                        aria-label={dayLabel.format(d)}
                        aria-disabled={off || undefined}
                        aria-pressed={mode === 'multiple' ? selectedDay : undefined}
                        tabIndex={focusable ? 0 : -1}
                        disabled={off}
                        onClick={() => pick(d)}
                        onPointerEnter={() => mode === 'range' && setHovered(d)}
                        onPointerLeave={() => mode === 'range' && setHovered(null)}
                        onFocus={() => setFocused(d)}
                        className={cn(
                          'inline-flex size-9 items-center justify-center rounded-lg font-normal outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          'data-[today]:bg-accent/60 data-[today]:font-medium',
                          'data-[outside]:text-muted-foreground data-[outside]:opacity-50',
                          'data-[disabled]:pointer-events-none data-[disabled]:opacity-30',
                          'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary',
                        )}
                      >
                        {d.getDate()}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the grid handles keys for its day buttons
    <div
      ref={rootRef}
      data-slot="calendar"
      data-mode={mode}
      className={cn('inline-flex flex-col gap-3 p-3', className)}
      onKeyDown={handleKeyDown}
      {...divProps}
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        {Array.from({ length: numberOfMonths }, (_, i) => renderMonth(i))}
      </div>
      {footer && <div data-slot="calendar-footer">{footer}</div>}
    </div>
  )
}

export { Calendar }
