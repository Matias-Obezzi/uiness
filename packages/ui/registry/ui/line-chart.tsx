'use client'

import * as React from 'react'
import {
  type ChartBaseProps,
  type ChartContext,
  ChartFrame,
  linearPath,
  monotonePath,
  segments,
  useChartIntro,
} from '@/ui/chart-core'

export interface LineChartProps extends ChartBaseProps {
  /** `linear` joins points with straight lines; `monotone` with a smooth curve that never overshoots. Default `linear`. */
  curve?: 'linear' | 'monotone'
  /** Fill under each line with a fading wash of its color. Default false. */
  area?: boolean
  /** Keep zero on the y axis. Turn off to zoom into the range of the data. Default true. */
  includeZero?: boolean
}

function LineMarks({
  ctx,
  curve,
  area,
}: {
  ctx: ChartContext
  curve: 'linear' | 'monotone'
  area: boolean
}) {
  const ref = React.useRef<SVGGElement>(null)
  const path = curve === 'monotone' ? monotonePath : linearPath

  // Lines draw themselves left to right; the inset overshoots so strokes are never clipped.
  useChartIntro(ref, (g) => {
    g.animate(
      [{ clipPath: 'inset(-10% 100% -10% -2%)' }, { clipPath: 'inset(-10% -2% -10% -2%)' }],
      { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
  })

  const visible = ctx.series.filter((s) => !s.hidden)
  const lines = visible.map((s) => {
    const runs = segments(ctx.values[s.index] ?? []).map((run) =>
      run.map(({ index, value }) => [ctx.xAt(index), ctx.y(value)] as [number, number]),
    )
    return { s, runs }
  })

  return (
    <g data-slot="line-chart-lines">
      {area && (
        <defs>
          {visible.map((s) => (
            <linearGradient
              key={s.key}
              id={`${ctx.id}-area-${s.index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
      )}
      <g ref={ref}>
        {area &&
          lines.map(({ s, runs }) =>
            runs.map((points) => {
              if (points.length < 2) return null
              const first = points[0] as [number, number]
              const last = points[points.length - 1] as [number, number]
              return (
                <path
                  key={`${s.key}-${first[0]}`}
                  data-slot="line-chart-area"
                  data-series={s.key}
                  d={`${path(points)}L${last[0]},${ctx.baseline}L${first[0]},${ctx.baseline}Z`}
                  fill={`url(#${ctx.id}-area-${s.index})`}
                />
              )
            }),
          )}
        {lines.map(({ s, runs }) =>
          runs.map((points) => {
            const first = points[0] as [number, number]
            // A value with missing neighbours on both sides has no line to sit on, so it gets a dot.
            if (points.length === 1)
              return (
                <circle
                  key={`${s.key}-${first[0]}`}
                  data-slot="line-chart-point"
                  data-series={s.key}
                  cx={first[0]}
                  cy={first[1]}
                  r={2.5}
                  fill={s.color}
                />
              )
            return (
              <path
                key={`${s.key}-${first[0]}`}
                data-slot="line-chart-line"
                data-series={s.key}
                d={path(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          }),
        )}
      </g>
      {ctx.active !== null &&
        visible.map((s) => {
          const v = ctx.values[s.index]?.[ctx.active as number] ?? null
          if (v === null) return null
          return (
            <circle
              key={s.key}
              data-slot="line-chart-dot"
              data-series={s.key}
              cx={ctx.xAt(ctx.active as number)}
              cy={ctx.y(v)}
              r={4}
              fill={s.color}
              strokeWidth={2}
              // The ring takes the surface color so the dot stays legible where lines cross.
              style={{ stroke: 'var(--chart-surface, var(--background))' }}
            />
          )
        })}
    </g>
  )
}

/**
 * Lines over dates or categories, straight or smooth, with an optional area fill, drawn in SVG
 * with no chart library. Missing values leave a gap. Hover or use the arrow keys for each value.
 */
function LineChart({
  curve = 'linear',
  area = false,
  includeZero = true,
  ...props
}: LineChartProps) {
  return (
    <ChartFrame kind="line" scale="point" includeZero={includeZero} {...props}>
      {(ctx) => <LineMarks ctx={ctx} curve={curve} area={area} />}
    </ChartFrame>
  )
}

export { LineChart }
