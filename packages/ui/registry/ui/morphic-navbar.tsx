'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  label: string
  /** A link; leave out for a button that only calls `onValueChange`. */
  href?: string
}

export interface MorphicNavbarLabels {
  /** Names the navigation. */
  nav: string
}

export const defaultMorphicNavbarLabels: MorphicNavbarLabels = {
  nav: 'Main',
}

/** Pixels between the active pill and the bar on each side of it. */
const GAP = 8
/** Movement before a press counts as a scrub. */
const SLOP = 6
/** How far ahead, in milliseconds, a flick carries the scrub. */
const PROJECT_MS = 160

type Box = { left: number; width: number }

export interface MorphicNavbarProps
  extends Omit<React.ComponentProps<'nav'>, 'children' | 'defaultValue'> {
  items: NavItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  labels?: Partial<MorphicNavbarLabels>
}

/**
 * A navigation bar that splits around the active link: the bar parts, with a gap on each side,
 * and the link sits in a pill of its own. Drag along the bar to scrub the pill from link to
 * link; let go and the link under it opens, a flick carrying it on a little further.
 */
function MorphicNavbar({
  items,
  value,
  defaultValue,
  onValueChange,
  labels: labelsProp,
  className,
  ...props
}: MorphicNavbarProps) {
  const labels = useLabels('morphic-navbar', defaultMorphicNavbarLabels, labelsProp)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue ?? items[0]?.id)
  const current = value ?? own
  const list = React.useRef<HTMLUListElement>(null)
  const [boxes, setBoxes] = React.useState<Box[]>([])
  const [width, setWidth] = React.useState(0)
  const [scrub, setScrub] = React.useState<number | null>(null)
  const drag = React.useRef<{
    pointer: number
    x: number
    samples: [number, number][]
    moved: boolean
  } | null>(null)
  // The click the browser sends after a scrub is not a click on a link.
  const swallow = React.useRef(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: new items, new sizes
  React.useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const measure = () => {
      setWidth(el.offsetWidth)
      setBoxes(
        Array.from(el.children, (li) => ({
          left: (li as HTMLElement).offsetLeft,
          width: (li as HTMLElement).offsetWidth,
        })),
      )
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items])

  const choose = (index: number) => {
    const item = items[index]
    if (!item) return
    // A link opens as if it was clicked, so a router can take it; its click handler chooses it.
    if (item.href) return list.current?.querySelectorAll<HTMLElement>('a, button')[index]?.click()
    if (value === undefined) setOwn(item.id)
    onValueChange?.(item.id)
  }
  const indexAt = (x: number) => {
    let best = 0
    boxes.forEach((b, i) => {
      if (
        Math.abs(b.left + b.width / 2 - x) <
        Math.abs((boxes[best]?.left ?? 0) + (boxes[best]?.width ?? 0) / 2 - x)
      )
        best = i
    })
    return best
  }

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === current),
  )
  const shown = scrub ?? activeIndex
  const pill = boxes[shown]
  const ease =
    !reduced &&
    'transition-[left,width] duration-(--duration-normal,200ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1))'

  return (
    <nav
      data-slot="morphic-navbar"
      aria-label={labels.nav}
      className={cn('relative inline-flex select-none', className)}
      {...props}
    >
      {/* The bar, parted into two capsules either side of the pill. */}
      {pill && (
        <>
          <span
            aria-hidden="true"
            className={cn('absolute inset-y-0 left-0 rounded-full bg-muted', ease)}
            style={{ width: Math.max(0, pill.left - GAP) }}
          />
          <span
            aria-hidden="true"
            className={cn('absolute inset-y-0 right-0 rounded-full bg-muted', ease)}
            style={{ width: Math.max(0, width - pill.left - pill.width - GAP) }}
          />
          <span
            aria-hidden="true"
            className={cn('absolute inset-y-0 rounded-full bg-primary shadow-md', ease)}
            style={{ left: pill.left, width: pill.width }}
          />
        </>
      )}
      <ul
        ref={list}
        className="relative flex touch-pan-y items-center"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          swallow.current = false
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            samples: [[event.timeStamp, event.clientX]],
            moved: false,
          }
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) return
          if (!d.moved && Math.abs(event.clientX - d.x) < SLOP) return
          if (!d.moved) {
            d.moved = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }
          d.samples.push([event.timeStamp, event.clientX])
          if (d.samples.length > 5) d.samples.shift()
          const box = event.currentTarget.getBoundingClientRect()
          setScrub(indexAt(event.clientX - box.left))
        }}
        onPointerUp={(event) => {
          const d = drag.current
          drag.current = null
          if (!d?.moved) return
          const first = d.samples[0] as [number, number]
          const speed = (event.clientX - first[1]) / Math.max(16, event.timeStamp - first[0])
          const box = event.currentTarget.getBoundingClientRect()
          setScrub(null)
          choose(indexAt(event.clientX - box.left + speed * PROJECT_MS))
          swallow.current = true
        }}
        onClickCapture={(event) => {
          if (!swallow.current) return
          swallow.current = false
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        {items.map((item, i) => {
          const on = i === shown
          const common = cn(
            'relative z-10 flex h-10 items-center px-4 font-medium text-sm outline-none transition-colors duration-(--duration-fast,150ms) focus-visible:rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-11',
            on ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )
          return (
            <li key={item.id}>
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={i === activeIndex ? 'page' : undefined}
                  onClick={() => {
                    if (value === undefined) setOwn(item.id)
                    onValueChange?.(item.id)
                  }}
                  className={common}
                  draggable={false}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={i === activeIndex ? 'true' : undefined}
                  onClick={() => choose(i)}
                  className={common}
                >
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { MorphicNavbar }
