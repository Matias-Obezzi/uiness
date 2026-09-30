'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface AnimatedListProps extends React.ComponentProps<'ul'> {
  /** Milliseconds between one item and the next. Default 1000. */
  delay?: number
  /** Start over with the first child after the last one, forever. Default false. */
  loop?: boolean
  /** Most items on screen at once; older ones leave at the bottom. Default all of them. */
  max?: number
  /** Milliseconds the spring of each new item takes. Default 600. */
  duration?: number
}

interface Box {
  top: number
  left: number
  width: number
}

const SPRING = 'var(--easing-spring, cubic-bezier(0.34, 1.56, 0.64, 1))'

/**
 * A feed that adds its children one at a time, newest on top. Each new item springs in and
 * the ones below slide down to make room. Starts when it scrolls into view and shows
 * everything at once with reduced motion.
 */
function AnimatedList({
  delay = 1000,
  loop = false,
  max,
  duration = 600,
  className,
  children,
  ...props
}: AnimatedListProps) {
  const ref = React.useRef<HTMLUListElement>(null)
  const inView = useInView(ref, { amount: 0 })
  const reduced = useReducedMotion()
  const items = React.Children.toArray(children)
  const count = items.length
  // How many items have been added so far. Every addition gets its own id, so an item that
  // comes back around in a loop is a new element and plays its entrance again.
  const [added, setAdded] = React.useState(0)
  const boxes = React.useRef(new Map<number, Box>())

  React.useEffect(() => {
    if (!inView || reduced || count === 0) return
    if (!loop && added >= count) return
    const timer = setTimeout(() => setAdded((n) => n + 1), added === 0 ? 0 : delay)
    return () => clearTimeout(timer)
  }, [inView, reduced, count, loop, added, delay])

  const limit = Math.max(1, Math.min(max ?? count, count))
  const total = reduced ? count : added
  const first = Math.max(0, total - limit)
  const ids: number[] = []
  for (let id = total - 1; id >= first; id--) ids.push(id)
  // The one that just dropped off the bottom stays a moment to fade out.
  const leaving = !reduced && first > 0 ? first - 1 : null

  // Slide the older items from where they were to where they are now. This uses `translate`,
  // which stacks with the `transform` the entrance animates.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs for every new item
  React.useLayoutEffect(() => {
    const list = ref.current
    if (!list) return
    const els = Array.from(list.children) as HTMLElement[]
    const next = new Map<number, Box>()
    const moved: HTMLElement[] = []
    for (const el of els) {
      const id = Number(el.dataset.id)
      const prev = boxes.current.get(id)
      if (el.dataset.state === 'leaving') {
        // Out of the flow, pinned where it last stood.
        if (prev)
          Object.assign(el.style, {
            top: `${prev.top}px`,
            left: `${prev.left}px`,
            width: `${prev.width}px`,
          })
        continue
      }
      const top = el.offsetTop
      next.set(id, { top, left: el.offsetLeft, width: el.offsetWidth })
      if (reduced || !prev || prev.top === top) continue
      el.style.transition = 'none'
      el.style.translate = `0 ${prev.top - top}px`
      moved.push(el)
    }
    boxes.current = next
    if (moved.length === 0) return
    // One reflow so the inverted positions land before the transition starts.
    void list.offsetHeight
    for (const el of moved) {
      el.style.transition = `translate ${duration}ms ${SPRING}`
      el.style.translate = ''
    }
  }, [total, reduced, duration])

  return (
    <ul
      ref={ref}
      data-slot="animated-list"
      className={cn('relative flex flex-col gap-3', className)}
      {...props}
    >
      {ids.map((id) => (
        <li
          key={id}
          data-id={id}
          data-slot="animated-list-item"
          data-state="visible"
          className="origin-top motion-reduce:animate-none"
          style={
            reduced ? undefined : { animation: `animated-list-in ${duration}ms ${SPRING} both` }
          }
        >
          {items[id % count]}
        </li>
      ))}
      {leaving !== null && (
        <li
          key={leaving}
          aria-hidden
          data-id={leaving}
          data-slot="animated-list-item"
          data-state="leaving"
          className="pointer-events-none absolute origin-top"
          style={{ animation: `animated-list-out ${Math.round(duration / 2)}ms ease-in both` }}
        >
          {items[leaving % count]}
        </li>
      )}
    </ul>
  )
}

export { AnimatedList }
