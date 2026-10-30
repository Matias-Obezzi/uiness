'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface PageFlipLabels {
  book: string
  previous: string
  next: string
  /** The pages in view, numbered from 1. `from` and `to` are equal on a single page. */
  pages: (from: number, to: number, total: number) => string
}

export const defaultPageFlipLabels: PageFlipLabels = {
  book: 'Book',
  previous: 'Previous page',
  next: 'Next page',
  pages: (from, to, total) =>
    from === to ? `Page ${from} of ${total}` : `Pages ${from}–${to} of ${total}`,
}

/**
 * The turn of a page whose edge is at `x`, from -1 at the left edge of the book to 1 at the
 * right, in degrees: 0 lying on the right, 180 on the left.
 */
export function turnAt(x: number) {
  return (Math.acos(Math.max(-1, Math.min(1, x))) * 180) / Math.PI
}

export interface PageFlipProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The pages in order. Each leaf carries two: its front on the right, its back on the left. */
  pages: React.ReactNode[]
  /** How many leaves are turned. */
  turned?: number
  defaultTurned?: number
  onTurnedChange?: (turned: number) => void
  labels?: Partial<PageFlipLabels>
}

/**
 * A book you turn by hand: drag a page over the spine and it follows your finger, curling its
 * shade as it lifts, or tap a side to turn it. The buttons under it turn pages for the keyboard.
 */
function PageFlip({
  pages,
  turned: turnedProp,
  defaultTurned = 0,
  onTurnedChange,
  labels: labelsProp,
  className,
  ...props
}: PageFlipProps) {
  const labels = useLabels('page-flip', defaultPageFlipLabels, labelsProp)
  const reduced = useReducedMotion()
  const leaves = Math.ceil(pages.length / 2)
  const [inner, setInner] = React.useState(defaultTurned)
  const turned = turnedProp ?? inner
  const book = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState<{ leaf: number; angle: number } | null>(null)
  const start = React.useRef<{ x: number; leaf: number; moved: boolean } | null>(null)
  // The leaf that just turned stays on top until it lands, or the page under it shows through.
  const [lifted, setLifted] = React.useState<number | null>(null)
  const [prevTurned, setPrevTurned] = React.useState(turned)
  if (prevTurned !== turned) {
    setPrevTurned(turned)
    if (!reduced) setLifted(Math.min(prevTurned, turned))
  }

  const turnTo = (n: number) => {
    const next = Math.max(0, Math.min(leaves, n))
    setInner(next)
    onTurnedChange?.(next)
  }
  const edge = (clientX: number) => {
    const r = book.current?.getBoundingClientRect()
    return r ? ((clientX - r.left) / r.width) * 2 - 1 : 0
  }

  const from = turned * 2
  const to = Math.min(pages.length, turned * 2 + 1)

  return (
    <div
      data-slot="page-flip"
      className={cn('flex w-full flex-col items-center gap-3', className)}
      {...props}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset breaks the absolutely placed leaves in Chrome */}
      <div
        ref={book}
        role="group"
        aria-label={labels.book}
        className="relative aspect-[3/2] w-full max-w-2xl touch-pan-y select-none [perspective:1800px]"
        onPointerDown={(e) => {
          const right = edge(e.clientX) > 0
          const leaf = right ? turned : turned - 1
          if (leaf < 0 || leaf >= leaves) return
          e.currentTarget.setPointerCapture(e.pointerId)
          start.current = { x: e.clientX, leaf, moved: false }
        }}
        onPointerMove={(e) => {
          const s = start.current
          if (!s) return
          if (!s.moved && Math.abs(e.clientX - s.x) < 8) return
          s.moved = true
          setDrag({ leaf: s.leaf, angle: turnAt(edge(e.clientX)) })
        }}
        onPointerUp={(e) => {
          const s = start.current
          start.current = null
          setDrag(null)
          if (!s) return
          const forward = s.leaf === turned
          if (!s.moved) turnTo(forward ? turned + 1 : turned - 1)
          else if (turnAt(edge(e.clientX)) > 90) turnTo(s.leaf + 1)
          else turnTo(s.leaf)
        }}
        onPointerCancel={() => {
          start.current = null
          setDrag(null)
        }}
      >
        <div className="absolute inset-y-0 left-1/2 z-[999] w-px -translate-x-1/2 bg-black/10 shadow-[0_0_12px_4px_rgb(0_0_0/0.08)]" />
        {Array.from({ length: leaves }, (_, leaf) => {
          const isTurned = leaf < turned
          const angle = drag?.leaf === leaf ? drag.angle : isTurned ? 180 : 0
          const lift = Math.sin((angle * Math.PI) / 180)
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: leaf n is always the same leaf
              key={leaf}
              className={cn(
                'absolute inset-y-0 left-1/2 w-1/2 origin-left [transform-style:preserve-3d]',
                drag?.leaf !== leaf &&
                  !reduced &&
                  'transition-transform duration-700 ease-[cubic-bezier(0.3,0.7,0.2,1)]',
              )}
              style={{
                transform: `rotateY(${-angle}deg)`,
                zIndex:
                  drag?.leaf === leaf || (!drag && lifted === leaf)
                    ? leaves + 1
                    : isTurned
                      ? leaf
                      : leaves - leaf,
              }}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget && lifted === leaf) setLifted(null)
              }}
            >
              {[0, 1].map((side) => {
                const page = leaf * 2 + side
                const visible = !drag && (side === 0 ? leaf === turned : leaf === turned - 1)
                return (
                  <div
                    key={side}
                    inert={!visible}
                    aria-hidden={!visible}
                    className={cn(
                      'absolute inset-0 overflow-hidden border bg-card [backface-visibility:hidden]',
                      side === 0 ? 'rounded-r-lg' : 'rounded-l-lg',
                    )}
                    style={side ? { transform: 'rotateY(180deg)' } : undefined}
                  >
                    <div className="size-full overflow-hidden p-4 sm:p-6">{pages[page]}</div>
                    {/* The curl's shade, deepest when the page stands up. */}
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-0',
                        side === 0
                          ? 'bg-linear-to-r from-black/25 to-transparent'
                          : 'bg-linear-to-l from-black/25 to-transparent',
                      )}
                      style={{ opacity: 0.15 + lift * 0.85 }}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={labels.previous}
          disabled={turned === 0}
          onClick={() => turnTo(turned - 1)}
          className="flex size-9 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 pointer-coarse:size-11"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span
          aria-live="polite"
          className="min-w-32 text-center text-muted-foreground text-sm tabular-nums"
        >
          {labels.pages(Math.max(1, from), Math.max(1, to), pages.length)}
        </span>
        <button
          type="button"
          aria-label={labels.next}
          disabled={turned >= leaves}
          onClick={() => turnTo(turned + 1)}
          className="flex size-9 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 pointer-coarse:size-11"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { PageFlip }
