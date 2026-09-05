'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CompareProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** What shows on the left. Usually an image, but anything works. */
  before: React.ReactNode
  /** What shows on the right. */
  after: React.ReactNode
  /** Starting position of the divider, 0 to 100. Default 50. */
  initial?: number
  /** Controlled position. */
  value?: number
  onValueChange?: (value: number) => void
  /** `drag` moves the divider while pressing, `hover` follows the pointer. Default drag. */
  mode?: 'drag' | 'hover'
  /** Labels shown in the corners. */
  labels?: [string, string]
  /** Accessible name of the slider. Default "Compare". */
  'aria-label'?: string
}

/**
 * Two layers with a divider you drag to compare them: before and after, an image and
 * its edited version, two designs. The divider is a slider, so arrow keys move it too.
 */
function Compare({
  before,
  after,
  initial = 50,
  value,
  onValueChange,
  mode = 'drag',
  labels,
  className,
  'aria-label': ariaLabel = 'Compare',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  ...props
}: CompareProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [uncontrolled, setUncontrolled] = React.useState(initial)
  const position = value ?? uncontrolled
  const dragging = React.useRef(false)

  const set = (next: number) => {
    const clamped = Math.max(0, Math.min(100, next))
    if (value === undefined) setUncontrolled(clamped)
    onValueChange?.(clamped)
  }

  const fromPointer = (e: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    set(((e.clientX - rect.left) / rect.width) * 100)
  }

  return (
    <div
      ref={ref}
      data-slot="compare"
      data-mode={mode}
      className={cn(
        'group/compare relative select-none overflow-hidden rounded-xl',
        mode === 'drag' ? 'cursor-col-resize touch-none' : 'cursor-crosshair',
        className,
      )}
      style={{ '--position': `${position}%` } as React.CSSProperties}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (mode !== 'drag' || e.button !== 0) return
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e)
        if (mode === 'hover' || dragging.current) fromPointer(e)
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e)
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      {...props}
    >
      <div data-slot="compare-after" className="[&>*]:block [&>img]:w-full">
        {after}
      </div>
      <div
        data-slot="compare-before"
        className="absolute inset-0 [&>*]:block [&>img]:size-full [&>img]:object-cover"
        style={{ clipPath: 'inset(0 calc(100% - var(--position)) 0 0)' }}
      >
        {before}
      </div>
      {labels && (
        <>
          <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-white text-xs">
            {labels[0]}
          </span>
          <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-white text-xs">
            {labels[1]}
          </span>
        </>
      )}
      <div
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-orientation="horizontal"
        data-slot="compare-handle"
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.2)] outline-none [left:var(--position)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (e.defaultPrevented) return
          const step = e.shiftKey ? 10 : 2
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(position - step)
          else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(position + step)
          else if (e.key === 'Home') set(0)
          else if (e.key === 'End') set(100)
          else return
          e.preventDefault()
        }}
      >
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform group-active/compare:scale-110"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  )
}

export { Compare }
