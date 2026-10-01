'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

/** A value on the x axis. ISO date strings (`2026-09-01`) are read as dates. */
export type ChartXValue = Date | string | number

/** One row of chart data: the x value and one number per series, under any keys. */
export type ChartDatum = Record<string, unknown>

export interface ChartSeries {
  /** Key of the value in each row. */
  key: string
  /** Name shown in the legend, the tooltip and the data table. Defaults to the key. */
  label?: string
  /** Any CSS color. Defaults to `var(--chart-1)` to `var(--chart-5)`, in order. */
  color?: string
}

/** Props every uiness chart takes. */
export interface ChartBaseProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Rows to plot, one per x value, in order. */
  data: ChartDatum[]
  /** Key of the x value in each row. Values can be dates, ISO date strings, strings or numbers. */
  x: string
  /** What to plot from each row, and how to name and color it. */
  series: ChartSeries[]
  /** Height of the plot and its axes in pixels, legend excluded. Default 240. */
  height?: number
  /** Formats x values for the axis and the tooltip. Defaults to a short day and month for dates. */
  xFormat?: (value: ChartXValue) => string
  /** Formats numbers for the axis and the tooltip. Defaults to compact numbers on the axis. */
  yFormat?: (value: number) => string
  /** Locale for the default formats. Defaults to the browser's. */
  locale?: string
  /** Horizontal gridlines at each y tick. Default true. */
  showGrid?: boolean
  /** Legend above the plot. Clicking an entry hides its series. Default true with two series or more. */
  showLegend?: boolean
  /** Shown instead of the chart when there is nothing to plot. Default "No data". */
  empty?: React.ReactNode
}

export interface ChartResolvedSeries {
  key: string
  label: string
  color: string
  /** Position in the `series` prop. Colors follow it, so hiding a series never repaints the rest. */
  index: number
  hidden: boolean
}

/** Everything the marks of a chart need to draw themselves inside the plot. */
export interface ChartContext {
  /** Plot size in pixels, axes excluded. */
  width: number
  height: number
  /** Number of rows. */
  count: number
  series: ChartResolvedSeries[]
  /** Values per series, in the order of `series`, `null` where missing. */
  values: (number | null)[][]
  /** Horizontal center of row `i`. */
  xAt: (i: number) => number
  /** Width of one band, or distance between two points. */
  step: number
  /** Vertical position of a value. */
  y: (value: number) => number
  /** Vertical position of zero, kept inside the plot. */
  baseline: number
  /** Row under the pointer or picked with the keyboard. */
  active: number | null
  /** Unique prefix for ids inside the SVG. */
  id: string
}

const MARGIN_TOP = 8
const AXIS_HEIGHT = 26
const AXIS_GAP = 8
/** Width of one label character before the real font has been measured. */
const CHAR_WIDTH = 7
const FALLBACK_WIDTH = 600

/** A number out of anything a data row may hold, or `null` when it is missing. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T/

/** A date out of an x value, or `null` when it is not one. */
export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const day = DATE_ONLY.exec(value)
  // A bare date means that day where the reader is, not midnight UTC the day before.
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
  if (DATE_TIME.test(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/** Round step sizes of 1, 2 and 5 times a power of ten, the steps people read at a glance. */
function niceStep(span: number, count: number) {
  const raw = span / Math.max(1, count)
  const power = 10 ** Math.floor(Math.log10(raw))
  const error = raw / power
  const factor =
    error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1
  return factor * power
}

/**
 * Evenly spaced round ticks covering `min` to `max`, about `count` of them. The first and last
 * tick are the domain of the axis.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (min > max) [min, max] = [max, min]
  if (min === max) {
    if (min === 0) return niceTicks(0, 1, count)
    const pad = Math.abs(min) * 0.1
    return niceTicks(min - pad, max + pad, count)
  }
  const step = niceStep(max - min, count)
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const start = Math.floor(min / step)
  const end = Math.ceil(max / step)
  const ticks: number[] = []
  // Multiplying integers, not adding steps, keeps 0.1 + 0.2 style drift out of the labels.
  for (let i = start; i <= end; i++) ticks.push(Number((i * step).toFixed(decimals)))
  return ticks
}

type Point = [number, number]

/** Straight segments through the points. */
export function linearPath(points: Point[]): string {
  return points.map(([px, py], i) => `${i ? 'L' : 'M'}${round(px)},${round(py)}`).join('')
}

const sign = (n: number) => (n < 0 ? -1 : 1)

/**
 * A smooth curve through the points that never overshoots them, so a peak in the line is a
 * peak in the data (Fritsch and Carlson's monotone cubic, the same as d3's `curveMonotoneX`).
 */
export function monotonePath(points: Point[]): string {
  const n = points.length
  if (n < 3) return linearPath(points)
  const tangents = new Array<number>(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    const [x0, y0] = points[i - 1] as Point
    const [x1, y1] = points[i] as Point
    const [x2, y2] = points[i + 1] as Point
    const h0 = x1 - x0
    const h1 = x2 - x1
    const s0 = h0 ? (y1 - y0) / h0 : 0
    const s1 = h1 ? (y2 - y1) / h1 : 0
    const p = (s0 * h1 + s1 * h0) / (h0 + h1 || 1)
    tangents[i] =
      (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }
  const endTangent = (a: Point, b: Point, t: number) => {
    const h = b[0] - a[0]
    return h ? (3 * (b[1] - a[1])) / h / 2 - t / 2 : t
  }
  tangents[0] = endTangent(points[0] as Point, points[1] as Point, tangents[1] as number)
  tangents[n - 1] = endTangent(
    points[n - 2] as Point,
    points[n - 1] as Point,
    tangents[n - 2] as number,
  )
  let d = `M${round(points[0]?.[0] ?? 0)},${round(points[0]?.[1] ?? 0)}`
  for (let i = 1; i < n; i++) {
    const [x0, y0] = points[i - 1] as Point
    const [x1, y1] = points[i] as Point
    const dx = (x1 - x0) / 3
    const t0 = tangents[i - 1] as number
    const t1 = tangents[i] as number
    d += `C${round(x0 + dx)},${round(y0 + dx * t0)} ${round(x1 - dx)},${round(y1 - dx * t1)} ${round(x1)},${round(y1)}`
  }
  return d
}

/**
 * A bar from `from` (its base) to `to` (its data end), with only the data end rounded. Works for
 * bars growing up and down.
 */
export function barPath(x: number, width: number, from: number, to: number, radius = 4): string {
  const h = Math.abs(to - from)
  if (h === 0 || width <= 0) return ''
  // Thin bars get a smaller radius, so a dense month of bars does not turn into a row of pills.
  const r = Math.min(radius, width / 3, h)
  const up = to < from
  const d = up ? 1 : -1
  const sweep = up ? 1 : 0
  const right = x + width
  return (
    `M${round(x)},${round(from)}V${round(to + d * r)}` +
    `A${r},${r} 0 0 ${sweep} ${round(x + r)},${round(to)}H${round(right - r)}` +
    `A${r},${r} 0 0 ${sweep} ${round(right)},${round(to + d * r)}V${round(from)}Z`
  )
}

const round = (n: number) => Math.round(n * 100) / 100

/** Splits a series at its missing values, so lines leave a gap instead of bridging it. */
export function segments(values: (number | null)[]): { index: number; value: number }[][] {
  const runs: { index: number; value: number }[][] = []
  let run: { index: number; value: number }[] = []
  values.forEach((value, index) => {
    if (value === null) {
      if (run.length) runs.push(run)
      run = []
    } else run.push({ index, value })
  })
  if (run.length) runs.push(run)
  return runs
}

/** The default color of the series at `index`. Past five it reads `--chart-6` and on if you define them. */
export function seriesColor(index: number) {
  const n = index + 1
  return n <= 5 ? `var(--chart-${n})` : `var(--chart-${n}, var(--chart-${(index % 5) + 1}))`
}

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Width of an element, kept up to date as it resizes. 0 until measured. */
export function useElementWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState(0)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return Math.round(width)
}

/**
 * Plays an entrance on the element once, when it mounts. Skipped with reduced motion and where
 * the Web Animations API is missing. Runs before paint so the final frame never flashes first.
 */
export function useChartIntro<T extends Element>(
  ref: React.RefObject<T | null>,
  play: (el: T) => void,
) {
  const reduced = useReducedMotion()
  const playRef = React.useRef(play)
  playRef.current = play
  const reducedRef = React.useRef(reduced)
  reducedRef.current = reduced
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedRef.current || typeof (el as Element).animate !== 'function') return
    playRef.current(el)
  }, [ref])
}

function formatters(locale: string | undefined) {
  return {
    axisDate: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    tipDate: new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }),
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
  }
}

export interface ChartFrameProps extends ChartBaseProps {
  /** Names the chart in its summary and picks the legend swatch. */
  kind: 'bar' | 'line'
  /** `band` centers each row in a slot, for bars. `point` spreads rows edge to edge, for lines. */
  scale: 'band' | 'point'
  /** Lowest and highest value the y axis has to reach, from the visible series. */
  extent?: (values: (number | null)[][]) => [number, number]
  /** Keep zero on the y axis. Default true. */
  includeZero?: boolean
  /** Draws the marks, inside the plot, from the shared scales. */
  children: (ctx: ChartContext) => React.ReactNode
}

function defaultExtent(values: (number | null)[][]): [number, number] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const list of values) {
    for (const v of list) {
      if (v === null) continue
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  return [min, max]
}

/**
 * The frame every uiness chart shares: sizing, scales, axes, grid, legend, tooltip, keyboard
 * reading, the screen reader table and the empty state. A chart type only draws its marks.
 */
export function ChartFrame({
  kind,
  scale,
  extent = defaultExtent,
  includeZero = true,
  data,
  x,
  series,
  height = 240,
  xFormat,
  yFormat,
  locale,
  showGrid = true,
  showLegend,
  empty,
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: ChartFrameProps) {
  const plotRef = React.useRef<HTMLDivElement>(null)
  const measured = useElementWidth(plotRef)
  const width = measured || FALLBACK_WIDTH
  const id = `chart${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set())
  const [active, setActive] = React.useState<number | null>(null)
  const [fromKeyboard, setFromKeyboard] = React.useState(false)

  const fmt = React.useMemo(() => formatters(locale), [locale])
  const [charWidth, setCharWidth] = React.useState(CHAR_WIDTH)
  const count = data.length

  const resolved = React.useMemo<ChartResolvedSeries[]>(
    () =>
      series.map((s, index) => ({
        key: s.key,
        label: s.label ?? s.key,
        color: s.color ?? seriesColor(index),
        index,
        hidden: hidden.has(s.key),
      })),
    [series, hidden],
  )
  const values = React.useMemo(
    () => series.map((s) => data.map((row) => toNumber(row[s.key]))),
    [series, data],
  )
  const isEmpty = count === 0 || values.every((list) => list.every((v) => v === null))

  const formatX = (value: unknown, tooltip = false): string => {
    if (xFormat) return xFormat(value as ChartXValue)
    const date = toDate(value)
    if (date) return (tooltip ? fmt.tipDate : fmt.axisDate).format(date)
    if (typeof value === 'number') return fmt.number.format(value)
    return value == null ? '' : String(value)
  }
  const xLabels = data.map((row) => formatX(row[x]))

  // Layout: y labels on the left, x labels below, room on the right for the last x label.
  const plotHeight = Math.max(20, height - MARGIN_TOP - AXIS_HEIGHT)
  const visibleValues = values.filter((_, i) => !resolved[i]?.hidden)
  let [min, max] = extent(visibleValues)
  if (!Number.isFinite(min) || !Number.isFinite(max)) [min, max] = [0, 1]
  if (includeZero) [min, max] = [Math.min(0, min), Math.max(0, max)]
  const ticks = niceTicks(min, max, Math.max(2, Math.floor(plotHeight / 50)))
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] ?? 1
  const step = hi - lo === 0 ? 1 : (ticks[1] ?? hi) - lo
  const stepDecimals = Math.max(0, -Math.floor(Math.log10(Math.abs(step) || 1)))
  const axisNumber = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: Math.min(20, Math.max(2, stepDecimals)),
      }),
    [locale, stepDecimals],
  )
  const formatY = (v: number) => (yFormat ? yFormat(v) : axisNumber.format(v))
  const formatValue = (v: number | null) =>
    v === null ? '–' : yFormat ? yFormat(v) : fmt.number.format(v)
  const yLabels = ticks.map(formatY)

  const longestX = xLabels.reduce((m, l) => Math.max(m, l.length), 0)
  const xLabelWidth = longestX * charWidth + 8
  const left = Math.ceil(yLabels.reduce((m, l) => Math.max(m, l.length), 0) * charWidth) + AXIS_GAP
  const right =
    scale === 'point'
      ? Math.ceil(xLabelWidth / 2)
      : Math.max(4, Math.ceil(xLabelWidth / 2 - (width - left) / Math.max(1, count) / 2))
  const plotWidth = Math.max(20, width - left - right)
  const xStep =
    scale === 'band' ? plotWidth / Math.max(1, count) : count > 1 ? plotWidth / (count - 1) : 0
  const xAt = (i: number) =>
    scale === 'band' ? (i + 0.5) * xStep : count > 1 ? i * xStep : plotWidth / 2
  const y = (v: number) => plotHeight - ((v - lo) / (hi - lo || 1)) * plotHeight
  const baseline = Math.min(plotHeight, Math.max(0, y(0)))

  // Thin the x labels until they fit, always keeping the last row, the most recent one.
  const fits = Math.max(1, Math.floor(plotWidth / (xLabelWidth + 8)))
  const labelEvery = Math.max(1, Math.ceil(count / fits))

  const ctx: ChartContext = {
    width: plotWidth,
    height: plotHeight,
    count,
    series: resolved,
    values,
    xAt,
    step: xStep,
    y,
    baseline,
    active,
    id,
  }

  // Margins come from label lengths times a character width. Measuring that width in the font
  // actually used, once it has rendered, keeps wide fonts from spilling out of the left edge.
  const labelKey = `${yLabels.join('|')}/${longestX}`
  useIsoLayoutEffect(() => {
    const labels = plotRef.current?.querySelectorAll<SVGTextElement>('text')
    let widest = 0
    for (const label of labels ?? []) {
      const chars = label.textContent?.length ?? 0
      if (!chars || typeof label.getComputedTextLength !== 'function') continue
      widest = Math.max(widest, label.getComputedTextLength() / chars)
    }
    if (widest > 0 && Math.abs(widest - charWidth) > 0.25) setCharWidth(widest)
  }, [labelKey, width, charWidth])

  const indexAt = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const ratio = rect.width ? width / rect.width : 1
    const px = (clientX - rect.left) * ratio - left
    const raw = scale === 'band' ? Math.floor(px / (xStep || 1)) : Math.round(px / (xStep || 1))
    return Math.min(count - 1, Math.max(0, raw))
  }

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    setFromKeyboard(false)
    setActive(indexAt(e.clientX, e.currentTarget))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null | undefined
    if (e.key === 'ArrowRight') next = active === null ? 0 : active + 1
    else if (e.key === 'ArrowLeft') next = active === null ? count - 1 : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = count - 1
    else if (e.key === 'Escape') next = null
    if (next === undefined) return
    e.preventDefault()
    setFromKeyboard(true)
    setActive(next === null ? null : Math.min(count - 1, Math.max(0, next)))
  }

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      // Hiding the last visible series would leave an empty frame and nothing to click back.
      else if (resolved.filter((s) => !s.hidden).length > 1) next.add(key)
      return next
    })

  const visible = resolved.filter((s) => !s.hidden)
  const legend = showLegend ?? series.length > 1
  const name = kind === 'bar' ? 'Bar chart' : 'Line chart'
  const summary =
    ariaLabel ??
    `${name} of ${resolved.map((s) => s.label).join(', ')}, ${count} ${count === 1 ? 'point' : 'points'}` +
      (count
        ? `, from ${formatX(data[0]?.[x], true)} to ${formatX(data[count - 1]?.[x], true)}`
        : '')
  const readout =
    active === null
      ? ''
      : `${formatX(data[active]?.[x], true)}: ${visible
          .map((s) => `${s.label} ${formatValue(values[s.index]?.[active] ?? null)}`)
          .join(', ')}`

  if (isEmpty) {
    return (
      <div
        data-slot="chart"
        data-chart={kind}
        data-empty=""
        className={cn(
          'flex w-full items-center justify-center text-muted-foreground text-sm',
          className,
        )}
        style={{ height }}
        {...props}
      >
        <div data-slot="chart-empty">{empty ?? 'No data'}</div>
      </div>
    )
  }

  const activeX = active === null ? 0 : ((left + xAt(active)) / width) * 100

  return (
    <div
      data-slot="chart"
      data-chart={kind}
      className={cn('flex w-full min-w-0 flex-col gap-3', className)}
      {...props}
    >
      {legend && (
        <div data-slot="chart-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {resolved.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={!s.hidden}
              onClick={() => toggle(s.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm text-muted-foreground text-xs outline-none transition-opacity hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                s.hidden && 'opacity-50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'shrink-0',
                  kind === 'bar' ? 'size-2.5 rounded-[3px]' : 'h-0.5 w-3 rounded-full',
                )}
                style={{ background: s.hidden ? 'var(--muted-foreground)' : s.color }}
              />
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative w-full" style={{ height }}>
        <div
          ref={plotRef}
          role="img"
          aria-label={`${summary}. Use the arrow keys to read each point.`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the chart takes focus so the arrow keys can read it point by point
          tabIndex={0}
          data-slot="chart-plot"
          className="h-full w-full touch-pan-y rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <svg
            aria-hidden
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block overflow-visible"
          >
            <g transform={`translate(${left},${MARGIN_TOP})`}>
              {ticks.map((t, i) => (
                <g key={t} data-slot="chart-y-tick">
                  {(showGrid || t === 0) && (
                    <line
                      x1={0}
                      x2={plotWidth}
                      y1={round(y(t))}
                      y2={round(y(t))}
                      className="stroke-border"
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                    />
                  )}
                  <text
                    x={-AXIS_GAP}
                    y={y(t)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px] tabular-nums"
                  >
                    {yLabels[i]}
                  </text>
                </g>
              ))}
              {active !== null &&
                (scale === 'band' ? (
                  <rect
                    data-slot="chart-cursor"
                    x={xAt(active) - xStep / 2}
                    width={xStep}
                    y={0}
                    height={plotHeight}
                    className="fill-muted-foreground/10"
                  />
                ) : (
                  <line
                    data-slot="chart-cursor"
                    x1={xAt(active)}
                    x2={xAt(active)}
                    y1={0}
                    y2={plotHeight}
                    className="stroke-muted-foreground/40"
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                  />
                ))}
              {children(ctx)}
              {xLabels.map((label, i) =>
                (count - 1 - i) % labelEvery === 0 ? (
                  <text
                    // biome-ignore lint/suspicious/noArrayIndexKey: labels are positional
                    key={i}
                    data-slot="chart-x-tick"
                    x={xAt(i)}
                    y={plotHeight + AXIS_GAP}
                    dy="0.71em"
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px] tabular-nums"
                  >
                    {label}
                  </text>
                ) : null,
              )}
            </g>
          </svg>
        </div>
        {active !== null && (
          <div
            data-slot="chart-tooltip"
            aria-hidden
            className="pointer-events-none absolute z-(--z-raised,10) min-w-36 rounded-md border bg-popover px-2.5 py-2 text-popover-foreground text-xs shadow-md"
            style={{
              top: MARGIN_TOP,
              left: `${activeX}%`,
              transform: activeX > 55 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
            }}
          >
            <div className="mb-1.5 font-medium">{formatX(data[active]?.[x], true)}</div>
            <div className="grid gap-1">
              {visible.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className="h-0.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto pl-3 font-medium tabular-nums">
                    {formatValue(values[s.index]?.[active] ?? null)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div aria-live="polite" className="sr-only">
        {fromKeyboard ? readout : ''}
      </div>
      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">{x}</th>
            {resolved.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
            <tr key={i}>
              <th scope="row">{formatX(row[x], true)}</th>
              {resolved.map((s) => (
                <td key={s.key}>{formatValue(values[s.index]?.[i] ?? null)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
