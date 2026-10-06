'use client'

import * as React from 'react'
import { matchByDataKey, Pie, PieChart, type PieSectorShapeProps, Sector } from 'recharts'
import { type ChartConfig, ChartContainer, ChartEmpty, seriesColor } from '@/components/ui/chart'
import { Odometer } from '@/components/ui/odometer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface DonutChartDatum {
  /** Stable identity of the slice. Becomes `--color-<key>`, so keep it to letters, digits, `-` and `_`. */
  key: string
  /** Name in the legend and the centre. Defaults to the key. */
  label?: string
  /** Size of the slice. */
  value: number
  /** Any CSS color. Defaults to `var(--chart-1)` to `var(--chart-5)`, in order. */
  color?: string
}

export interface DonutChartLabels {
  /** Caption of the total in the centre. */
  total: string
  /** Name of the chart. Each slice comes as "Name: 40%", then the caption and the formatted total. */
  summary: (slices: string[], caption: string, total: string) => string
}

export const defaultDonutChartLabels: DonutChartLabels = {
  total: 'Total',
  summary: (slices, caption, total) => `Donut chart, ${slices.join(', ')}. ${caption} ${total}.`,
}

export interface DonutChartProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The slices, in order clockwise from the top. */
  data: DonutChartDatum[]
  /** Diameter of the donut in pixels. Default 200. */
  size?: number
  /** Width of the ring in pixels. Default 28. */
  thickness?: number
  /** Caption of the total in the centre. Default "Total". */
  label?: React.ReactNode
  /** Extra Intl.NumberFormat options for values, for currency or units. */
  format?: Intl.NumberFormatOptions
  /** Locale of the formats. Defaults to the browser's. */
  locale?: string
  /** Legend next to the donut, where a click hides or shows a slice. Default true. */
  showLegend?: boolean
  /** Shown in place of the chart when every value is zero or missing. Default "No data". */
  empty?: React.ReactNode
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<DonutChartLabels>
}

// How far the slice under the pointer grows out of the ring.
const LIFT = 5

/**
 * Parts of a whole as a ring, on recharts through `ChartContainer`. The centre shows the total,
 * or the slice under the pointer, and rolls to each new value. Legend entries hide and show
 * slices, and hovering or focusing one highlights its slice.
 */
function DonutChart({
  data,
  size = 200,
  thickness = 28,
  label: labelProp,
  format,
  locale: localeProp,
  showLegend = true,
  empty,
  labels: labelsProp,
  className,
  'aria-label': ariaLabel,
  ...props
}: DonutChartProps) {
  const labels = useLabels('donut-chart', defaultDonutChartLabels, labelsProp)
  const locale = useLocale(localeProp)
  const label = labelProp ?? labels.total
  const reduced = useReducedMotion()
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set())
  const [active, setActive] = React.useState<string | null>(null)

  const config = React.useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        data.map((d, i) => [d.key, { label: d.label ?? d.key, color: d.color ?? seriesColor(i) }]),
      ),
    [data],
  )
  const numberFormat = React.useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...format }),
    [locale, format],
  )
  const percentFormat = React.useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }),
    [locale],
  )

  const valid = React.useMemo(
    () => data.map((d) => ({ ...d, value: Number.isFinite(d.value) ? Math.max(0, d.value) : 0 })),
    [data],
  )
  const visible = React.useMemo(
    () => valid.filter((d) => !hidden.has(d.key) && d.value > 0),
    [valid, hidden],
  )
  // A new array on every hover would make recharts replay the sweep, so the rows keep their
  // identity until the data or the hidden slices change.
  const rows = React.useMemo(() => visible.map((d) => ({ key: d.key, value: d.value })), [visible])
  const total = visible.reduce((sum, d) => sum + d.value, 0)
  const current = active ? visible.find((d) => d.key === active) : undefined
  const isEmpty = valid.every((d) => d.value === 0)

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      // Hiding the last visible slice would leave an empty ring and nothing to click back.
      else if (valid.filter((d) => !prev.has(d.key) && d.value > 0).length > 1) next.add(key)
      return next
    })

  if (isEmpty) {
    return (
      <ChartEmpty height={size} className={className} {...props}>
        {empty}
      </ChartEmpty>
    )
  }

  const outer = size / 2 - LIFT
  const inner = Math.max(0, outer - thickness)
  const summary =
    ariaLabel ??
    labels.summary(
      visible.map(
        (d) => `${config[d.key]?.label}: ${percentFormat.format(d.value / (total || 1))}`,
      ),
      typeof label === 'string' ? label : labels.total,
      numberFormat.format(total),
    )

  const shape = (props: PieSectorShapeProps) => {
    // Recharts hands the React key in with the props; it cannot be spread into JSX.
    const { key: _, ...sector } = props as PieSectorShapeProps & { key?: React.Key }
    const key = (sector.payload as { key?: string } | undefined)?.key ?? ''
    const on = active === key
    return (
      <Sector
        {...sector}
        fill={`var(--color-${key})`}
        outerRadius={sector.outerRadius + (on ? LIFT : 0)}
        opacity={active && !on ? 0.35 : 1}
        className="transition-opacity duration-(--duration-fast,150ms)"
      />
    )
  }

  return (
    <div
      data-slot="donut-chart"
      className={cn('flex flex-wrap items-center justify-center gap-x-8 gap-y-5', className)}
      {...props}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ChartContainer
          config={config}
          role="figure"
          aria-label={summary}
          className="aspect-square size-full"
          initialDimension={{ width: size, height: size }}
        >
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="key"
              innerRadius={inner}
              outerRadius={outer}
              startAngle={90}
              endAngle={-270}
              paddingAngle={rows.length > 1 ? 1.5 : 0}
              cornerRadius={3}
              stroke="none"
              rootTabIndex={-1}
              shape={shape}
              isAnimationActive={!reduced}
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
              animationMatchBy={matchByDataKey('key')}
              onMouseEnter={(_, index) => setActive(rows[index]?.key ?? null)}
              onMouseLeave={() => setActive(null)}
            />
          </PieChart>
        </ChartContainer>
        <div
          aria-hidden
          data-slot="donut-chart-center"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ padding: thickness + LIFT + 4 }}
        >
          <span className="max-w-full truncate text-muted-foreground text-xs">
            {current ? config[current.key]?.label : label}
          </span>
          <Odometer
            value={current ? current.value : total}
            locale={locale}
            format={{ maximumFractionDigits: 2, ...format }}
            duration={450}
            stagger={20}
            className="font-semibold text-2xl leading-tight tracking-tight"
          />
          <span className="text-muted-foreground text-xs tabular-nums">
            {current ? percentFormat.format(current.value / (total || 1)) : ' '}
          </span>
        </div>
      </div>

      {showLegend && (
        <ul data-slot="donut-chart-legend" className="grid min-w-40 gap-0.5 text-sm">
          {valid.map((d) => {
            const off = hidden.has(d.key) || d.value === 0
            return (
              <li key={d.key}>
                <button
                  type="button"
                  aria-pressed={!hidden.has(d.key)}
                  disabled={d.value === 0}
                  onClick={() => toggle(d.key)}
                  onPointerEnter={() => !off && setActive(d.key)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => !off && setActive(d.key)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left outline-none transition-[opacity,background-color] duration-(--duration-fast,150ms) hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default',
                    off && 'opacity-50',
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: off ? 'var(--muted-foreground)' : config[d.key]?.color }}
                  />
                  <span className="flex-1 truncate text-muted-foreground">
                    {config[d.key]?.label}
                  </span>
                  <span className="font-medium tabular-nums">{numberFormat.format(d.value)}</span>
                  <span className="w-12 text-right text-muted-foreground text-xs tabular-nums">
                    {off ? '–' : percentFormat.format(d.value / (total || 1))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { DonutChart }
