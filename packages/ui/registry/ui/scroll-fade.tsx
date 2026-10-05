'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

type Edge = 'top' | 'bottom' | 'left' | 'right'
const EDGES: Edge[] = ['top', 'bottom', 'left', 'right']

export type ScrollFadeOrientation = 'vertical' | 'horizontal' | 'both'

export interface ScrollFadeProps extends React.ComponentProps<'div'> {
  /** The axis that scrolls and fades. */
  orientation?: ScrollFadeOrientation
  /** How far the fade reaches into the content, in pixels. */
  size?: number
  /** Hide the scrollbar, for rows of chips or tabs where the fade is the only hint. */
  hideScrollbar?: boolean
  /** Fade an element of your own, which must be the one that scrolls. */
  asChild?: boolean
}

/** Elements marked with this attribute cover the start edge while stuck, so the fade starts below them. */
const STICKY = '[data-scroll-fade-sticky]'

const px = (n: number) => `${Math.round(n * 100) / 100}px`

/**
 * One gradient per axis. Each edge reads two variables: how far the fade reaches, which is 0px
 * when there is nothing more that way, and where it starts, past any sticky header.
 */
const gradient = (from: Edge, to: Edge, dir: string) =>
  `linear-gradient(${dir}, #000 var(--scroll-fade-${from}-offset, 0px), transparent var(--scroll-fade-${from}-offset, 0px), #000 calc(var(--scroll-fade-${from}-offset, 0px) + var(--scroll-fade-${from}, 0px)), #000 calc(100% - var(--scroll-fade-${to}, 0px)), transparent 100%)`

const VERTICAL = gradient('top', 'bottom', 'to bottom')
const HORIZONTAL = gradient('left', 'right', 'to right')

const masks: Record<ScrollFadeOrientation, React.CSSProperties> = {
  vertical: { maskImage: VERTICAL, WebkitMaskImage: VERTICAL },
  horizontal: { maskImage: HORIZONTAL, WebkitMaskImage: HORIZONTAL },
  both: {
    maskImage: `${VERTICAL}, ${HORIZONTAL}`,
    WebkitMaskImage: `${VERTICAL}, ${HORIZONTAL}`,
    maskComposite: 'intersect',
    WebkitMaskComposite: 'source-in',
  },
}

/**
 * Reads the scroll position and writes the fades as CSS variables and data attributes, straight
 * on the element: scrolling never re-renders React. Each fade grows with the distance left to
 * scroll, up to `size`, so it eases in and out with the scroll itself and needs no transition.
 */
function useScrollFade(
  ref: React.RefObject<HTMLElement | null>,
  orientation: ScrollFadeOrientation,
  size: number,
) {
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const vertical = orientation !== 'horizontal'
    const horizontal = orientation !== 'vertical'
    let sticky: { node: HTMLElement; top: number; left: number }[] = []
    let rtl = false
    let padding = { top: 0, left: 0 }
    let frame = 0

    const collect = () => {
      const own = getComputedStyle(el)
      rtl = own.direction === 'rtl'
      // Sticky elements stick inside the scroller's padding, not at its edge.
      padding = {
        top: Number.parseFloat(own.paddingTop) || 0,
        left: Number.parseFloat(own.paddingLeft) || 0,
      }
      sticky = Array.from(el.querySelectorAll<HTMLElement>(STICKY)).map((node) => {
        const style = getComputedStyle(node)
        return { node, top: Number.parseFloat(style.top), left: Number.parseFloat(style.left) }
      })
    }

    // How much of the start edge sticky elements cover: the lowest bottom of those that have
    // reached their stuck position. One still on its way up does not count yet.
    const covered = (axis: 'top' | 'left') => {
      if (!sticky.length) return 0
      const box = el.getBoundingClientRect()
      const start = axis === 'top' ? box.top + el.clientTop : box.left + el.clientLeft
      let reach = 0
      for (const s of sticky) {
        const at = s.node.getBoundingClientRect()
        const inset = (axis === 'top' ? s.top : s.left) + padding[axis]
        if (Number.isNaN(inset)) continue
        const near = axis === 'top' ? at.top : at.left
        const far = axis === 'top' ? at.bottom : at.right
        if (near - start <= inset + 0.5 && far > start) reach = Math.max(reach, far - start)
      }
      return reach
    }

    const update = () => {
      frame = 0
      const fades: Record<Edge, number> = { top: 0, bottom: 0, left: 0, right: 0 }
      const offsets = { top: 0, left: 0 }
      if (vertical) {
        const rest = el.scrollHeight - el.clientHeight
        fades.top = Math.min(size, Math.max(0, el.scrollTop))
        fades.bottom = Math.min(size, Math.max(0, rest - el.scrollTop))
        if (fades.top > 0) offsets.top = covered('top')
      }
      if (horizontal) {
        const rest = el.scrollWidth - el.clientWidth
        // In right to left the start is on the right and scrollLeft runs negative.
        const fromStart = Math.abs(el.scrollLeft)
        const before = Math.min(size, Math.max(0, fromStart))
        const after = Math.min(size, Math.max(0, rest - fromStart))
        fades.left = rtl ? after : before
        fades.right = rtl ? before : after
        if (fades.left > 0) offsets.left = covered('left')
      }
      for (const edge of EDGES) {
        // Under a pixel is rounding, not content.
        const value = fades[edge] < 1 ? 0 : fades[edge]
        el.style.setProperty(`--scroll-fade-${edge}`, px(value))
        el.toggleAttribute(`data-fade-${edge}`, value > 0)
      }
      el.style.setProperty('--scroll-fade-top-offset', px(offsets.top))
      el.style.setProperty('--scroll-fade-left-offset', px(offsets.left))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    collect()
    update()
    el.addEventListener('scroll', schedule, { passive: true })

    // The scroller and what is inside it changing size both move the edges.
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : undefined
    const observeChildren = () => {
      if (!resize) return
      resize.disconnect()
      resize.observe(el)
      for (const child of Array.from(el.children)) resize.observe(child)
    }
    observeChildren()

    // Content added or removed: watch the new children and find the sticky ones again.
    const mutation =
      typeof MutationObserver === 'function'
        ? new MutationObserver(() => {
            observeChildren()
            collect()
            schedule()
          })
        : undefined
    mutation?.observe(el, { childList: true, subtree: true })

    return () => {
      el.removeEventListener('scroll', schedule)
      resize?.disconnect()
      mutation?.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, orientation, size])
}

const overflow: Record<ScrollFadeOrientation, string> = {
  vertical: 'overflow-y-auto',
  horizontal: 'overflow-x-auto',
  both: 'overflow-auto',
}

/**
 * A scroller whose edges fade out where there is more to see. The fade is a mask, so it works
 * on any background, and each edge shows only while there is content past it.
 */
function ScrollFade({
  orientation = 'vertical',
  size = 40,
  hideScrollbar = false,
  asChild = false,
  className,
  style,
  ref: forwardedRef,
  ...props
}: ScrollFadeProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  useScrollFade(ref, orientation, size)

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      ref={setRef}
      // A component passed with asChild keeps its own slot name: even an undefined one
      // would be spread over it.
      {...(asChild ? {} : { 'data-slot': 'scroll-fade' })}
      data-orientation={orientation}
      className={cn(
        overflow[orientation],
        hideScrollbar && '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ ...masks[orientation], ...style }}
      {...props}
    />
  )
}

export { ScrollFade }
