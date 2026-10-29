'use client'

import * as React from 'react'
import { useCanvas } from '@/hooks/use-canvas'
import { cn } from '@/lib/utils'

export interface BackgroundPathsProps extends React.ComponentProps<'div'> {
  /** Lines in the ribbon. Default 28. */
  lines?: number
}

/**
 * A ribbon of fine lines in the text colour that keeps flowing across its box at any size, and
 * parts around the pointer as it passes. Put content over it as children.
 */
function BackgroundPaths({ lines = 28, className, children, ...props }: BackgroundPathsProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  // How far the ribbon parts, easing toward the pointer being there or not.
  const part = React.useRef(0)
  const at = React.useRef({ x: 0, y: 0 })

  useCanvas(canvas, ({ ctx, width, height, time, pointer }) => {
    ctx.clearRect(0, 0, width, height)
    if (pointer) at.current = pointer
    part.current += ((pointer ? 1 : 0) - part.current) * 0.08
    ctx.strokeStyle = getComputedStyle(ctx.canvas).color
    const t = time / 1000
    for (let i = 0; i < lines; i++) {
      const share = i / (lines - 1)
      ctx.globalAlpha = 0.08 + 0.32 * Math.sin(share * Math.PI)
      ctx.lineWidth = 0.6 + share * 0.9
      ctx.beginPath()
      for (let x = -20; x <= width + 20; x += 12) {
        const u = x / width
        // A band across the middle, twisting as the lines' phases drift apart.
        let y =
          height * (0.5 + (share - 0.5) * 0.45 * (0.6 + 0.4 * Math.sin(u * 3 + t * 0.4))) +
          Math.sin(u * 5 + t * 0.7 + share * 2.2) * height * 0.08 +
          Math.sin(u * 11 - t * 0.5 + share * 4) * height * 0.02
        const dx = x - at.current.x
        const dy = y - at.current.y
        const d2 = dx * dx + dy * dy
        y += Math.sign(dy || 1) * part.current * 60 * Math.exp(-d2 / 9000)
        if (x === -20) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })

  return (
    <div
      data-slot="background-paths"
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      <canvas ref={canvas} className="absolute inset-0 -z-10 size-full text-foreground" />
      {children}
    </div>
  )
}

export { BackgroundPaths }
