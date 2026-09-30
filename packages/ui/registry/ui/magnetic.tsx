'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface MagneticProps extends React.ComponentProps<'div'> {
  /** Render the child element instead of a `<div>`, so it moves itself. */
  asChild?: boolean
  /** How far it follows the pointer, as a fraction of the distance to its center. Default 0.35. */
  strength?: number
  /** Pixels around the element where the pull starts. Default 60. */
  radius?: number
  /** The furthest it moves from its place, in pixels. Default 24. */
  max?: number
  /** Milliseconds to spring back when the pointer moves away. Default 600. */
  duration?: number
  /** Stop pulling and settle in place. */
  disabled?: boolean
}

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const springBack = 'linear(0, 0.55 12%, 1.1 30%, 1.02 45%, 0.98 60%, 1)'

/**
 * Pulls its content towards the pointer once it comes near, and springs back when it
 * leaves. Wrap something in `MagneticInner` and it moves further, for a parallax feel.
 * Only on devices with a mouse, and it stays put with reduced motion.
 */
function Magnetic({
  asChild,
  strength = 0.35,
  radius = 60,
  max = 24,
  duration = 600,
  disabled = false,
  className,
  style,
  ...props
}: MagneticProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = React.useState(false)
  const off = disabled || reduced

  React.useEffect(() => {
    const el = ref.current
    if (!el || off) return
    if (typeof matchMedia === 'function' && !matchMedia(FINE_POINTER).matches) return

    let frame = 0
    let x = 0
    let y = 0
    let last: { x: number; y: number } | null = null

    const set = (nx: number, ny: number) => {
      x = nx
      y = ny
      el.style.setProperty('--magnetic-x', `${nx.toFixed(2)}px`)
      el.style.setProperty('--magnetic-y', `${ny.toFixed(2)}px`)
    }

    const update = () => {
      frame = 0
      if (!last) return
      // The rect includes the current pull, so take it out to find the resting center.
      const rect = el.getBoundingClientRect()
      const dx = last.x - (rect.left - x + rect.width / 2)
      const dy = last.y - (rect.top - y + rect.height / 2)
      // How far outside the element the pointer is, 0 while it is over it.
      const outside = Math.hypot(
        Math.max(0, Math.abs(dx) - rect.width / 2),
        Math.max(0, Math.abs(dy) - rect.height / 2),
      )
      const near = outside < radius || outside === 0
      setActive(near)
      if (!near) {
        set(0, 0)
        return
      }
      // The pull fades out towards the edge of the zone, so leaving it never snaps, and it
      // is capped, so a wide element does not wander off or into its neighbours.
      const falloff = radius > 0 ? 1 - outside / radius : 1
      let px = dx * strength * falloff
      let py = dy * strength * falloff
      const length = Math.hypot(px, py)
      if (length > max) {
        px *= max / length
        py *= max / length
      }
      set(px, py)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      last = { x: e.clientX, y: e.clientY }
      if (!frame) frame = requestAnimationFrame(update)
    }

    const reset = () => {
      last = null
      cancelAnimationFrame(frame)
      frame = 0
      setActive(false)
      set(0, 0)
    }

    // relatedTarget is null when the pointer leaves the window.
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) reset()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [off, strength, radius, max])

  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      ref={ref}
      data-slot="magnetic"
      data-state={active ? 'active' : 'idle'}
      className={cn(
        'transition-transform will-change-transform motion-reduce:transition-none',
        !asChild && 'inline-block',
        className,
      )}
      style={
        {
          '--magnetic-duration': active ? '150ms' : `${duration}ms`,
          '--magnetic-ease': active ? 'ease-out' : springBack,
          transform: 'translate3d(var(--magnetic-x, 0px), var(--magnetic-y, 0px), 0)',
          transitionDuration: 'var(--magnetic-duration)',
          transitionTimingFunction: 'var(--magnetic-ease)',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export interface MagneticInnerProps extends React.ComponentProps<'span'> {
  /** How much further it moves than the `Magnetic` around it, as a fraction of the pull. Default 0.5. */
  factor?: number
}

/** Content inside a `Magnetic` that moves further than its frame, like a label in a button. */
function MagneticInner({ factor = 0.5, className, style, ...props }: MagneticInnerProps) {
  return (
    <span
      data-slot="magnetic-inner"
      className={cn(
        'inline-flex items-center justify-center gap-[inherit] transition-transform motion-reduce:transition-none',
        className,
      )}
      style={{
        transform: `translate3d(calc(var(--magnetic-x, 0px) * ${factor}), calc(var(--magnetic-y, 0px) * ${factor}), 0)`,
        transitionDuration: 'var(--magnetic-duration, 600ms)',
        transitionTimingFunction: `var(--magnetic-ease, ${springBack})`,
        ...style,
      }}
      {...props}
    />
  )
}

export { Magnetic, MagneticInner }
