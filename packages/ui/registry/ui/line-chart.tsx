'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_X_AXIS,
  ChartContainer,
  ChartEmpty,
  ChartSeriesLegend,
  ChartTooltip,
  ChartTooltipContent,
  type SeriesChartProps,
  useSeriesChart,
} from '@/components/ui/chart'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface LineChartProps extends SeriesChartProps {
  /** `linear` joins points with straight lines; `monotone` with a smooth curve that never overshoots. Default `linear`. */
  curve?: 'linear' | 'monotone'
  /** Fill under each line with a fading wash of its color. Default false. */
  area?: boolean
  /** Keep zero on the y axis. Turn off to zoom into the range of the data. Default true. */
  includeZero?: boolean
}

// The ring takes the page color so the dot stays legible where lines cross.
const activeDot = { r: 4, strokeWidth: 2, stroke: 'var(--chart-surface, var(--background))' }

/**
 * Lines over dates or categories, straight or smooth, with an optional area fill, on recharts
 * through `ChartContainer`. Missing values leave a gap. Hover or use the arrow keys for values.
 */
function LineChart({
  data,
  x,
  series,
  curve = 'linear',
  area = false,
  includeZero = true,
  height = 240,
  xFormat,
  yFormat,
  locale,
  showGrid = true,
  showLegend,
  empty,
  labels,
  className,
  'aria-label': ariaLabel,
  ...props
}: LineChartProps) {
  const reduced = useReducedMotion()
  const id = `line-chart${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const chart = useSeriesChart({ data, x, series, xFormat, yFormat, locale, labels })

  if (chart.isEmpty) {
    return (
      <ChartEmpty height={height} className={className} {...props}>
        {empty ?? chart.labels.empty}
      </ChartEmpty>
    )
  }

  const ticks = chart.yTicks({ includeZero, height })

  // A value with gaps on both sides has no line to sit on, so it gets a dot of its own.
  const loneDot = (key: string) => (p: { cx?: number; cy?: number; index?: number }) => {
    const i = p.index ?? -1
    const lone =
      chart.rows[i]?.[key] !== null &&
      (chart.rows[i - 1]?.[key] ?? null) === null &&
      (chart.rows[i + 1]?.[key] ?? null) === null
    return lone && p.cx != null && p.cy != null ? (
      <circle key={`${key}-${i}`} cx={p.cx} cy={p.cy} r={2.5} fill={`var(--color-${key})`} />
    ) : (
      <g key={`${key}-${i}`} />
    )
  }

  const shared = {
    type: curve,
    strokeWidth: 2,
    connectNulls: false,
    activeDot,
    isAnimationActive: !reduced,
    animationDuration: 800,
    animationEasing: 'ease-out',
  } as const

  const marks = series.map((s) =>
    area ? (
      <Area
        key={s.key}
        dataKey={s.key}
        stroke={`var(--color-${s.key})`}
        fill={`url(#${id}-${s.key})`}
        hide={chart.hidden.has(s.key)}
        dot={loneDot(s.key)}
        {...shared}
      />
    ) : (
      <Line
        key={s.key}
        dataKey={s.key}
        stroke={`var(--color-${s.key})`}
        hide={chart.hidden.has(s.key)}
        dot={loneDot(s.key)}
        {...shared}
      />
    ),
  )

  const Chart = area ? AreaChart : RechartsLineChart

  return (
    <div
      data-slot="line-chart"
      className={cn('flex w-full min-w-0 flex-col gap-3', className)}
      {...props}
    >
      {(showLegend ?? series.length > 1) && (
        <ChartSeriesLegend
          series={series}
          config={chart.config}
          hidden={chart.hidden}
          onToggle={chart.toggle}
          shape="line"
        />
      )}
      <ChartContainer
        config={chart.config}
        role="figure"
        aria-label={ariaLabel ?? chart.labels.lineChart(chart.summary)}
        className="aspect-auto w-full"
        style={{ height }}
      >
        <Chart
          data={chart.rows}
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          {area && (
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`var(--color-${s.key})`} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={`var(--color-${s.key})`} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
          )}
          {showGrid && <CartesianGrid vertical={false} />}
          <XAxis
            dataKey={CHART_X_AXIS}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            interval="preserveEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width="auto"
            ticks={ticks}
            domain={[ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1]}
            interval={0}
            tickFormatter={chart.formatAxisY}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={chart.formatLabel}
                valueFormatter={chart.formatValue}
              />
            }
          />
          {marks}
        </Chart>
      </ChartContainer>
    </div>
  )
}

export { LineChart }
