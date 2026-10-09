'use client'

import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ScratchRevealLabels {
  /** Written on the cover. */
  hint: string
  /** The cover's name for screen readers and keyboards, which reveal it with Enter. */
  reveal: string
}

export const defaultScratchRevealLabels: ScratchRevealLabels = {
  hint: 'Scratch to reveal',
  reveal: 'Reveal the hidden content',
}

export interface ScratchRevealProps extends React.ComponentProps<'div'> {
  /** Width of the scratch, in pixels. Default 28. */
  brush?: number
  /** Share of the cover scratched off before the rest falls away, 0 to 1. Default 0.5. */
  threshold?: number
  /** Any CSS color for the cover. Default the muted color. */
  cover?: string
  /** Called once, when the content is revealed. */
  onReveal?: () => void
  labels?: Partial<ScratchRevealLabels>
}

/**
 * A scratch card: content under a cover that the pointer scratches off, the rest falling away
 * once enough is gone. From the keyboard, Enter or Space on the cover reveals it at once. The
 * content stays out of reach, for screen readers too, until then.
 */
function ScratchReveal({
  brush = 28,
  threshold = 0.5,
  cover = 'var(--muted)',
  onReveal,
  labels: labelsProp,
  className,
  children,
  ...props
}: ScratchRevealProps) {
  const labels = useLabels('scratch-reveal', defaultScratchRevealLabels, labelsProp)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [revealed, setRevealed] = React.useState(false)
  const onRevealRef = React.useRef(onReveal)
  React.useEffect(() => {
    onRevealRef.current = onReveal
  })

  const done = React.useRef(false)
  const reveal = React.useCallback(() => {
    if (done.current) return
    done.current = true
    setRevealed(true)
    onRevealRef.current?.()
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !ctx || revealed) return
    let last: { x: number; y: number } | null = null

    const paint = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const style = getComputedStyle(canvas)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = style.color
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = style.getPropertyValue('--scratch-hint').trim() || 'gray'
      ctx.font = `500 14px ${style.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labels.hint, width / 2, height / 2)
    }

    /** Share of the cover gone, from a sparse sample of its pixels. */
    const cleared = () => {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let clear = 0
      let total = 0
      for (let i = 3; i < data.length; i += 4 * 32) {
        total++
        if ((data[i] ?? 0) < 128) clear++
      }
      return total ? clear / total : 0
    }

    const point = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      return { x: e.clientX - box.left, y: e.clientY - box.top }
    }
    const scratch = (to: { x: number; y: number }) => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = brush
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(last?.x ?? to.x, last?.y ?? to.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      last = to
    }
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId)
      last = null
      scratch(point(e))
    }
    const move = (e: PointerEvent) => {
      if (canvas.hasPointerCapture?.(e.pointerId)) scratch(point(e))
    }
    const up = () => {
      last = null
      if (cleared() >= threshold) reveal()
    }

    paint()
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [brush, threshold, revealed, reveal, labels.hint])

  return (
    <div
      data-slot="scratch-reveal"
      data-revealed={revealed ? '' : undefined}
      className={cn('relative isolate overflow-hidden rounded-xl', className)}
      {...props}
    >
      {/* Full size, so content sized to fill the card (size-full, h-full) has something to fill. */}
      <div inert={!revealed} aria-hidden={!revealed || undefined} className="size-full">
        {children}
      </div>
      {/* A real button for keyboards and screen readers: Enter or Space reveals at once. A
          pointer click comes after scratching, so only a keyboard click (detail 0) counts. */}
      <button
        type="button"
        tabIndex={revealed ? -1 : 0}
        aria-label={labels.reveal}
        aria-hidden={revealed || undefined}
        onClick={(e) => {
          if (e.detail === 0) reveal()
        }}
        className={cn(
          'absolute inset-0 rounded-[inherit] outline-none transition-opacity duration-(--duration-slow,300ms) focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
          revealed && 'pointer-events-none opacity-0',
        )}
      >
        <canvas
          ref={canvasRef}
          className="size-full cursor-crosshair touch-none rounded-[inherit] [--scratch-hint:var(--muted-foreground)]"
          style={{ color: cover }}
        />
      </button>
    </div>
  )
}

export { ScratchReveal }
