'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

/** Pixels between grains sampled from the letters. */
const GRAIN = 3

type Grain = { x: number; y: number; hx: number; hy: number; vx: number; vy: number; life: number }

export interface InkBackgroundProps extends React.ComponentProps<'div'> {
  /** The words written in ink across the middle. */
  text: string
}

/**
 * A headline written in ink on water. Stir it with the pointer and the letters bleed into the
 * current; a press drops a blot of ink that spreads and fades; and once the water settles the
 * ink gathers back into the words. The words are also there as text for screen readers.
 */
function InkBackground({ text, className, children, ...props }: InkBackgroundProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const grains = React.useRef<Grain[]>([])

  useCanvas(canvas, ({ ctx, width, height, pointer, presses, resized, reduced }) => {
    if (resized) {
      // The words drawn off screen, and a grain wherever their ink is.
      const off = document.createElement('canvas')
      off.width = Math.round(width)
      off.height = Math.round(height)
      const c = off.getContext('2d', { willReadFrequently: true })
      if (!c) return
      const size = Math.min(width / (text.length * 0.55), height * 0.32)
      c.font = `700 ${size}px ui-serif, Georgia, serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(text, width / 2, height / 2)
      const data = c.getImageData(0, 0, off.width, off.height).data
      const next: Grain[] = []
      for (let y = 0; y < off.height; y += GRAIN)
        for (let x = 0; x < off.width; x += GRAIN)
          if ((data[(y * off.width + x) * 4 + 3] ?? 0) > 128)
            next.push({ x, y, hx: x, hy: y, vx: 0, vy: 0, life: Number.POSITIVE_INFINITY })
      grains.current = next
    }
    for (const p of presses)
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2
        const s = Math.random() * 3.2
        grains.current.push({
          x: p.x,
          y: p.y,
          hx: p.x,
          hy: p.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 120 + Math.random() * 80,
        })
      }

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = getComputedStyle(ctx.canvas).color
    const speed = pointer ? Math.hypot(pointer.dx, pointer.dy) : 0
    const alive: Grain[] = []
    for (const g of grains.current) {
      if (!reduced) {
        if (pointer && speed > 0.5) {
          const dx = g.x - pointer.x
          const dy = g.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < 9000) {
            // The current drags ink along with the stirring, swirling a little.
            const f = (1 - d2 / 9000) * 0.12
            g.vx += pointer.dx * f - dy * 0.002 * speed
            g.vy += pointer.dy * f + dx * 0.002 * speed
          }
        }
        // Words gather back slowly; blots drift and fade.
        if (Number.isFinite(g.life)) g.life--
        else {
          g.vx += (g.hx - g.x) * 0.006
          g.vy += (g.hy - g.y) * 0.006
        }
        g.vx *= 0.92
        g.vy *= 0.92
        g.x += g.vx
        g.y += g.vy
      }
      if (g.life <= 0) continue
      alive.push(g)
      const drift = Math.min(1, Math.hypot(g.x - g.hx, g.y - g.hy) / 40)
      ctx.globalAlpha = Number.isFinite(g.life) ? Math.min(0.5, g.life / 200) : 0.9 - drift * 0.5
      const r = GRAIN * (0.55 + drift * 0.6)
      ctx.fillRect(g.x - r / 2, g.y - r / 2, r, r)
    }
    grains.current = alive
    ctx.globalAlpha = 1
  })

  return (
    <div
      data-slot="ink-background"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      <p className="sr-only">{text}</p>
      {children}
    </div>
  )
}

export { InkBackground }
