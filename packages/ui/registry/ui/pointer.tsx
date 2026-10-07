'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PointerProps extends React.ComponentProps<'div'> {
  /** Offset of the pointer tip from the top-left of the cursor element, in pixels. Default [0, 0]. */
  hotspot?: [number, number]
}

const FINE_POINTER = '(hover: hover) and (pointer: fine)'

function DefaultCursorArrow() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-6 text-foreground drop-shadow-md"
      aria-hidden="true"
    >
      <path
        d="M3 3L10.07 20.97L12.58 13.58L19.97 11.07L3 3Z"
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Replaces the system cursor with a custom element inside its parent container.
 * Only activates on devices with a mouse or trackpad, restoring the native cursor
 * when hovering editable text inputs.
 */
function Pointer({ hotspot = [0, 0], className, style, children, ...props }: PointerProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [hx, hy] = hotspot

  React.useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    if (typeof matchMedia === 'function' && !matchMedia(FINE_POINTER).matches) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const target = e.target as HTMLElement | null
      const overInput = !!target?.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
      )

      if (overInput) {
        el.style.opacity = '0'
        parent.style.cursor = 'auto'
        return
      }

      const rect = parent.getBoundingClientRect()
      const x = e.clientX - rect.left - hx
      const y = e.clientY - rect.top - hy

      parent.style.cursor = 'none'
      el.style.opacity = '1'
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    }

    const onLeave = () => {
      el.style.opacity = '0'
      parent.style.cursor = ''
    }

    parent.addEventListener('pointermove', onMove, { passive: true })
    parent.addEventListener('pointerleave', onLeave)

    return () => {
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
      parent.style.cursor = ''
    }
  }, [hx, hy])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="pointer"
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-50 opacity-0 transition-opacity duration-75 will-change-transform',
        className,
      )}
      style={style}
      {...props}
    >
      {children ?? <DefaultCursorArrow />}
    </div>
  )
}

export { Pointer }
