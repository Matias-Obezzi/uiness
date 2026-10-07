'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface SmoothCursorProps extends React.ComponentProps<'div'> {
  /** Tension of the trailing spring, from 0.05 to 0.5. Default 0.2. */
  stiffness?: number
  /** Resistance damping of the spring, from 0.5 to 0.95. Default 0.75. */
  damping?: number
  /** Whether the cursor rotates toward the direction of travel. Default true. */
  rotate?: boolean
  /** Scope of tracking: `'page'` tracks across the window; `'parent'` tracks within the parent container. Default 'page'. */
  scope?: 'page' | 'parent'
}

const FINE_POINTER = '(hover: hover) and (pointer: fine)'

function DefaultCursorShape() {
  return (
    <div className="size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/40 bg-foreground/15 shadow-xs backdrop-blur-xs" />
  )
}

/**
 * A smooth cursor follower driven by spring physics. Rotates into the movement trajectory,
 * compresses when pressed, and scales up when hovering interactive elements.
 * Settles completely when idle, stopping the animation loop.
 */
function SmoothCursor({
  stiffness = 0.2,
  damping = 0.75,
  rotate = true,
  scope = 'page',
  className,
  style,
  children,
  ...props
}: SmoothCursorProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof matchMedia === 'function' && !matchMedia(FINE_POINTER).matches) return

    const targetEl: EventTarget = scope === 'page' ? window : (el.parentElement ?? window)
    const isParentScope = scope === 'parent' && el.parentElement !== null

    let frame = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let vx = 0
    let vy = 0
    let currentAngle = 0
    let pressed = false
    let interactive = false

    const renderTransform = () => {
      const scale = pressed ? 0.8 : interactive ? 1.4 : 1
      const rot = rotate && !reduced ? `rotate(${currentAngle.toFixed(1)}deg)` : ''
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) ${rot} scale(${scale.toFixed(2)})`
    }

    const loop = () => {
      vx = (vx + (tx - cx) * stiffness) * damping
      vy = (vy + (ty - cy) * stiffness) * damping
      cx += vx
      cy += vy

      if (rotate) {
        const dx = tx - cx
        const dy = ty - cy
        if (Math.hypot(dx, dy) > 1.5) {
          const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI
          let diff = (targetAngle - currentAngle) % 360
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          currentAngle += diff * 0.25
        }
      }

      const dist = Math.hypot(tx - cx, ty - cy)
      const speed = Math.hypot(vx, vy)
      if (dist < 0.1 && speed < 0.1) {
        cx = tx
        cy = ty
        vx = 0
        vy = 0
        frame = 0
        renderTransform()
        return
      }

      renderTransform()
      frame = requestAnimationFrame(loop)
    }

    const onMove = (e: Event) => {
      const pe = e as PointerEvent
      if (pe.pointerType === 'touch') return
      el.style.opacity = '1'

      if (isParentScope && el.parentElement) {
        const rect = el.parentElement.getBoundingClientRect()
        tx = pe.clientX - rect.left
        ty = pe.clientY - rect.top
      } else {
        tx = pe.clientX
        ty = pe.clientY
      }

      const target = pe.target as HTMLElement | null
      interactive = !!target?.closest?.(
        'a, button, [role=button], [data-cursor], input, select, textarea',
      )

      if (reduced) {
        cx = tx
        cy = ty
        renderTransform()
        return
      }

      if (!frame) frame = requestAnimationFrame(loop)
    }

    const onDown = () => {
      pressed = true
      if (reduced) renderTransform()
      else if (!frame) frame = requestAnimationFrame(loop)
    }

    const onUp = () => {
      pressed = false
      if (reduced) renderTransform()
      else if (!frame) frame = requestAnimationFrame(loop)
    }

    const onLeave = () => {
      el.style.opacity = '0'
    }

    targetEl.addEventListener('pointermove', onMove as EventListener, { passive: true })
    targetEl.addEventListener('pointerdown', onDown as EventListener)
    targetEl.addEventListener('pointerup', onUp as EventListener)
    if (scope === 'parent' && el.parentElement) {
      el.parentElement.addEventListener('pointerleave', onLeave)
    } else {
      document.addEventListener('pointerleave', onLeave)
    }

    return () => {
      cancelAnimationFrame(frame)
      targetEl.removeEventListener('pointermove', onMove as EventListener)
      targetEl.removeEventListener('pointerdown', onDown as EventListener)
      targetEl.removeEventListener('pointerup', onUp as EventListener)
      if (scope === 'parent' && el.parentElement) {
        el.parentElement.removeEventListener('pointerleave', onLeave)
      } else {
        document.removeEventListener('pointerleave', onLeave)
      }
    }
  }, [stiffness, damping, rotate, scope, reduced])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="smooth-cursor"
      className={cn(
        'pointer-events-none z-50 opacity-0 transition-opacity duration-150 will-change-transform',
        scope === 'page' ? 'fixed top-0 left-0' : 'absolute top-0 left-0',
        className,
      )}
      style={style}
      {...props}
    >
      {children ?? <DefaultCursorShape />}
    </div>
  )
}

export { SmoothCursor }
