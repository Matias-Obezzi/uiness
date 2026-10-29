'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface Booking {
  /** Minutes from midnight. */
  start: number
  end: number
  title?: string
}

export interface Slot {
  start: number
  end: number
}

export interface SlotPickerLabels {
  /** Names the rail. */
  day: string
  /** The meeting, read with its times. */
  meeting: (from: string, to: string) => string
  resize: string
  /** The host's time, under the rail. */
  hostTime: (from: string, to: string, zone: string) => string
  busy: string
}

export const defaultSlotPickerLabels: SlotPickerLabels = {
  day: 'Day',
  meeting: (from, to) => `Meeting from ${from} to ${to}`,
  resize: 'Meeting length',
  hostTime: (from, to, zone) => `${from} – ${to} for the host (${zone})`,
  busy: 'Busy',
}

const overlaps = (a: Slot, b: Slot) => a.start < b.end && b.start < a.end

/**
 * The free start nearest to `desired` for a meeting of `length` minutes, on `step`, between
 * `min` and `max`, clear of every booking. `null` when nothing fits.
 */
export function nearestFree(
  desired: number,
  length: number,
  bookings: Slot[],
  min: number,
  max: number,
  step: number,
): number | null {
  let best: number | null = null
  for (let start = min; start + length <= max; start += step) {
    if (bookings.some((b) => overlaps({ start, end: start + length }, b))) continue
    if (best === null || Math.abs(start - desired) < Math.abs(best - desired)) best = start
  }
  return best
}

export interface SlotPickerProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** The day shown, for the times in the host's zone. Default today. */
  date?: Date
  bookings: Booking[]
  value?: Slot
  defaultValue?: Slot
  onValueChange?: (slot: Slot) => void
  /** First and last hour on the rail. Default 8 and 20. */
  startHour?: number
  endHour?: number
  /** Minutes a move or resize snaps to. Default 15. */
  step?: number
  /** The host's time zone, such as `America/New_York`, to show the meeting in their time too. */
  hostTimeZone?: string
  locale?: string
  labels?: Partial<SlotPickerLabels>
}

/**
 * Book a meeting on a day rail. Drag the meeting into a free gap: it hops over the bookings in
 * its way. Drag its end to make it longer or shorter, and see it in the host's time. On the
 * keyboard the arrows move it and Shift with the arrows resizes it.
 */
function SlotPicker({
  date,
  bookings,
  value,
  defaultValue,
  onValueChange,
  startHour = 8,
  endHour = 20,
  step = 15,
  hostTimeZone,
  locale,
  labels: labelsProp,
  className,
  ...props
}: SlotPickerProps) {
  const labels = useLabels('slot-picker', defaultSlotPickerLabels, labelsProp)
  const min = startHour * 60
  const max = endHour * 60
  const span = max - min
  const [own, setOwn] = React.useState<Slot>(() => {
    if (defaultValue) return defaultValue
    const start = nearestFree(min + 60, 30, bookings, min, max, step) ?? min
    return { start, end: start + 30 }
  })
  const slot = value ?? own
  const rail = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ pointer: number; mode: 'move' | 'resize'; grab: number } | null>(null)

  const set = (next: Slot) => {
    if (next.start === slot.start && next.end === slot.end) return
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const length = slot.end - slot.start
  const moveTo = (desired: number) => {
    const start = nearestFree(desired, length, bookings, min, max, step)
    if (start !== null) set({ start, end: start + length })
  }
  const resizeTo = (end: number) => {
    const snapped = Math.round(end / step) * step
    // As far as the next booking or the end of the day.
    const limit = Math.min(max, ...bookings.filter((b) => b.start >= slot.end).map((b) => b.start))
    set({ start: slot.start, end: Math.min(limit, Math.max(slot.start + step, snapped)) })
  }
  const minuteAt = (clientX: number) => {
    const box = rail.current?.getBoundingClientRect()
    if (!box?.width) return min
    return min + ((clientX - box.left) / box.width) * span
  }

  const day = date ?? new Date()
  const at = (minutes: number) => {
    const d = new Date(day)
    d.setHours(0, minutes, 0, 0)
    return d
  }
  const hour = (h: number) =>
    new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(at(h * 60))
  const time = (minutes: number, timeZone?: string) =>
    new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(
      at(minutes),
    )
  const share = (minutes: number) => `${((minutes - min) / span) * 100}%`
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  return (
    <div data-slot="slot-picker" className={cn('flex w-full flex-col gap-2', className)} {...props}>
      <div className="relative h-5">
        {hours.map((h, i) =>
          // Every other hour, and not the last, which would hang off the edge.
          i % 2 === 0 && i < hours.length - 1 ? (
            <span
              key={h}
              className="absolute -translate-x-1/2 text-muted-foreground text-[10px] tabular-nums"
              style={{ left: share(h * 60) }}
            >
              {hour(h)}
            </span>
          ) : null,
        )}
      </div>
      {/* A div: a fieldset would not hold the bookings, which are placed absolutely, in Chrome. */}
      {/* biome-ignore lint/a11y/useSemanticElements: see above */}
      <div
        ref={rail}
        role="group"
        aria-label={labels.day}
        className="relative h-14 min-w-0 touch-pan-y rounded-lg border bg-muted/30"
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          const minute = minuteAt(event.clientX)
          if (d.mode === 'move') moveTo(Math.round((minute - d.grab) / step) * step)
          else resizeTo(minute)
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
      >
        {hours.map((h) => (
          <span
            key={h}
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-border"
            style={{ left: share(h * 60) }}
          />
        ))}
        {bookings.map((b) => (
          <div
            key={`${b.start}-${b.end}`}
            className="absolute inset-y-1.5 overflow-hidden rounded-md bg-muted px-1.5 py-1 text-[10px] text-foreground/80 ring-1 ring-border ring-inset"
            style={{ left: share(b.start), width: `calc(${share(b.end)} - ${share(b.start)})` }}
          >
            <span className="sr-only">
              {labels.busy} {time(b.start)} – {time(b.end)}:
            </span>
            <span className="truncate">{b.title ?? labels.busy}</span>
          </div>
        ))}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.meeting(time(slot.start), time(slot.end))}
          aria-valuemin={min}
          aria-valuemax={max - length}
          aria-valuenow={slot.start}
          aria-valuetext={labels.meeting(time(slot.start), time(slot.end))}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return
            event.currentTarget.setPointerCapture?.(event.pointerId)
            drag.current = {
              pointer: event.pointerId,
              mode: 'move',
              grab: minuteAt(event.clientX) - slot.start,
            }
          }}
          // Moves bubble to the rail, which handles both moving and resizing.
          onKeyDown={(event) => {
            const dir =
              event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                  ? -1
                  : 0
            if (!dir) return
            event.preventDefault()
            if (event.shiftKey) resizeTo(slot.end + dir * step)
            else {
              // On past a booking in the way, to the free start beyond it.
              let target = slot.start + dir * step
              while (
                target >= min &&
                target + length <= max &&
                bookings.some((b) => overlaps({ start: target, end: target + length }, b))
              )
                target += dir * step
              if (target >= min && target + length <= max)
                set({ start: target, end: target + length })
            }
          }}
          className="absolute inset-y-1 z-10 flex min-w-6 cursor-grab touch-none items-center rounded-md bg-primary px-2 text-primary-foreground text-xs shadow-md outline-none transition-[left,width] duration-(--duration-fast,150ms) ease-(--easing-emphasized,ease-out) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing motion-reduce:transition-none"
          style={{
            left: share(slot.start),
            width: `calc(${share(slot.end)} - ${share(slot.start)})`,
          }}
        >
          <span className="min-w-0 truncate font-medium tabular-nums">{time(slot.start)}</span>
          {/* The end, to drag for the length. */}
          <span
            aria-hidden="true"
            title={labels.resize}
            onPointerDown={(event) => {
              event.stopPropagation()
              event.currentTarget.parentElement?.setPointerCapture?.(event.pointerId)
              drag.current = { pointer: event.pointerId, mode: 'resize', grab: 0 }
            }}
            className="absolute inset-y-0 -right-1.5 w-3 cursor-ew-resize after:absolute after:inset-y-2 after:left-1 after:w-0.5 after:rounded-full after:bg-primary-foreground/60 pointer-coarse:w-5"
          />
        </div>
      </div>
      <p className="text-sm">
        <span className="font-medium tabular-nums">
          {time(slot.start)} – {time(slot.end)}
        </span>
        {hostTimeZone && (
          <span className="ml-2 text-muted-foreground">
            {labels.hostTime(
              time(slot.start, hostTimeZone),
              time(slot.end, hostTimeZone),
              hostTimeZone.split('/').at(-1)?.replace(/_/g, ' ') ?? hostTimeZone,
            )}
          </span>
        )}
      </p>
    </div>
  )
}

export { SlotPicker }
