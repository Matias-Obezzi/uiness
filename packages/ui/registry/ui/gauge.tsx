'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface GaugeThreshold {
  /** Where the band starts. It runs to the next threshold, or to `max`. */
  value: number
  /** Any CSS color for the band. */
  color: string
  /** A word for the band, like "Healthy", shown under the value and read by screen readers. */
  label?: string
}

export interface GaugeProps extends Omit<React.ComponentProps<'div'>, 'children' | 'color'> {
  /** The value to show. Clamped to the range. */
  value: number
  /** Start of the range. Default 0. */
  min?: number
  /** End of the range. Default 100. */
  max?: number
  /** `arc` is a half circle opening down, `ring` a full circle. Default `arc`. */
  variant?: 'arc' | 'ring'
  /** Colored bands from low to high. Without them the gauge is one color. */
  thresholds?: GaugeThreshold[]
  /** Fill color without thresholds. Default `var(--chart-1)`. */
  color?: string
  /** A needle pointing at the value. Arc only. Default false. */
  needle?: boolean
  /** Caption under the value, like "CPU". Also names the meter when it is a string. */
  label?: React.ReactNode
  /** Width in pixels; the gauge scales down to fit narrower containers. Default 180. */
  size?: number
  /** Width of the arc in pixels at full size. Default 14. */
  thickness?: number
  /** Formats the value in the centre and for screen readers. Defaults to the locale's number format. */
  formatValue?: (value: number) => string
  /** Locale of the default format. Defaults to the browser's. */
  locale?: string
  /** Min and max under the ends of the arc. Default true for `arc`. */
  showRange?: boolean
  /** Milliseconds the arc and the number take to reach a new value. Default 900. */
  duration?: number
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

/** Eases from what is on screen to `target`; jumps with reduced motion. */
function useTween(target: number, from: number, duration: number, reduced: boolean) {
  const [shown, setShown] = React.useState(reduced ? target : from)
  const shownRef = React.useRef(shown)
  shownRef.current = shown

  React.useEffect(() => {
    if (reduced || typeof requestAnimationFrame !== 'function') {
      setShown(target)
      return
    }
    const start = shownRef.current
    let frame = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const t = Math.min(1, (now - t0) / duration)
      setShown(start + (target - start) * easeOut(t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reduced])

  return shown
}

/**
 * A value against a known range, as a half or full circle. Thresholds split the track into
 * colored bands, filled up to the value and left faint above it. Read as a `meter` by screen
 * readers, with the band label in the value text.
 */
function Gauge({
  value,
  min = 0,
  max = 100,
  variant = 'arc',
  thresholds,
  color = 'var(--chart-1)',
  needle = false,
  label,
  size = 180,
  thickness = 14,
  formatValue,
  locale,
  showRange,
  duration = 900,
  className,
  style,
  'aria-label': ariaLabel,
  ...props
}: GaugeProps) {
  const reduced = useReducedMotion()
  const labelId = React.useId()
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const clamped = Math.min(hi, Math.max(lo, value))
  const shown = useTween(clamped, lo, duration, reduced)

  const numberFormat = React.useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  )
  const fmt = formatValue ?? ((v: number) => numberFormat.format(v))

  const ring = variant === 'ring'
  const withNeedle = needle && !ring
  const S = size
  const T = thickness
  const cx = S / 2
  const cy = S / 2
  const r = (S - T) / 2
  const sweep = ring ? Math.PI * 2 : Math.PI
  const startAngle = ring ? -Math.PI / 2 : Math.PI
  const height = ring ? S : S / 2 + Math.max(T / 2, withNeedle ? 6 : 0) + 1

  const toT = (v: number) => (hi === lo ? 0 : (v - lo) / (hi - lo))
  const point = (t: number) => {
    const a = startAngle + t * sweep
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  }
  const arc = (t0: number, t1: number): string => {
    const span = t1 - t0
    if (span <= 0) return ''
    // A full turn cannot be one arc command: the start and end points coincide.
    if (span >= 0.9999) return `${arc(t0, t0 + 0.5)}${arc(t0 + 0.5, t1 - 0.0001)}`
    const [x0, y0] = point(t0)
    const [x1, y1] = point(t1)
    const large = span * sweep > Math.PI ? 1 : 0
    return `M${x0.toFixed(3)},${y0.toFixed(3)}A${r},${r} 0 ${large} 1 ${x1.toFixed(3)},${y1.toFixed(3)}`
  }

  const bands = React.useMemo(() => {
    const sorted = [...(thresholds ?? [])]
      .filter((b) => b.value < hi)
      .sort((a, b) => a.value - b.value)
    if (!sorted.length) return [{ from: lo, to: hi, color, label: undefined as string | undefined }]
    const out = sorted.map((b, i) => ({
      from: Math.max(lo, b.value),
      to: Math.min(hi, sorted[i + 1]?.value ?? hi),
      color: b.color,
      label: b.label,
    }))
    const first = out[0]
    if (first && first.from > lo) out.unshift({ from: lo, to: first.from, color, label: undefined })
    return out.filter((b) => b.to > b.from)
  }, [thresholds, lo, hi, color])

  const activeBand =
    bands.find((b) => clamped >= b.from && clamped < b.to) ?? bands[bands.length - 1]
  // Two pixels of page between bands, measured along the arc.
  const gapT = bands.length > 1 ? 2 / r / sweep : 0
  const tShown = toT(shown)

  const text = fmt(clamped)
  const valueText = activeBand?.label ? `${text}, ${activeBand.label}` : text
  const caption = label ?? activeBand?.label
  const range = showRange ?? !ring

  return (
    // biome-ignore lint/a11y/useSemanticElements: a native meter draws its own bar and cannot hold this one
    <div
      role="meter"
      aria-valuemin={lo}
      aria-valuemax={hi}
      aria-valuenow={clamped}
      aria-valuetext={valueText}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      aria-labelledby={ariaLabel || typeof label === 'string' || !label ? undefined : labelId}
      data-slot="gauge"
      data-variant={variant}
      className={cn('@container relative inline-flex max-w-full flex-col items-center', className)}
      style={{ width: size, ...style }}
      {...props}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${S} ${height}`}
        width="100%"
        className="block overflow-visible"
      >
        {bands.map((band, i) => {
          const t0 = toT(band.from) + (i > 0 ? gapT / 2 : 0)
          const t1 = toT(band.to) - (i < bands.length - 1 ? gapT / 2 : 0)
          const filledTo = Math.min(t1, Math.max(t0, tShown))
          return (
            <g key={`${band.from}-${band.to}`} data-slot="gauge-band">
              <path
                d={arc(t0, t1)}
                fill="none"
                stroke={`color-mix(in oklab, ${band.color} 22%, var(--muted))`}
                strokeWidth={T}
              />
              {filledTo > t0 && (
                <path
                  data-slot="gauge-fill"
                  d={arc(t0, filledTo)}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={T}
                />
              )}
            </g>
          )
        })}
        {withNeedle && (
          <g
            data-slot="gauge-needle"
            transform={`rotate(${(tShown * 180).toFixed(2)} ${cx} ${cy})`}
            className="text-foreground"
          >
            <path
              d={`M${cx - r + T / 2 + 6},${cy}L${cx},${cy - 2.5}L${cx},${cy + 2.5}Z`}
              fill="currentColor"
            />
            <circle
              cx={cx}
              cy={cy}
              r={6}
              fill="currentColor"
              stroke="var(--background)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {range && (
        <div
          aria-hidden
          className="flex w-full justify-between text-muted-foreground text-xs tabular-nums"
          style={{ paddingInline: `${(T / S) * 50}%` }}
        >
          <span className="-translate-x-1/2">{fmt(lo)}</span>
          <span className="translate-x-1/2">{fmt(hi)}</span>
        </div>
      )}

      <div
        aria-hidden
        className={cn(
          'pointer-events-none flex flex-col items-center text-center leading-none',
          ring && 'absolute inset-0 justify-center',
          !ring && !withNeedle && 'absolute inset-x-0 bottom-0',
          withNeedle && 'mt-1',
        )}
      >
        <span
          data-slot="gauge-value"
          className="font-semibold tabular-nums tracking-tight"
          style={{ fontSize: ring ? '18cqw' : '17cqw' }}
        >
          {fmt(shown)}
        </span>
        {caption && (
          <span
            id={labelId}
            data-slot="gauge-label"
            className="mt-1.5 text-muted-foreground"
            style={{ fontSize: 'clamp(0.7rem, 7cqw, 0.875rem)' }}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}

export { Gauge }
