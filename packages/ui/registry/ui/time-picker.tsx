'use client'

import { ClockIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

/* -------------------------------------------------------------------------------------------------
 * Time values. Always "HH:mm" or "HH:mm:ss" in 24 hours, the same string a native time
 * input submits, whatever the field shows.
 * -----------------------------------------------------------------------------------------------*/

type SegmentType = 'hour' | 'minute' | 'second' | 'dayPeriod'

interface Segments {
  /** 0 to 23 on a 24 hour clock, 1 to 12 on a 12 hour one. */
  hour: number | null
  minute: number | null
  second: number | null
  /** 0 for AM, 1 for PM. Only used on a 12 hour clock. */
  period: 0 | 1 | null
}

const EMPTY: Segments = { hour: null, minute: null, second: null, period: null }

const pad = (n: number) => String(n).padStart(2, '0')

/** Seconds since midnight for "HH:mm" or "HH:mm:ss", or null when the string is not a time. */
export function parseTime(value: string | null | undefined): number | null {
  const m = value?.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  const s = Number(m[3] ?? 0)
  if (h > 23 || min > 59 || s > 59) return null
  return h * 3600 + min * 60 + s
}

/** "HH:mm" or "HH:mm:ss" for a number of seconds since midnight. */
export function formatTime(total: number, withSeconds = false) {
  const h = Math.floor(total / 3600) % 24
  const m = Math.floor(total / 60) % 60
  const s = total % 60
  return withSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`
}

function toSegments(value: string | null | undefined, twelve: boolean): Segments {
  const total = parseTime(value)
  if (total === null) return EMPTY
  const h = Math.floor(total / 3600)
  return {
    hour: twelve ? h % 12 || 12 : h,
    minute: Math.floor(total / 60) % 60,
    second: total % 60,
    period: h >= 12 ? 1 : 0,
  }
}

function fromSegments(s: Segments, twelve: boolean, withSeconds: boolean): string | null {
  if (s.hour === null || s.minute === null) return null
  if (withSeconds && s.second === null) return null
  if (twelve && s.period === null) return null
  const h = twelve ? (s.hour % 12) + (s.period ?? 0) * 12 : s.hour
  return formatTime(h * 3600 + s.minute * 60 + (withSeconds ? (s.second ?? 0) : 0), withSeconds)
}

function localeHourCycle(locale?: string): 12 | 24 {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle
    return cycle === 'h11' || cycle === 'h12' ? 12 : 24
  } catch {
    return 24
  }
}

/* -------------------------------------------------------------------------------------------------
 * Props
 * -----------------------------------------------------------------------------------------------*/

export interface TimePickerLabels {
  hour: string
  minute: string
  second: string
  period: string
  /** The button that opens the list. */
  list: string
  /** Read out for a segment with nothing in it yet. */
  empty: string
}

export const defaultTimePickerLabels: TimePickerLabels = {
  hour: 'Hours',
  minute: 'Minutes',
  second: 'Seconds',
  period: 'AM/PM',
  list: 'Choose a time',
  empty: 'Empty',
}

export interface TimePickerProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  /** The time as "HH:mm", or "HH:mm:ss" with `seconds`. 24 hours whatever is shown. Controlled. */
  value?: string | null
  /** The starting time when uncontrolled. */
  defaultValue?: string | null
  /** Called with the full time once every segment has a value, and with null when one is cleared. */
  onValueChange?: (value: string | null) => void
  /** Show a seconds segment. Default false. */
  seconds?: boolean
  /** 12 or 24 hours. Default from the locale. */
  hourCycle?: 12 | 24
  /** BCP 47 locale for the segment order, the separator and the AM/PM names. Default the browser's. */
  locale?: string
  /** Minutes between entries of a dropdown list of times. The list button only shows when set. */
  step?: number
  /** Earliest allowed time, "HH:mm". The list starts here and a typed time is clamped on blur. */
  min?: string
  /** Latest allowed time, "HH:mm". The list ends here and a typed time is clamped on blur. */
  max?: string
  disabled?: boolean
  /** With a name, a hidden input carries the "HH:mm" value in a form. */
  name?: string
  required?: boolean
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<TimePickerLabels>
}

/* -------------------------------------------------------------------------------------------------
 * TimePicker
 * -----------------------------------------------------------------------------------------------*/

/**
 * A time field split into hour, minute and optional second segments. Each segment is a
 * spinbutton: arrows step it, digits type into it and move on once it is full. With `step`
 * a button opens a list of times.
 */
function TimePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  seconds = false,
  hourCycle,
  locale: localeProp,
  step,
  min,
  max,
  disabled,
  name,
  required,
  labels: labelsProp,
  className,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: TimePickerProps) {
  const labels = useLabels('time-picker', defaultTimePickerLabels, labelsProp)
  const locale = useLocale(localeProp)
  const twelve = (hourCycle ?? localeHourCycle(locale)) === 12
  const controlled = valueProp !== undefined

  const [segments, setSegments] = React.useState<Segments>(() =>
    toSegments(controlled ? valueProp : defaultValue, twelve),
  )
  const value = fromSegments(segments, twelve, seconds)

  // A controlled value that changes from outside resets the segments. One that matches what
  // the segments already say is left alone, so a half typed time is not wiped.
  const [seen, setSeen] = React.useState(valueProp)
  if (controlled && valueProp !== seen) {
    setSeen(valueProp)
    if (valueProp !== value) setSegments(toSegments(valueProp, twelve))
  }

  const update = (next: Segments) => {
    // A 12 hour time needs a period; assume AM the moment an hour is typed rather than
    // leave the field incomplete over a segment nobody looks at.
    if (twelve && next.hour !== null && next.period === null) next = { ...next, period: 0 }
    setSegments(next)
    const nextValue = fromSegments(next, twelve, seconds)
    if (nextValue !== value) {
      if (controlled) setSeen(nextValue)
      onValueChange?.(nextValue)
    }
  }

  const setValue = (next: string | null) => update(toSegments(next, twelve))

  const minSeconds = parseTime(min)
  const maxSeconds = parseTime(max)
  const total = parseTime(value)
  const outOfRange =
    total !== null &&
    ((minSeconds !== null && total < minSeconds) || (maxSeconds !== null && total > maxSeconds))

  /* Order, separators and day period names, all from the locale. */
  const layout = React.useMemo(() => {
    let parts: Intl.DateTimeFormatPart[] = []
    let am = 'AM'
    let pm = 'PM'
    try {
      const fmt = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: seconds ? '2-digit' : undefined,
        hourCycle: twelve ? 'h12' : 'h23',
      })
      parts = fmt.formatToParts(new Date(2024, 0, 1, 13, 5, 9))
      am =
        fmt.formatToParts(new Date(2024, 0, 1, 1)).find((p) => p.type === 'dayPeriod')?.value ?? am
      pm = parts.find((p) => p.type === 'dayPeriod')?.value ?? pm
    } catch {}
    const order: { type: SegmentType | 'literal'; text: string }[] = []
    for (const part of parts) {
      if (part.type === 'literal') order.push({ type: 'literal', text: part.value })
      else if (['hour', 'minute', 'second', 'dayPeriod'].includes(part.type))
        order.push({ type: part.type as SegmentType, text: '' })
    }
    if (!order.some((p) => p.type === 'hour')) {
      order.splice(0, order.length, { type: 'hour', text: '' }, { type: 'literal', text: ':' })
      order.push({ type: 'minute', text: '' })
      if (seconds) order.push({ type: 'literal', text: ':' }, { type: 'second', text: '' })
      if (twelve) order.push({ type: 'literal', text: ' ' }, { type: 'dayPeriod', text: '' })
    }
    // Trim literals at the ends, a few locales wrap the time in marks we do not need.
    while (order[0]?.type === 'literal') order.shift()
    while (order[order.length - 1]?.type === 'literal') order.pop()
    return { order, am, pm }
  }, [locale, seconds, twelve])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const segmentEls = () =>
    Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-segment]') ?? [])
  const focusSibling = (from: HTMLElement, delta: number) => {
    const els = segmentEls()
    els[els.indexOf(from) + delta]?.focus()
  }

  /* Typed digits collect per segment until the segment cannot take another one. */
  const typed = React.useRef<{ type: SegmentType | null; text: string; at: number }>({
    type: null,
    text: '',
    at: 0,
  })

  const range = (type: SegmentType): [number, number] => {
    if (type === 'hour') return twelve ? [1, 12] : [0, 23]
    if (type === 'dayPeriod') return [0, 1]
    return [0, 59]
  }

  const segmentValue = (type: SegmentType) =>
    type === 'dayPeriod' ? segments.period : segments[type]

  const setSegment = (type: SegmentType, n: number | null) => {
    if (type === 'dayPeriod') update({ ...segments, period: n as 0 | 1 | null })
    else update({ ...segments, [type]: n })
  }

  const handleSegmentKey = (type: SegmentType) => (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    const [lo, hi] = range(type)
    const current = segmentValue(type)
    const span = hi - lo + 1
    const wrap = (n: number) => ((((n - lo) % span) + span) % span) + lo
    const target = e.currentTarget

    const stepBy = (delta: number) => {
      setSegment(type, current === null ? (delta > 0 ? lo : hi) : wrap(current + delta))
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        stepBy(1)
        typed.current.text = ''
        return
      case 'ArrowDown':
        e.preventDefault()
        stepBy(-1)
        typed.current.text = ''
        return
      case 'PageUp':
        e.preventDefault()
        stepBy(type === 'hour' ? 1 : 10)
        return
      case 'PageDown':
        e.preventDefault()
        stepBy(type === 'hour' ? -1 : -10)
        return
      case 'Home':
        e.preventDefault()
        setSegment(type, lo)
        return
      case 'End':
        e.preventDefault()
        setSegment(type, hi)
        return
      case 'ArrowLeft':
        e.preventDefault()
        focusSibling(target, -1)
        return
      case 'ArrowRight':
        e.preventDefault()
        focusSibling(target, 1)
        return
      case 'Backspace':
      case 'Delete':
        e.preventDefault()
        typed.current.text = ''
        setSegment(type, null)
        return
    }

    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
    if (typeChar(type, e.key, target)) e.preventDefault()
  }

  /** Feed one typed character to a segment. True when it was used. */
  const typeChar = (type: SegmentType, char: string, target: HTMLElement) => {
    if (type === 'dayPeriod') {
      const key = char.toLowerCase()
      if (key === 'a' || key === layout.am[0]?.toLowerCase()) setSegment(type, 0)
      else if (key === 'p' || key === layout.pm[0]?.toLowerCase()) setSegment(type, 1)
      else return false
      return true
    }

    if (/\d/.test(char)) {
      const [lo, hi] = range(type)
      const now = Date.now()
      const prev = typed.current
      let text = prev.type === type && now - prev.at < 1000 ? prev.text + char : char
      if (Number(text) > hi) text = char
      const n = Number(text)
      typed.current = { type, text, at: now }
      // On a 12 hour clock a lone 0 waits for the next digit instead of becoming an hour.
      const waiting = type === 'hour' && twelve && text === '0'
      if (!waiting) setSegment(type, Math.min(Math.max(n, lo), hi))
      // Full when two digits are in, or when no second digit could still fit.
      if (text.length >= 2 || n * 10 > hi) {
        typed.current.text = ''
        focusSibling(target, 1)
      }
      return true
    }

    // Typing the separator jumps ahead, the way people type a time in one go.
    if (/[:.\s]/.test(char)) {
      typed.current.text = ''
      focusSibling(target, 1)
      return true
    }
    return false
  }

  // Phones send most keys as "Unidentified" and only say what was typed in beforeinput, so
  // the segments are editable and every edit is taken over here instead of reaching the DOM.
  const handleBeforeInput = (type: SegmentType) => (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault()
    if (disabled) return
    const native = e.nativeEvent as InputEvent
    if (native.inputType?.startsWith('delete')) {
      typed.current.text = ''
      setSegment(type, null)
      return
    }
    for (const char of native.data ?? '') typeChar(type, char, e.currentTarget)
  }

  const clampOnBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    if (rootRef.current?.contains(e.relatedTarget as Node | null)) return
    typed.current.text = ''
    if (total === null) return
    if (minSeconds !== null && total < minSeconds) setValue(formatTime(minSeconds, seconds))
    else if (maxSeconds !== null && total > maxSeconds) setValue(formatTime(maxSeconds, seconds))
  }

  const segmentText = (type: SegmentType) => {
    const n = segmentValue(type)
    if (type === 'dayPeriod') return n === null ? '--' : n === 1 ? layout.pm : layout.am
    return n === null ? '--' : pad(n)
  }

  const segmentLabel: Record<SegmentType, string> = {
    hour: labels.hour,
    minute: labels.minute,
    second: labels.second,
    dayPeriod: labels.period,
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
    <div
      ref={rootRef}
      role="group"
      data-slot="time-picker"
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled || undefined}
      aria-invalid={ariaInvalid ?? (outOfRange || undefined)}
      onBlur={clampOnBlur}
      className={cn(
        'inline-flex h-9 w-fit min-w-0 items-center gap-1 rounded-lg border border-input bg-transparent pr-1 pl-2.5 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm dark:bg-input/30',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        !step && 'pr-2.5',
        className,
      )}
      {...props}
    >
      <div className="flex items-center tabular-nums">
        {layout.order.map((part, i) => {
          if (part.type === 'literal') {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: separators are positional
              <span key={i} aria-hidden className="whitespace-pre text-muted-foreground">
                {part.text}
              </span>
            )
          }
          const type = part.type
          const n = segmentValue(type)
          const [lo, hi] = range(type)
          return (
            <span
              key={type}
              role="spinbutton"
              tabIndex={disabled ? -1 : 0}
              data-segment={type}
              data-slot="time-picker-segment"
              data-placeholder={n === null ? '' : undefined}
              aria-label={segmentLabel[type]}
              aria-valuemin={lo}
              aria-valuemax={hi}
              aria-valuenow={n ?? undefined}
              aria-valuetext={n === null ? labels.empty : segmentText(type)}
              aria-required={required || undefined}
              aria-disabled={disabled || undefined}
              contentEditable={!disabled}
              suppressContentEditableWarning
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              enterKeyHint="next"
              inputMode={type === 'dayPeriod' ? 'text' : 'numeric'}
              onKeyDown={handleSegmentKey(type)}
              onBeforeInput={handleBeforeInput(type)}
              onPaste={(e) => e.preventDefault()}
              onFocus={() => {
                typed.current.text = ''
              }}
              className="cursor-default rounded-sm px-0.5 caret-transparent outline-none focus:bg-primary focus:text-primary-foreground data-[placeholder]:text-muted-foreground data-[placeholder]:focus:text-primary-foreground"
            >
              {segmentText(type)}
            </span>
          )
        })}
      </div>
      {step ? (
        <TimeList
          value={value}
          onPick={setValue}
          step={step}
          seconds={seconds}
          min={minSeconds}
          max={maxSeconds}
          twelve={twelve}
          locale={locale}
          label={labels.list}
          disabled={disabled}
        />
      ) : null}
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * List
 * -----------------------------------------------------------------------------------------------*/

interface TimeListProps {
  value: string | null
  onPick: (value: string) => void
  step: number
  seconds: boolean
  min: number | null
  max: number | null
  twelve: boolean
  locale?: string
  label: string
  disabled?: boolean
}

function TimeList({
  value,
  onPick,
  step,
  seconds,
  min,
  max,
  twelve,
  locale,
  label,
  disabled,
}: TimeListProps) {
  const [open, setOpen] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  const times = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      hour: twelve ? 'numeric' : '2-digit',
      minute: '2-digit',
      hourCycle: twelve ? 'h12' : 'h23',
    })
    const out: { value: string; label: string; total: number }[] = []
    const from = min ?? 0
    const to = max ?? 24 * 3600 - 1
    const every = Math.max(1, Math.round(step)) * 60
    for (let t = from; t <= to; t += every) {
      out.push({
        value: formatTime(t, seconds),
        label: fmt.format(new Date(2024, 0, 1, Math.floor(t / 3600), Math.floor(t / 60) % 60)),
        total: t,
      })
    }
    return out
  }, [locale, twelve, min, max, step, seconds])

  const current = parseTime(value)
  // Land on the picked time, or the closest one before it, so the list opens in context.
  const startIndex = React.useMemo(() => {
    if (current === null) return 0
    let best = 0
    times.forEach((t, i) => {
      if (t.total <= current) best = i
    })
    return best
  }, [times, current])

  const [active, setActive] = React.useState(startIndex)

  const scrollToActive = React.useCallback((index: number) => {
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!list || !el) return
    // Scroll the list only. scrollIntoView would move the page too.
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
  }, [])

  React.useEffect(() => {
    if (open) scrollToActive(active)
  }, [open, active, scrollToActive])

  const pick = (index: number) => {
    const t = times[index]
    if (!t) return
    onPick(t.value)
    setOpen(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = times.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
      PageDown: Math.min(active + 5, last),
      PageUp: Math.max(active - 5, 0),
    }
    const next = moves[e.key]
    if (next !== undefined) {
      e.preventDefault()
      setActive(next)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(active)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setActive(startIndex)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        aria-label={label}
        data-slot="time-picker-trigger"
        className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"
      >
        <ClockIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        data-slot="time-picker-content"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          listRef.current?.focus()
        }}
        className="w-40 p-1 motion-reduce:animate-none"
      >
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={0}
          aria-label={label}
          aria-activedescendant={times[active] ? `${listId}-${active}` : undefined}
          onKeyDown={handleKey}
          className="relative max-h-64 scroll-py-1 overflow-y-auto outline-none"
        >
          {times.map((t, i) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled by the listbox
            <div
              key={t.value}
              id={`${listId}-${i}`}
              role="option"
              tabIndex={-1}
              data-index={i}
              aria-selected={t.value === value}
              data-active={i === active ? '' : undefined}
              data-selected={t.value === value ? '' : undefined}
              onPointerMove={() => setActive(i)}
              onClick={() => pick(i)}
              className="cursor-pointer select-none rounded-md px-2 py-1.5 text-sm tabular-nums data-[active]:bg-accent data-[selected]:font-medium data-[active]:text-accent-foreground"
            >
              {t.label}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
