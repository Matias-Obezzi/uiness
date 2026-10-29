'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { Odometer } from '@/components/ui/odometer'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TeamSelectorLabels {
  /** Names the number. */
  seats: string
  more: string
  fewer: string
  /** After the price. */
  per: string
  /** How to change the number by dragging, for screen readers. */
  hint: string
}

export const defaultTeamSelectorLabels: TeamSelectorLabels = {
  seats: 'Seats',
  more: 'Add a seat',
  fewer: 'Remove a seat',
  per: 'per month',
  hint: 'Drag sideways or use the arrow keys to change it.',
}

/** Pixels of drag per seat. */
const PX_PER_SEAT = 14
/** Avatars drawn before the rest becomes a count. */
const SHOWN = 7

/** A soft two-color gradient for avatar `n`, the same every time. */
function avatar(n: number) {
  const hue = (n * 137.5) % 360
  return `linear-gradient(135deg, oklch(0.78 0.12 ${hue}), oklch(0.62 0.16 ${(hue + 40) % 360}))`
}

export interface TeamSelectorProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  value?: number
  defaultValue?: number
  onValueChange?: (seats: number) => void
  /** Default 1 and 500. */
  min?: number
  max?: number
  /** Price of one seat, for the price line. Leave out for no price. */
  pricePerSeat?: number
  currency?: string
  locale?: string
  labels?: Partial<TeamSelectorLabels>
}

/**
 * How many seats a plan has. Drag the number sideways to scrub it, or step it with the
 * buttons or the arrow keys; a row of generated avatars grows with it, and the price rolls to
 * the new total.
 */
function TeamSelector({
  value,
  defaultValue = 5,
  onValueChange,
  min = 1,
  max = 500,
  pricePerSeat,
  currency = 'USD',
  locale,
  labels: labelsProp,
  className,
  ...props
}: TeamSelectorProps) {
  const labels = useLabels('team-selector', defaultTeamSelectorLabels, labelsProp)
  const [own, setOwn] = React.useState(defaultValue)
  const seats = value ?? own
  const drag = React.useRef<{ pointer: number; x: number; from: number } | null>(null)
  const hintId = React.useId()

  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next)))
    if (clamped === seats) return
    if (value === undefined) setOwn(clamped)
    onValueChange?.(clamped)
  }
  const shown = Math.min(seats, SHOWN)

  return (
    <div
      data-slot="team-selector"
      className={cn('flex w-full max-w-xs flex-col items-center gap-4', className)}
      {...props}
    >
      <div className="flex h-9 items-center" aria-hidden="true">
        {Array.from({ length: shown }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: avatar n is always the same
            key={i}
            className="-ml-2 size-9 rounded-full border-2 border-background first:ml-0 animate-in fade-in zoom-in-50 duration-(--duration-normal,200ms) motion-reduce:animate-none"
            style={{ background: avatar(i) }}
          />
        ))}
        {seats > SHOWN && (
          <span className="-ml-2 flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-background bg-muted px-1.5 font-medium text-xs tabular-nums">
            +{seats - SHOWN}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <StepButton label={labels.fewer} disabled={seats <= min} onClick={() => set(seats - 1)}>
          <MinusIcon />
        </StepButton>
        <div
          role="spinbutton"
          tabIndex={0}
          aria-label={labels.seats}
          aria-describedby={hintId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={seats}
          onKeyDown={(event) => {
            const by: Record<string, number> = {
              ArrowUp: 1,
              ArrowRight: 1,
              ArrowDown: -1,
              ArrowLeft: -1,
              PageUp: 10,
              PageDown: -10,
            }
            if (event.key === 'Home') set(min)
            else if (event.key === 'End') set(max)
            else if (by[event.key]) set(seats + (by[event.key] as number))
            else return
            event.preventDefault()
          }}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return
            event.currentTarget.setPointerCapture?.(event.pointerId)
            drag.current = { pointer: event.pointerId, x: event.clientX, from: seats }
          }}
          onPointerMove={(event) => {
            const d = drag.current
            if (d && d.pointer === event.pointerId)
              set(d.from + (event.clientX - d.x) / PX_PER_SEAT)
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
          className="min-w-24 cursor-ew-resize touch-none select-none rounded-lg px-2 text-center font-semibold text-5xl tabular-nums tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {seats}
        </div>
        <StepButton label={labels.more} disabled={seats >= max} onClick={() => set(seats + 1)}>
          <PlusIcon />
        </StepButton>
      </div>
      <p className="text-muted-foreground text-sm">{labels.seats}</p>
      {pricePerSeat !== undefined && (
        <p className="flex items-baseline gap-1.5">
          <span className="font-semibold text-xl">
            <Odometer
              value={seats * pricePerSeat}
              decimals={2}
              locale={locale}
              format={{ style: 'currency', currency }}
              duration={500}
            />
          </span>
          <span className="text-muted-foreground text-sm">{labels.per}</span>
        </p>
      )}
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
    </div>
  )
}

function StepButton({
  label,
  className,
  ...props
}: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border bg-background outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40 pointer-coarse:size-11 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export { TeamSelector }
