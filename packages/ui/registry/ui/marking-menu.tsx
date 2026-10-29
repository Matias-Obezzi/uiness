'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface MarkingItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface MarkingMenuLabels {
  /** How to use it, for screen readers. */
  hint: string
}

export const defaultMarkingMenuLabels: MarkingMenuLabels = {
  hint: 'Press and hold, then move toward an item and let go. Or press Enter and use the arrow keys.',
}

/** Held this long, a press opens the ring. */
const HOLD_MS = 250
/** Pixels from the centre before a direction counts. */
const DEAD_ZONE = 22
/** A flick this far before the ring opens picks by direction alone. */
const FLICK_PX = 44
const RADIUS = 78

/** Which item a direction points at: the first is straight up, then clockwise. */
export function itemAt(dx: number, dy: number, count: number): number | null {
  if (Math.hypot(dx, dy) < DEAD_ZONE || count === 0) return null
  const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI)
  return Math.round(angle / ((2 * Math.PI) / count)) % count
}

export interface MarkingMenuProps extends Omit<React.ComponentProps<'button'>, 'onSelect'> {
  items: MarkingItem[]
  onSelect: (id: string) => void
  labels?: Partial<MarkingMenuLabels>
}

/**
 * A radial menu. Press and hold to open a ring of items around the press, move toward one and
 * let go; once you know where things are, flick in a direction and it picks without waiting
 * for the ring. A tap opens it to choose at leisure. On the keyboard Enter opens it, the arrows
 * go round and Enter picks.
 */
function MarkingMenu({
  items,
  onSelect,
  labels: labelsProp,
  className,
  children,
  ...props
}: MarkingMenuProps) {
  const labels = useLabels('marking-menu', defaultMarkingMenuLabels, labelsProp)
  const [open, setOpen] = React.useState<{ x: number; y: number } | null>(null)
  const [active, setActive] = React.useState<number | null>(null)
  const press = React.useRef<{ pointer: number; x: number; y: number; at: number } | null>(null)
  const timer = React.useRef(0)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const ring = React.useRef<HTMLDivElement>(null)
  const id = React.useId()
  const hintId = `${id}-hint`

  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  React.useEffect(() => {
    if (open) ring.current?.focus()
  }, [open])

  const close = (pick: number | null) => {
    setOpen(null)
    setActive(null)
    const item = pick === null ? undefined : items[pick]
    if (item) onSelect(item.id)
    trigger.current?.focus()
  }
  const centre = () => {
    const box = trigger.current?.getBoundingClientRect()
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-slot="marking-menu"
        aria-haspopup="menu"
        aria-expanded={!!open}
        aria-describedby={hintId}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          press.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            at: event.timeStamp,
          }
          timer.current = window.setTimeout(
            () => setOpen({ x: event.clientX, y: event.clientY }),
            HOLD_MS,
          )
        }}
        onPointerMove={(event) => {
          const p = press.current
          if (!p || p.pointer !== event.pointerId) return
          const dx = event.clientX - p.x
          const dy = event.clientY - p.y
          setActive(itemAt(dx, dy, items.length))
          // A flick before the ring opens: chosen by direction, the ring never shows.
          if (!open && Math.hypot(dx, dy) > FLICK_PX) {
            window.clearTimeout(timer.current)
            press.current = null
            close(itemAt(dx, dy, items.length))
          }
        }}
        onPointerUp={(event) => {
          const p = press.current
          window.clearTimeout(timer.current)
          press.current = null
          if (!p) return
          const moved = Math.hypot(event.clientX - p.x, event.clientY - p.y)
          // A tap: the ring opens and stays, to choose with another tap.
          if (!open && moved < DEAD_ZONE) {
            const c = centre()
            setOpen(c)
            return
          }
          if (open) close(itemAt(event.clientX - p.x, event.clientY - p.y, items.length))
        }}
        onPointerCancel={() => {
          window.clearTimeout(timer.current)
          press.current = null
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return
          event.preventDefault()
          setActive(0)
          setOpen(centre())
        }}
        onClick={(event) => event.preventDefault()}
        className={cn(
          'relative inline-flex size-12 touch-none select-none items-center justify-center rounded-full border bg-background shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-5',
          className,
        )}
        {...props}
      >
        {children}
      </button>
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>
      {open &&
        createPortal(
          <>
            {/* A press anywhere else closes it. */}
            <div className="fixed inset-0 z-(--z-popover,60)" onPointerDown={() => close(null)} />
            <div
              ref={ring}
              role="menu"
              tabIndex={-1}
              aria-activedescendant={active === null ? undefined : `${id}-${active}`}
              onKeyDown={(event) => {
                const n = items.length
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
                  setActive(((active ?? -1) + 1) % n)
                else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
                  setActive(((active ?? 0) - 1 + n) % n)
                else if (event.key === 'Enter' || event.key === ' ') close(active)
                else if (event.key === 'Escape' || event.key === 'Tab') close(null)
                else return
                event.preventDefault()
              }}
              className="fixed z-(--z-popover,60) size-0 outline-none"
              style={{ left: open.x, top: open.y }}
            >
              <span
                aria-hidden="true"
                className="absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-muted-foreground/40 bg-background/70 backdrop-blur-sm animate-in zoom-in-50 fade-in motion-reduce:animate-none"
              />
              {items.map((item, i) => {
                const a = (i / items.length) * 2 * Math.PI
                return (
                  <div
                    key={item.id}
                    id={`${id}-${i}`}
                    role="menuitem"
                    tabIndex={-1}
                    onPointerUp={() => close(i)}
                    onPointerEnter={() => setActive(i)}
                    onKeyDown={() => {}}
                    onClick={() => close(i)}
                    className={cn(
                      'absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border bg-popover px-3 py-1.5 font-medium text-popover-foreground text-sm shadow-md transition-[scale,background-color] animate-in zoom-in-75 fade-in motion-reduce:animate-none [&_svg]:size-4',
                      active === i && 'scale-110 border-primary bg-primary text-primary-foreground',
                    )}
                    style={{ left: Math.sin(a) * RADIUS, top: -Math.cos(a) * RADIUS }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                )
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

export { MarkingMenu }
