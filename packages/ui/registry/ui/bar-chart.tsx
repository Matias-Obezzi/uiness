'use client'

import {
  Bar,
  type BarShapeProps,
  BarStack,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Rectangle,
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

export interface BarChartProps extends SeriesChartProps {
  /** Stack the series in one bar per row instead of side by side. Default false. */
  stacked?: boolean
}

/** Space between stacked segments. */
const GAP = 2

// Each segment stops short of the one it sits on, so the gap is page, not a drawn border.
function StackedSegment(props: BarShapeProps) {
  const { y, height, stackedBarStart } = props
  let top = Math.min(y, y + height)
  const bottom = Math.max(y, y + height)
  let size = bottom - top
  const near = (a: number) => Math.abs(a - stackedBarStart) < 0.5
  if (!near(bottom) && !near(top)) {
    size = Math.max(0, size - GAP)
    // Below zero the stack grows downwards, so the gap goes on top of the segment.
    if (top > stackedBarStart) top += GAP
  }
  return <Rectangle {...props} y={top} height={size} />
}

/**
 * Bars per date or category, side by side or stacked, on recharts through `ChartContainer`.
 * Hover or use the arrow keys for each value; the legend hides and shows series.
 */
function BarChart({
  data,
  x,
  series,
  stacked = false,
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
}: BarChartProps) {
  const reduced = useReducedMotion()
  const chart = useSeriesChart({ data, x, series, xFormat, yFormat, locale, labels })

  if (chart.isEmpty) {
    return (
      <ChartEmpty height={height} className={className} {...props}>
        {empty ?? chart.labels.empty}
      </ChartEmpty>
    )
  }

  const ticks = chart.yTicks({ stacked, height })

  const bars = series.map((s) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      fill={`var(--color-${s.key})`}
      hide={chart.hidden.has(s.key)}
      radius={stacked ? 0 : [4, 4, 0, 0]}
      maxBarSize={24}
      shape={stacked ? StackedSegment : undefined}
      isAnimationActive={!reduced}
      animationDuration={600}
      animationEasing="ease-out"
    />
  ))

  return (
    <div
      data-slot="bar-chart"
      className={cn('flex w-full min-w-0 flex-col gap-3', className)}
      {...props}
    >
      {(showLegend ?? series.length > 1) && (
        <ChartSeriesLegend
          series={series}
          config={chart.config}
          hidden={chart.hidden}
          onToggle={chart.toggle}
        />
      )}
      <ChartContainer
        config={chart.config}
        role="figure"
        aria-label={ariaLabel ?? chart.labels.barChart(chart.summary)}
        className="aspect-auto w-full"
        style={{ height }}
      >
        <RechartsBarChart
          data={chart.rows}
          accessibilityLayer
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barGap={2}
          barCategoryGap="25%"
        >
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
                labelFormatter={chart.formatLabel}
                valueFormatter={chart.formatValue}
              />
            }
          />
          {/* The stack rounds only its outer end, whichever series is on top in that row. */}
          {stacked ? <BarStack radius={[4, 4, 0, 0]}>{bars}</BarStack> : bars}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  )
}

export { BarChart }
