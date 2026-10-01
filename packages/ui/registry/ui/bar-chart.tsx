'use client'

import * as React from 'react'
import {
  barPath,
  type ChartBaseProps,
  type ChartContext,
  ChartFrame,
  useChartIntro,
} from '@/ui/chart-core'

export interface BarChartProps extends ChartBaseProps {
  /** Stack the series in one bar per row instead of side by side. Default false. */
  stacked?: boolean
}

/** Widest a bar gets. Past it the slot is left as air, which reads calmer than a solid block. */
const MAX_BAR = 24
/** Space between bars of one row and between stacked segments. */
const GAP = 2

function stackedExtent(values: (number | null)[][]): [number, number] {
  let min = 0
  let max = 0
  const rows = Math.max(0, ...values.map((v) => v.length))
  for (let i = 0; i < rows; i++) {
    let up = 0
    let down = 0
    for (const list of values) {
      const v = list[i] ?? 0
      if (v > 0) up += v
      else down += v
    }
    max = Math.max(max, up)
    min = Math.min(min, down)
  }
  return [min, max]
}

interface Bar {
  key: string
  d: string
  color: string
  /** Highest point of the bar, in pixels. */
  top: number
}

function columnBars(ctx: ChartContext, i: number, stacked: boolean): Bar[] {
  const visible = ctx.series.filter((s) => !s.hidden)
  const inner = ctx.step * 0.75
  const center = ctx.xAt(i)
  const bars: Bar[] = []

  if (stacked) {
    const width = Math.max(1, Math.min(MAX_BAR, inner))
    const x = center - width / 2
    // Positive values stack up from zero, negative ones down, each with its own outer end.
    for (const dir of [1, -1]) {
      const parts = visible
        .map((s) => ({ s, v: ctx.values[s.index]?.[i] ?? null }))
        .filter(
          (p): p is { s: (typeof visible)[number]; v: number } => p.v !== null && p.v * dir > 0,
        )
      let total = 0
      parts.forEach(({ s, v }, n) => {
        const from = ctx.y(total)
        total += v
        const outer = n === parts.length - 1
        // Inner segments stop short of the next one, leaving a gap instead of a drawn border.
        const to = outer ? ctx.y(total) : ctx.y(total) + dir * GAP
        if ((from - to) * dir <= 0) return
        bars.push({
          key: s.key,
          d: outer ? barPath(x, width, from, to) : barPath(x, width, from, to, 0),
          color: s.color,
          top: Math.min(from, to),
        })
      })
    }
    return bars
  }

  let gap = GAP
  let width = (inner - gap * (visible.length - 1)) / visible.length
  if (width < 4) {
    gap = 1
    width = (inner - gap * (visible.length - 1)) / visible.length
  }
  width = Math.max(1, Math.min(MAX_BAR, width))
  const group = width * visible.length + gap * (visible.length - 1)
  visible.forEach((s, n) => {
    const v = ctx.values[s.index]?.[i] ?? null
    if (v === null || v === 0) return
    const x = center - group / 2 + n * (width + gap)
    const to = ctx.y(v)
    bars.push({
      key: s.key,
      d: barPath(x, width, ctx.baseline, to),
      color: s.color,
      top: Math.min(ctx.baseline, to),
    })
  })
  return bars
}

function BarMarks({ ctx, stacked }: { ctx: ChartContext; stacked: boolean }) {
  const ref = React.useRef<SVGGElement>(null)
  const count = ctx.count

  // Each column grows out of the zero line, one after the other, left to right.
  useChartIntro(ref, (g) => {
    const columns = g.querySelectorAll<SVGGElement>('[data-slot="bar-chart-column"]')
    columns.forEach((column, n) => {
      column.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
        duration: 600,
        delay: (n / Math.max(1, count)) * 300,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'backwards',
      })
    })
  })

  return (
    <g ref={ref} data-slot="bar-chart-bars">
      {Array.from({ length: count }, (_, i) => {
        const bars = columnBars(ctx, i, stacked)
        // The column scales around zero, wherever that sits inside its own box.
        const top = Math.min(ctx.baseline, ...bars.map((b) => b.top))
        return (
          <g
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
            key={i}
            data-slot="bar-chart-column"
            style={{ transformBox: 'fill-box', transformOrigin: `center ${ctx.baseline - top}px` }}
          >
            {bars.map((b) => (
              <path
                key={b.key}
                data-slot="bar-chart-bar"
                data-series={b.key}
                d={b.d}
                fill={b.color}
                className="transition-[d] duration-(--duration-slow,300ms) ease-standard"
              />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/**
 * Bars per date or category, side by side or stacked, drawn in SVG with no chart library.
 * Hover or use the arrow keys for each value; the legend hides and shows series.
 */
function BarChart({ stacked = false, ...props }: BarChartProps) {
  return (
    <ChartFrame
      kind="bar"
      scale="band"
      extent={stacked ? stackedExtent : undefined}
      includeZero
      {...props}
    >
      {(ctx) => <BarMarks ctx={ctx} stacked={stacked} />}
    </ChartFrame>
  )
}

export { BarChart }
