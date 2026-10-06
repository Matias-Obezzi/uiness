'use client'

import * as React from 'react'
import type { TooltipValueType } from 'recharts'
import * as RechartsPrimitive from 'recharts'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ChartLabels {
  /** Shown instead of a chart with nothing to plot. */
  empty: string
  /** How the ready-made charts sum up their data. The x values come formatted. */
  summary: (series: string[], points: number, from?: string, to?: string) => string
  /** Name of a bar chart, around the summary. */
  barChart: (summary: string) => string
  /** Name of a line chart, around the summary. */
  lineChart: (summary: string) => string
}

export const defaultChartLabels: ChartLabels = {
  empty: 'No data',
  summary: (series, points, from, to) =>
    `${series.join(', ')}, ${points} ${points === 1 ? 'point' : 'points'}${points ? `, from ${from} to ${to}` : ''}`,
  barChart: (summary) => `Bar chart of ${summary}`,
  lineChart: (summary) => `Line chart of ${summary}`,
}

// Theme name to the selector it applies under.
const THEMES = { light: '', dark: '.dark' } as const

// Size recharts draws at before the container has been measured, and in tests.
const INITIAL_DIMENSION = { width: 320, height: 200 } as const
type TooltipNameType = number | string

/**
 * Label, icon and color per data key. Each color becomes `--color-<key>` on the container, so
 * marks can use `fill="var(--color-desktop)"`. `theme` sets a different color for dark mode.
 */
export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

/**
 * Sizes a recharts chart to its box, maps the config to CSS variables and styles the recharts
 * internals with the theme. Drop-in for the shadcn/ui `ChartContainer`.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  /** Label, icon and color for each data key. */
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  /** Size used before the container is measured. Default 320 by 200. */
  initialDimension?: {
    width: number
    height: number
  }
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis-tick_text]:tabular-nums [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-muted-foreground/40 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted-foreground/10 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:rounded-md [&_.recharts-surface]:outline-hidden [&_.recharts-surface]:focus-visible:ring-[3px] [&_.recharts-surface]:focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/** Writes the `--color-<key>` variables of a config, for light and dark. */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme ?? itemConfig.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the CSS is built from the config the app passes, not from user input
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

/** Tooltip body in the theme's popover colors. Pass it as `content` to `ChartTooltip`. */
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  valueFormatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    /** Hide the heading, usually the x value. */
    hideLabel?: boolean
    /** Hide the color key of each row. */
    hideIndicator?: boolean
    /** Shape of the color key. Default `dot`. */
    indicator?: 'line' | 'dot' | 'dashed'
    /** Payload key to look up each row's config by, instead of its data key. */
    nameKey?: string
    /** Payload key to look up the heading's config by. */
    labelKey?: string
    /**
     * Formats only the value of each row, keeping the color key and the name. `formatter`
     * replaces the whole row instead. Defaults to `toLocaleString()`.
     */
    valueFormatter?: (value: TooltipValueType, name: TooltipNameType) => React.ReactNode
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    'accessibilityLayer'
  >) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground text-xs shadow-md',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color

            return (
              <div
                key={`${item.dataKey ?? index}`}
                data-slot="chart-tooltip-item"
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          data-slot="chart-tooltip-indicator"
                          className={cn(
                            'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            },
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between gap-3 leading-none',
                        nestLabel ? 'items-end' : 'items-center',
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span className="font-medium text-foreground tabular-nums">
                          {valueFormatter
                            ? valueFormatter(item.value, item.name ?? key)
                            : typeof item.value === 'number'
                              ? item.value.toLocaleString()
                              : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

/** Legend body with the config labels and icons. Pass it as `content` to `ChartLegend`. */
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  /** Show color swatches even when the config has icons. */
  hideIcon?: boolean
  /** Payload key to look up each entry's config by. */
  nameKey?: string
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      data-slot="chart-legend"
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={`${item.dataKey ?? index}`}
              data-slot="chart-legend-item"
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

// The config entry for a payload item, looked up by `key` on the item or on its data row.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

/*
 * Helpers for the ready-made charts (bar-chart, line-chart): they turn a list of series into a
 * config, read dates and numbers out of loose data rows, and keep the legend toggles.
 */

/** A value on the x axis. ISO date strings (`2026-09-01`) are read as dates. */
export type ChartXValue = Date | string | number

export interface ChartSeries {
  /** Key of the value in each row. */
  key: string
  /** Name shown in the legend and the tooltip. Defaults to the key. */
  label?: string
  /** Any CSS color. Defaults to `var(--chart-1)` to `var(--chart-5)`, in order. */
  color?: string
}

/** Props the ready-made charts share. */
export interface SeriesChartProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Rows to plot, one per x value, in order. */
  data: Record<string, unknown>[]
  /** Key of the x value in each row. Dates, ISO date strings, strings or numbers. */
  x: string
  /** What to plot from each row, and how to name and color it. */
  series: ChartSeries[]
  /** Height of the chart in pixels, legend excluded. Default 240. */
  height?: number
  /** Formats x values on the axis and in the tooltip. Defaults to a short day and month for dates. */
  xFormat?: (value: ChartXValue) => string
  /** Formats numbers on the axis and in the tooltip. Defaults to compact numbers on the axis. */
  yFormat?: (value: number) => string
  /** Locale of the default formats. Defaults to the browser's. */
  locale?: string
  /** Horizontal gridlines. Default true. */
  showGrid?: boolean
  /** Legend above the chart; clicking an entry hides its series. Default true with two series or more. */
  showLegend?: boolean
  /** Shown instead of the chart when there is nothing to plot. Default "No data". */
  empty?: React.ReactNode
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<ChartLabels>
}

/** A number out of anything a data row may hold, or `null` when it is missing. */
export function toChartNumber(value: unknown): number | null {
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
export function toChartDate(value: unknown): Date | null {
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

/** The default color of the series at `index`. Past five it reads `--chart-6` and on if defined. */
export function seriesColor(index: number) {
  const n = index + 1
  return n <= 5 ? `var(--chart-${n})` : `var(--chart-${n}, var(--chart-${(index % 5) + 1}))`
}

/**
 * Round y ticks from 0 (or `min`) to `max`, about `count` of them, in steps of 1, 2 or 5 times a
 * power of ten. Recharts' own nice ticks either pick steps like 35 or round the top up to
 * double the data, so the ready-made charts pass these instead.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  if (min > max) [min, max] = [max, min]
  if (min === max) {
    if (min === 0) return niceTicks(0, 1, count)
    const pad = Math.abs(min) * 0.1
    return niceTicks(min - pad, max + pad, count)
  }
  const raw = (max - min) / Math.max(1, count)
  const power = 10 ** Math.floor(Math.log10(raw))
  const error = raw / power
  // Rounds to the nearest of 1, 2, 5 and 10 on a log scale, so the count stays close to asked.
  const step =
    power *
    (error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1)
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const ticks: number[] = []
  // Multiplying integers, not adding steps, keeps 0.1 + 0.2 style drift out of the labels.
  for (let i = Math.floor(min / step); i <= Math.ceil(max / step); i++) {
    ticks.push(Number((i * step).toFixed(decimals)))
  }
  return ticks
}

/** Lowest and highest value of the visible series, or of their stacks when `stacked`. */
export function seriesExtent(
  rows: Record<string, unknown>[],
  keys: string[],
  stacked = false,
): [number, number] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const row of rows) {
    let up = 0
    let down = 0
    for (const key of keys) {
      const v = row[key]
      if (typeof v !== 'number') continue
      if (stacked) {
        if (v > 0) up += v
        else down += v
      } else {
        min = Math.min(min, v)
        max = Math.max(max, v)
      }
    }
    if (stacked) {
      min = Math.min(min, down)
      max = Math.max(max, up)
    }
  }
  return [min, max]
}

/** Keys the rows of a ready-made chart carry for the axis and the tooltip, next to the data. */
export const CHART_X_AXIS = '__chartX'
export const CHART_X_LABEL = '__chartLabel'

/**
 * Everything a ready-made chart derives from its props: the config, rows with numbers and
 * formatted x labels, formatters, the hidden series and whether there is anything to plot.
 */
export function useSeriesChart({
  data,
  x,
  series,
  xFormat,
  yFormat,
  locale: localeProp,
  labels: labelsProp,
}: Pick<SeriesChartProps, 'data' | 'x' | 'series' | 'xFormat' | 'yFormat' | 'locale' | 'labels'>) {
  const labels = useLabels('chart', defaultChartLabels, labelsProp)
  const locale = useLocale(localeProp)
  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(() => new Set())

  const formats = React.useMemo(
    () => ({
      axisDate: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
      tipDate: new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      number: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
      compact: new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 2 }),
    }),
    [locale],
  )

  const formatX = React.useCallback(
    (value: unknown, long: boolean) => {
      if (xFormat) return xFormat(value as ChartXValue)
      const date = toChartDate(value)
      if (date) return (long ? formats.tipDate : formats.axisDate).format(date)
      if (typeof value === 'number') return formats.number.format(value)
      return value == null ? '' : String(value)
    },
    [xFormat, formats],
  )

  const config = React.useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        series.map((s, i) => [
          s.key,
          { label: s.label ?? s.key, color: s.color ?? seriesColor(i) },
        ]),
      ),
    [series],
  )

  const rows = React.useMemo(
    () =>
      data.map((row) => {
        const out: Record<string, unknown> = {
          [CHART_X_AXIS]: formatX(row[x], false),
          [CHART_X_LABEL]: formatX(row[x], true),
        }
        for (const s of series) out[s.key] = toChartNumber(row[s.key])
        return out
      }),
    [data, x, series, formatX],
  )

  const isEmpty = rows.length === 0 || series.every((s) => rows.every((row) => row[s.key] === null))

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      // Hiding the last visible series would leave an empty chart and nothing to click back.
      else if (series.filter((s) => !prev.has(s.key)).length > 1) next.add(key)
      return next
    })

  const first = rows[0]?.[CHART_X_LABEL]
  const last = rows[rows.length - 1]?.[CHART_X_LABEL]
  const summary = labels.summary(
    series.map((s) => s.label ?? s.key),
    rows.length,
    first === undefined ? undefined : String(first),
    last === undefined ? undefined : String(last),
  )

  return {
    labels,
    config,
    rows,
    hidden,
    toggle,
    isEmpty,
    summary,
    /** Y ticks over the visible series, about one every 50px of `height`. */
    yTicks: ({
      stacked = false,
      includeZero = true,
      height,
    }: {
      stacked?: boolean
      includeZero?: boolean
      height: number
    }) => {
      const keys = series.filter((s) => !hidden.has(s.key)).map((s) => s.key)
      let [min, max] = seriesExtent(rows, keys, stacked)
      if (!Number.isFinite(min) || !Number.isFinite(max)) [min, max] = [0, 1]
      if (includeZero) [min, max] = [Math.min(0, min), Math.max(0, max)]
      return niceTicks(min, max, Math.max(2, Math.floor((height - 40) / 50)))
    },
    formatAxisY: (v: number) => (yFormat ? yFormat(v) : formats.compact.format(v)),
    formatValue: (v: TooltipValueType) =>
      typeof v === 'number' ? (yFormat ? yFormat(v) : formats.number.format(v)) : String(v),
    formatLabel: (_: React.ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) =>
      String((payload[0]?.payload as Record<string, unknown> | undefined)?.[CHART_X_LABEL] ?? ''),
  }
}

/** Legend of buttons that hide and show series, above a ready-made chart. */
function ChartSeriesLegend({
  series,
  config,
  hidden,
  onToggle,
  shape = 'square',
}: {
  series: ChartSeries[]
  config: ChartConfig
  hidden: ReadonlySet<string>
  onToggle: (key: string) => void
  shape?: 'square' | 'line'
}) {
  return (
    <div data-slot="chart-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s) => {
        const off = hidden.has(s.key)
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(s.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm text-muted-foreground text-xs outline-none transition-opacity duration-(--duration-fast,150ms) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
              off && 'opacity-50',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'shrink-0',
                shape === 'square' ? 'size-2.5 rounded-[3px]' : 'h-0.5 w-3 rounded-full',
              )}
              style={{ background: off ? 'var(--muted-foreground)' : config[s.key]?.color }}
            />
            {config[s.key]?.label}
          </button>
        )
      })}
    </div>
  )
}

/** Placeholder at the chart's height when there is nothing to plot. */
function ChartEmpty({
  className,
  height,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & { height: number }) {
  const labels = useLabels('chart', defaultChartLabels)
  return (
    <div
      data-slot="chart"
      data-empty=""
      className={cn(
        'flex w-full items-center justify-center text-muted-foreground text-sm',
        className,
      )}
      style={{ height, ...style }}
      {...props}
    >
      <div data-slot="chart-empty">{children ?? labels.empty}</div>
    </div>
  )
}

export {
  ChartContainer,
  ChartEmpty,
  ChartLegend,
  ChartLegendContent,
  ChartSeriesLegend,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  useChart,
}
