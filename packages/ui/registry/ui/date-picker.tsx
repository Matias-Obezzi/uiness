'use client'

import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar, type CalendarProps, type DateRange, dateKey } from '@/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

interface DatePickerBaseProps {
  placeholder?: string
  /** BCP 47 locale for the label and the calendar. */
  locale?: string
  /** How the picked date reads in the button. Default a medium date. */
  format?: Intl.DateTimeFormatOptions
  disabled?: boolean
  min?: Date
  max?: Date
  /** Days that cannot be picked. */
  disabledDates?: (date: Date) => boolean
  /** Classes for the trigger button. */
  className?: string
  /** Extra props for the calendar inside. */
  calendarProps?: Partial<Omit<CalendarProps, 'mode' | 'selected' | 'onSelect'>>
  id?: string
  /** With a name, hidden inputs carry ISO dates in a form. */
  name?: string
  'aria-label'?: string
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: 'single'
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (date: Date | null) => void
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: 'range'
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (range: DateRange) => void
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps

/** A button that opens a calendar. Picks one day, or a range with `mode="range"`. */
function DatePicker(props: DatePickerProps) {
  const {
    placeholder = props.mode === 'range' ? 'Pick a range' : 'Pick a date',
    locale,
    format = { dateStyle: 'medium' },
    disabled,
    min,
    max,
    disabledDates,
    className,
    calendarProps,
    id,
    name,
  } = props
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState<Date | null | DateRange>(
    () => props.defaultValue ?? (props.mode === 'range' ? {} : null),
  )
  const value = props.value !== undefined ? props.value : internal
  const fmt = React.useMemo(() => new Intl.DateTimeFormat(locale, format), [locale, format])

  const label = (() => {
    if (props.mode === 'range') {
      const r = (value ?? {}) as DateRange
      if (!r.from) return null
      return r.to ? fmt.formatRange(r.from, r.to) : fmt.format(r.from)
    }
    const d = value as Date | null
    return d ? fmt.format(d) : null
  })()

  const commit = (next: Date | null | DateRange) => {
    if (props.value === undefined) setInternal(next)
    if (props.mode === 'range') props.onValueChange?.(next as DateRange)
    else props.onValueChange?.(next as Date | null)
  }

  const hidden = (() => {
    if (!name) return null
    if (props.mode === 'range') {
      const r = (value ?? {}) as DateRange
      return (
        <>
          <input type="hidden" name={`${name}.from`} value={r.from ? dateKey(r.from) : ''} />
          <input type="hidden" name={`${name}.to`} value={r.to ? dateKey(r.to) : ''} />
        </>
      )
    }
    const d = value as Date | null
    return <input type="hidden" name={name} value={d ? dateKey(d) : ''} />
  })()

  const shared = { min, max, disabled: disabledDates, locale, ...calendarProps }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {hidden}
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={props['aria-label'] ?? placeholder}
          data-slot="date-picker-trigger"
          data-placeholder={label ? undefined : ''}
          className={cn(
            'w-64 justify-start font-normal data-[placeholder]:text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon />
          <span className="truncate">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" data-slot="date-picker-content" className="w-auto p-0">
        {props.mode === 'range' ? (
          <Calendar
            mode="range"
            selected={(value ?? {}) as DateRange}
            onSelect={(r) => {
              commit(r)
              if (r.from && r.to) setOpen(false)
            }}
            numberOfMonths={2}
            {...shared}
          />
        ) : (
          <Calendar
            mode="single"
            selected={value as Date | null}
            onSelect={(d) => {
              commit(d)
              if (d) setOpen(false)
            }}
            {...shared}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
