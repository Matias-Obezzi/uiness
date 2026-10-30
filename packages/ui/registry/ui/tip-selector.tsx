'use client'

import * as React from 'react'
import { Odometer } from '@/components/ui/odometer'
import { Switch } from '@/components/ui/switch'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TipSelectorLabels {
  /** Names the tape. */
  tip: string
  /** The tape's value. */
  percent: (percent: number) => string
  tipAmount: string
  total: string
  roundUp: string
}

export const defaultTipSelectorLabels: TipSelectorLabels = {
  tip: 'Tip',
  percent: (percent) => `${percent}%`,
  tipAmount: 'Tip',
  total: 'Total',
  roundUp: 'Round up the total',
}

/** Pixels between ticks on the tape. */
const TICK = 12

/** The tip for a share of the subtotal, or, rounding up, what makes the total whole. */
export function tipFor(subtotal: number, percent: number, roundUp: boolean, decimals = 2) {
  const factor = 10 ** decimals
  const tip = Math.round(subtotal * percent * factor) / factor / 100
  if (!roundUp) return tip
  return Math.round((Math.ceil(subtotal + tip) - subtotal) * factor) / factor
}

export interface TipSelectorProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  subtotal: number
  /** The tip in percent, when you keep it. */
  value?: number
  defaultValue?: number
  onValueChange?: (percent: number) => void
  /** Called with the tip and the total as they change. */
  onTipChange?: (tip: number, total: number) => void
  /** Default 30. */
  max?: number
  currency?: string
  locale?: string
  labels?: Partial<TipSelectorLabels>
}

/**
 * A tip picker for checkout, set on a tape you drag and flick. The ticks passed fill in, the
 * tip and total roll to their new amounts, and Round up makes the total a whole amount. On the
 * keyboard the tape is a slider.
 */
function TipSelector({
  subtotal,
  value,
  defaultValue = 18,
  onValueChange,
  onTipChange,
  max = 30,
  currency = 'USD',
  locale,
  labels: labelsProp,
  className,
  ...props
}: TipSelectorProps) {
  const labels = useLabels('tip-selector', defaultTipSelectorLabels, labelsProp)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue)
  const percent = value ?? own
  const [roundUp, setRoundUp] = React.useState(false)
  const switchId = React.useId()
  const tape = React.useRef<HTMLDivElement>(null)
  const settled = React.useRef(percent)
  // While the tape scrolls itself to a value, its scrolling is not a choice.
  const moving = React.useRef<number | null>(null)
  const first = React.useRef(true)
  // A mouse cannot drag native scrolling, so it gets a drag of its own.
  const drag = React.useRef<{ x: number; left: number; samples: [number, number][] } | null>(null)

  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(0, Math.round(next)))
    if (clamped === percent) return
    if (value === undefined) setOwn(clamped)
    onValueChange?.(clamped)
  }

  // The tape follows the value when it changes from anything but scrolling it.
  React.useEffect(() => {
    const el = tape.current
    const instant = first.current || reduced
    first.current = false
    if (!el || Math.round(el.scrollLeft / TICK) === percent) return
    moving.current = instant ? null : percent
    settled.current = percent
    el.scrollTo({ left: percent * TICK, behavior: instant ? 'auto' : 'smooth' })
  }, [percent, reduced])

  const tip = tipFor(subtotal, percent, roundUp)
  const total = subtotal + tip
  const tipRef = React.useRef(onTipChange)
  React.useEffect(() => {
    tipRef.current = onTipChange
  })
  React.useEffect(() => {
    tipRef.current?.(tip, total)
  }, [tip, total])
  const money: Intl.NumberFormatOptions = { style: 'currency', currency }

  return (
    <div
      data-slot="tip-selector"
      className={cn('flex w-full max-w-sm flex-col gap-4', className)}
      {...props}
    >
      <p className="text-center font-semibold text-3xl tabular-nums">{labels.percent(percent)}</p>
      <div className="relative">
        {/* The fixed needle the tape runs under. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-primary"
        />
        <div
          ref={tape}
          role="slider"
          tabIndex={0}
          aria-label={labels.tip}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={percent}
          aria-valuetext={labels.percent(percent)}
          onScroll={(event) => {
            const at = Math.round(event.currentTarget.scrollLeft / TICK)
            if (moving.current !== null) {
              if (at === moving.current) moving.current = null
              return
            }
            if (at !== settled.current) {
              settled.current = at
              set(at)
            }
          }}
          onPointerDown={(event) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return
            drag.current = {
              x: event.clientX,
              left: event.currentTarget.scrollLeft,
              samples: [[event.timeStamp, event.clientX]],
            }
          }}
          onPointerMove={(event) => {
            const d = drag.current
            if (!d) return
            const el = event.currentTarget
            if (el.style.scrollSnapType !== 'none') {
              if (Math.abs(event.clientX - d.x) < 4) return
              // Snapping would pull it back tick by tick while it follows the pointer.
              el.style.scrollSnapType = 'none'
              el.setPointerCapture(event.pointerId)
            }
            d.samples = [...d.samples.slice(-4), [event.timeStamp, event.clientX]]
            el.scrollLeft = d.left - (event.clientX - d.x)
          }}
          onPointerUp={(event) => {
            const d = drag.current
            drag.current = null
            const el = event.currentTarget
            if (!d || el.style.scrollSnapType !== 'none') return
            const first = d.samples[0] as [number, number]
            const speed = (event.clientX - first[1]) / Math.max(16, event.timeStamp - first[0])
            // A flick carries on a little, as native momentum would, then lands on a tick.
            const at = Math.round((el.scrollLeft - (reduced ? 0 : speed * 240)) / TICK)
            el.scrollTo({
              left: Math.min(max, Math.max(0, at)) * TICK,
              behavior: reduced ? 'auto' : 'smooth',
            })
            window.setTimeout(() => {
              el.style.scrollSnapType = ''
            }, 400)
          }}
          onKeyDown={(event) => {
            const by =
              event.key === 'ArrowRight' || event.key === 'ArrowUp'
                ? 1
                : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                  ? -1
                  : event.key === 'PageUp'
                    ? 5
                    : event.key === 'PageDown'
                      ? -5
                      : null
            if (event.key === 'Home') set(0)
            else if (event.key === 'End') set(max)
            else if (by !== null) set(percent + by)
            else return
            event.preventDefault()
          }}
          className="relative flex h-16 cursor-grab snap-x snap-mandatory overflow-x-auto active:cursor-grabbing overscroll-x-contain rounded-xl border bg-muted/40 outline-none [mask-image:linear-gradient(90deg,transparent,#000_20%,#000_80%,transparent)] [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
          style={{ paddingInline: `calc(50% - ${TICK / 2}px)` }}
        >
          {Array.from({ length: max + 1 }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: one tick per percent
              key={i}
              aria-hidden="true"
              className="relative flex shrink-0 snap-center flex-col items-center justify-end pb-2"
              style={{ width: TICK }}
            >
              <span
                className={cn(
                  'w-px rounded-full transition-colors duration-(--duration-fast,150ms)',
                  i % 5 === 0 ? 'h-6' : 'h-3',
                  i <= percent ? 'bg-primary' : 'bg-muted-foreground/40',
                )}
              />
              {i % 5 === 0 && (
                <span className="absolute top-1.5 text-[10px] text-muted-foreground tabular-nums">
                  {i}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground text-xs">{labels.tipAmount}</dt>
          <dd className="font-semibold text-base">
            <Odometer value={tip} decimals={2} locale={locale} format={money} duration={500} />
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground text-xs">{labels.total}</dt>
          <dd className="font-semibold text-base">
            <Odometer value={total} decimals={2} locale={locale} format={money} duration={500} />
          </dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label htmlFor={switchId}>{labels.roundUp}</label>
        <Switch id={switchId} checked={roundUp} onCheckedChange={setRoundUp} />
      </div>
    </div>
  )
}

export { TipSelector }
