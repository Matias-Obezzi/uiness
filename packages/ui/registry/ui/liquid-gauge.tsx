'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface LiquidGaugeLabels {
  /** What the meter reads as, with the formatted value and maximum. */
  valueText: (value: string, max: string) => string
}

export const defaultLiquidGaugeLabels: LiquidGaugeLabels = {
  valueText: (value, max) => `${value} of ${max}`,
}

/** Columns across the surface. */
const COLUMNS = 40

/**
 * One step of the surface: each column pulled toward its neighbours and back to level, damped.
 * The ends are free, so a slosh reflects off the walls.
 */
export function sloshStep(h: Float32Array, v: Float32Array) {
  const n = h.length
  for (let i = 0; i < n; i++) {
    const left = h[Math.max(0, i - 1)] ?? 0
    const right = h[Math.min(n - 1, i + 1)] ?? 0
    const self = h[i] ?? 0
    v[i] = ((v[i] ?? 0) + (left + right - 2 * self) * 0.18 - self * 0.012) * 0.985
  }
  for (let i = 0; i < n; i++) h[i] = (h[i] ?? 0) + (v[i] ?? 0)
}

type Bubble = { x: number; y: number; r: number; speed: number }

export interface LiquidGaugeProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What is measured, like "Storage". Names the meter. */
  label: string
  value: number
  /** Default 100. */
  max?: number
  /** Formats the value and the maximum. Defaults to the locale's number format. */
  format?: (value: number) => string
  labels?: Partial<LiquidGaugeLabels>
}

/**
 * A usage meter filled with liquid. A change of value pours it in or out and sets the surface
 * sloshing, moving the pointer across ripples it, and bubbles rise through it. The share is
 * written across the middle, inverted where the liquid covers it.
 */
function LiquidGauge({
  label,
  value,
  max = 100,
  format,
  labels: labelsProp,
  className,
  ...props
}: LiquidGaugeProps) {
  const labels = useLabels('liquid-gauge', defaultLiquidGaugeLabels, labelsProp)
  const locale = useLocale()
  const fmt = format ?? ((n: number) => n.toLocaleString(locale))
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const share = Math.max(0, Math.min(1, value / max))
  const sim = React.useRef({
    h: new Float32Array(COLUMNS),
    v: new Float32Array(COLUMNS),
    level: share,
    target: share,
    bubbles: [] as Bubble[],
  })

  React.useEffect(() => {
    const s = sim.current
    // A pour from the left wall, as big as the change.
    s.v[0] = (s.v[0] ?? 0) + (share - s.target) * 60
    s.v[1] = (s.v[1] ?? 0) + (share - s.target) * 40
    s.target = share
  }, [share])

  useCanvas(
    canvas,
    ({ ctx, width, height, pointer, reduced }) => {
      const s = sim.current
      if (reduced) {
        s.level = s.target
        s.h.fill(0)
        s.v.fill(0)
      } else {
        s.level += (s.target - s.level) * 0.06
        if (pointer?.dx) {
          const i = Math.round((pointer.x / width) * (COLUMNS - 1))
          s.v[i] = (s.v[i] ?? 0) + Math.max(-3, Math.min(3, pointer.dx * 0.12))
        }
        sloshStep(s.h, s.v)
        if (s.level > 0.02 && s.bubbles.length < 14 && Math.random() < 0.08)
          s.bubbles.push({
            x: Math.random() * width,
            y: height + 4,
            r: 1 + Math.random() * 2.5,
            speed: 0.4 + Math.random() * 0.6,
          })
      }
      const surface = height * (1 - s.level)
      const styles = getComputedStyle(ctx.canvas)
      const liquid = styles.color
      const ink = styles.getPropertyValue('--gauge-ink').trim() || '#000'
      const paper = styles.getPropertyValue('--gauge-paper').trim() || '#fff'

      const wave = new Path2D()
      wave.moveTo(0, height)
      for (let i = 0; i < COLUMNS; i++)
        wave.lineTo((i / (COLUMNS - 1)) * width, surface + (s.h[i] ?? 0) * 1.4)
      wave.lineTo(width, height)
      wave.closePath()

      const text = `${Math.round(s.target * 100)}%`
      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${Math.round(Math.min(width, height) * 0.24)}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = ink
      ctx.fillText(text, width / 2, height / 2)
      ctx.save()
      ctx.clip(wave)
      ctx.fillStyle = liquid
      ctx.fillRect(0, 0, width, height)
      // A lighter band just under the surface.
      const shine = ctx.createLinearGradient(0, surface - 4, 0, surface + 18)
      shine.addColorStop(0, 'rgb(255 255 255 / 0.35)')
      shine.addColorStop(1, 'rgb(255 255 255 / 0)')
      ctx.fillStyle = shine
      ctx.fillRect(0, surface - 10, width, 30)
      ctx.fillStyle = paper
      ctx.fillText(text, width / 2, height / 2)
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = paper
      s.bubbles = s.bubbles
        .map((b) => ({ ...b, y: b.y - b.speed, x: b.x + Math.sin(b.y * 0.08) * 0.3 }))
        .filter((b) => b.y > surface + 3)
      for (const b of s.bubbles) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    },
    { version: share },
  )

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <meter> cannot hold the drawing and its caption
    <div
      data-slot="liquid-gauge"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={labels.valueText(fmt(value), fmt(max))}
      className={cn('flex w-40 flex-col items-center gap-2', className)}
      {...props}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-2 bg-muted/40 [--gauge-ink:var(--foreground)] [--gauge-paper:var(--primary-foreground)]">
        <canvas ref={canvas} className="absolute inset-0 size-full text-primary" />
      </div>
      <div className="text-center text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-muted-foreground tabular-nums">
          {labels.valueText(fmt(value), fmt(max))}
        </div>
      </div>
    </div>
  )
}

export { LiquidGauge }
