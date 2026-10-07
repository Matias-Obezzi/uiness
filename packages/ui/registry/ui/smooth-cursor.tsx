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
const TEXT_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

// The system cursor goes on everything in the scope, links and buttons included, since they
// set a cursor of their own. Text fields keep theirs: the caret is how you aim inside them.
const HIDE_SYSTEM_CURSOR = `[data-smooth-cursor], [data-smooth-cursor] :not(${TEXT_FIELD}, ${TEXT_FIELD} *) { cursor: none !important; }`

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
    const scopeEl = isParentScope ? el.parentElement : document.documentElement
    scopeEl?.setAttribute('data-smooth-cursor', '')

    let frame = 0
    let last = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let vx = 0
    let vy = 0
    let currentAngle = 0
    let scale = 1
    let pressed = false
    let interactive = false
    // Hidden until the pointer arrives, and again after it leaves: the next arrival places the
    // cursor under the pointer instead of flying it in from wherever it was.
    let shown = false

    const targetScale = () => (pressed ? 0.8 : interactive ? 1.4 : 1)

    const renderTransform = () => {
      const rot = rotate && !reduced ? `rotate(${currentAngle.toFixed(1)}deg)` : ''
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) ${rot} scale(${scale.toFixed(3)})`
    }

    // One spring step is a sixtieth of a second, so the feel is the same at 60 Hz and 120 Hz.
    const step = () => {
      vx = (vx + (tx - cx) * stiffness) * damping
      vy = (vy + (ty - cy) * stiffness) * damping
      cx += vx
      cy += vy
      scale += (targetScale() - scale) * 0.3
    }

    const loop = (now: number) => {
      const steps = Math.min(4, Math.max(1, Math.round((now - last) / (1000 / 60))))
      last = now
      for (let i = 0; i < steps; i++) step()

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
      if (dist < 0.1 && speed < 0.1 && Math.abs(targetScale() - scale) < 0.005) {
        cx = tx
        cy = ty
        vx = 0
        vy = 0
        scale = targetScale()
        frame = 0
        renderTransform()
        return
      }

      renderTransform()
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (frame) return
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }

    const onMove = (e: Event) => {
      const pe = e as PointerEvent
      if (pe.pointerType === 'touch') return

      if (isParentScope && el.parentElement) {
        const rect = el.parentElement.getBoundingClientRect()
        tx = pe.clientX - rect.left
        ty = pe.clientY - rect.top
      } else {
        tx = pe.clientX
        ty = pe.clientY
      }

      const target = pe.target as HTMLElement | null
      // Over a text field the system cursor is back, so the circle steps aside.
      if (target?.closest?.(TEXT_FIELD)) {
        shown = false
        el.style.opacity = '0'
        return
      }
      interactive = !!target?.closest?.('a, button, [role=button], [data-cursor]')

      if (reduced || !shown) {
        cx = tx
        cy = ty
        vx = 0
        vy = 0
        scale = targetScale()
        shown = true
        el.style.opacity = '1'
        renderTransform()
        if (reduced) return
      }

      start()
    }

    const onDown = () => {
      pressed = true
      if (reduced) {
        scale = targetScale()
        renderTransform()
      } else start()
    }

    const onUp = () => {
      pressed = false
      if (reduced) {
        scale = targetScale()
        renderTransform()
      } else start()
    }

    const onLeave = () => {
      shown = false
      el.style.opacity = '0'
    }

    targetEl.addEventListener('pointermove', onMove as EventListener, { passive: true })
    targetEl.addEventListener('pointerdown', onDown as EventListener)
    targetEl.addEventListener('pointerup', onUp as EventListener)
    if (scope === 'parent' && el.parentElement) {
      el.parentElement.addEventListener('pointerleave', onLeave)
    } else {
      document.documentElement.addEventListener('pointerleave', onLeave)
    }

    return () => {
      scopeEl?.removeAttribute('data-smooth-cursor')
      cancelAnimationFrame(frame)
      targetEl.removeEventListener('pointermove', onMove as EventListener)
      targetEl.removeEventListener('pointerdown', onDown as EventListener)
      targetEl.removeEventListener('pointerup', onUp as EventListener)
      if (scope === 'parent' && el.parentElement) {
        el.parentElement.removeEventListener('pointerleave', onLeave)
      } else {
        document.documentElement.removeEventListener('pointerleave', onLeave)
      }
    }
  }, [stiffness, damping, rotate, scope, reduced])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="smooth-cursor"
      className={cn(
        // The pointer sits at the element's top left corner, so it turns and scales from there.
        'pointer-events-none z-50 origin-top-left opacity-0 transition-opacity duration-150 will-change-transform',
        scope === 'page' ? 'fixed top-0 left-0' : 'absolute top-0 left-0',
        className,
      )}
      style={style}
      {...props}
    >
      {children ?? <DefaultCursorShape />}
      <style href="uiness-smooth-cursor" precedence="default">
        {HIDE_SYSTEM_CURSOR}
      </style>
    </div>
  )
}

export { SmoothCursor }
