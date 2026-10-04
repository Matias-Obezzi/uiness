'use client'

import { CalendarRangeIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  addDays,
  addMonths,
  Calendar,
  type CalendarRangeProps,
  type DateRange,
  dateKey,
  isSameDay,
  startOfDay,
  startOfMonth,
} from '@/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export interface DateRangePreset {
  /** Text on the preset button. */
  label: string
  /** The range for a given today, at local midnight. */
  range: (today: Date) => DateRange
}

/** Today, yesterday, the last 7 and 30 days, this and last month, this year. */
export const defaultDateRangePresets: DateRangePreset[] = [
  { label: 'Today', range: (t) => ({ from: t, to: t }) },
  { label: 'Yesterday', range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { label: 'Last 7 days', range: (t) => ({ from: addDays(t, -6), to: t }) },
  { label: 'Last 30 days', range: (t) => ({ from: addDays(t, -29), to: t }) },
  { label: 'This month', range: (t) => ({ from: startOfMonth(t), to: t }) },
  {
    label: 'Last month',
    range: (t) => ({ from: addMonths(t, -1), to: addDays(startOfMonth(t), -1) }),
  },
  { label: 'This year', range: (t) => ({ from: new Date(t.getFullYear(), 0, 1), to: t }) },
]

export interface DateRangePickerLabels {
  placeholder: string
  apply: string
  cancel: string
  /** Accessible name of the presets column. */
  presets: string
}

const DEFAULT_LABELS: DateRangePickerLabels = {
  placeholder: 'Pick a range',
  apply: 'Apply',
  cancel: 'Cancel',
  presets: 'Presets',
}

export interface DateRangePickerProps
  extends Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange' | 'children'> {
  /** The picked range. Controlled. */
  value?: DateRange
  /** The starting range when uncontrolled. */
  defaultValue?: DateRange
  /** Called with a complete range, or an empty one when cleared. */
  onValueChange?: (range: DateRange) => void
  /** Ranges one click away. Pass your own list, or `false` for none. Default today, last 7 days and more. */
  presets?: DateRangePreset[] | false
  /** Hold the pick until Apply is pressed, with Cancel to drop it. Default false. */
  confirm?: boolean
  /** Months side by side. Drops to one on narrow screens. Default 2. */
  numberOfMonths?: number
  /** BCP 47 locale for the label and the calendar. Default the browser's. */
  locale?: string
  /** How the range reads in the button. Default a medium date. */
  format?: Intl.DateTimeFormatOptions
  /** Earliest selectable day. */
  min?: Date
  /** Latest selectable day. */
  max?: Date
  /** Days that cannot be picked. */
  disabledDates?: (date: Date) => boolean
  /** The day presets count from. Default now. */
  today?: Date
  /** With a name, hidden inputs `name.from` and `name.to` carry ISO dates in a form. */
  name?: string
  /** Texts, for other languages. */
  labels?: Partial<DateRangePickerLabels>
  /** Classes for the popover panel. */
  contentClassName?: string
  /** Extra props for the calendar inside. */
  calendarProps?: Partial<Omit<CalendarRangeProps, 'mode' | 'selected' | 'onSelect'>>
}

const NARROW = '(max-width: 639px)'

function useNarrow() {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(NARROW)
    setNarrow(mq.matches)
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

const sameRange = (a: DateRange, b: DateRange) =>
  isSameDay(a.from, b.from) && (isSameDay(a.to, b.to) || (!a.to && !b.to))

/**
 * A button that opens two months side by side with a column of presets. Picks happen in the
 * calendar or with one click on a preset; with `confirm` they wait for Apply.
 */
function DateRangePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  presets = defaultDateRangePresets,
  confirm = false,
  numberOfMonths = 2,
  locale,
  format = { dateStyle: 'medium' },
  min,
  max,
  disabledDates,
  today: todayProp,
  name,
  labels: labelsProp,
  className,
  contentClassName,
  calendarProps,
  disabled,
  ...props
}: DateRangePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const [internal, setInternal] = React.useState<DateRange>(defaultValue ?? {})
  const value = valueProp ?? internal
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange>(value)
  const narrow = useNarrow()
  const months = narrow ? 1 : numberOfMonths

  const today = startOfDay(todayProp ?? new Date())
  const [month, setMonth] = React.useState(() => startOfMonth(value.from ?? today))

  const fmt = React.useMemo(() => new Intl.DateTimeFormat(locale, format), [locale, format])
  const describe = (r: DateRange) => {
    if (!r.from) return null
    if (!r.to || isSameDay(r.from, r.to)) return fmt.format(r.from)
    return fmt.formatRange(r.from, r.to)
  }
  const label = describe(value)

  /** Show the months that hold the range, its end in the last column when it fits. */
  const reveal = (r: DateRange) => {
    if (!r.from) return
    const end = r.to ?? r.from
    const span =
      (end.getFullYear() - r.from.getFullYear()) * 12 + end.getMonth() - r.from.getMonth()
    setMonth(span < months ? startOfMonth(r.from) : addMonths(end, 1 - months))
  }

  const commit = (r: DateRange) => {
    if (valueProp === undefined) setInternal(r)
    onValueChange?.(r)
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(value)
      if (value.from) reveal(value)
      else setMonth(startOfMonth(addMonths(today, 1 - months)))
    }
    setOpen(next)
  }

  const choose = (r: DateRange) => {
    setDraft(r)
    if (confirm) return
    if (r.from && r.to) {
      commit(r)
      setOpen(false)
    }
  }

  const presetList = presets === false ? [] : presets

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {name && (
        <>
          <input
            type="hidden"
            name={`${name}.from`}
            value={value.from ? dateKey(value.from) : ''}
          />
          <input type="hidden" name={`${name}.to`} value={value.to ? dateKey(value.to) : ''} />
        </>
      )}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-placeholder={label ? undefined : ''}
          className={cn(
            'w-72 max-w-full justify-start font-normal data-[placeholder]:text-muted-foreground',
            className,
          )}
          {...props}
          data-slot="date-range-picker-trigger"
        >
          <CalendarRangeIcon />
          <span className="truncate">{label ?? labels.placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={8}
        data-slot="date-range-picker-content"
        className={cn(
          'max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-1rem)] overflow-y-auto p-0 motion-reduce:animate-none',
          contentClassName,
        )}
      >
        <div className="flex flex-col sm:flex-row">
          {presetList.length > 0 && (
            // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
            <div
              role="group"
              aria-label={labels.presets}
              data-slot="date-range-picker-presets"
              className="flex gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:shrink-0 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0"
            >
              {presetList.map((preset) => {
                const range = preset.range(today)
                const active = !!draft.from && sameRange(range, draft)
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={active}
                    data-active={active ? '' : undefined}
                    onClick={() => {
                      reveal(range)
                      choose(range)
                    }}
                    className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active]:bg-accent data-[active]:font-medium data-[active]:text-accent-foreground"
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={choose}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={months}
              locale={locale}
              min={min}
              max={max}
              disabled={disabledDates}
              today={today}
              // Side by side, the days spilling over from the next month repeat the ones
              // beside them and read as a second selection.
              showOutsideDays={months === 1}
              {...calendarProps}
            />
            {confirm && (
              <div
                data-slot="date-range-picker-footer"
                className="flex flex-wrap items-center justify-end gap-2 border-t p-3"
              >
                <span aria-live="polite" className="mr-auto text-muted-foreground text-sm">
                  {describe(draft)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(value)
                    setOpen(false)
                  }}
                >
                  {labels.cancel}
                </Button>
                <Button
                  size="sm"
                  disabled={!draft.from}
                  onClick={() => {
                    // A single picked day is a one day range.
                    commit(draft.to ? draft : { from: draft.from, to: draft.from })
                    setOpen(false)
                  }}
                >
                  {labels.apply}
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
