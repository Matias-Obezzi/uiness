'use client'

import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface IndexSection {
  /** The id of the heading on the page. */
  id: string
  label: string
}

export interface ScrollIndexLabels {
  /** Names the rail. */
  index: string
}

export const defaultScrollIndexLabels: ScrollIndexLabels = {
  index: 'On this page',
}

/** Share of the viewport from the top past which a heading counts as the one being read. */
const READ_AT = 0.3

export interface ScrollIndexProps extends Omit<React.ComponentProps<'nav'>, 'children'> {
  /** The sections, in order. Leave out to find every `h2` with an id on the page. */
  sections?: IndexSection[]
  /** What to look for when `sections` is left out. Default `h2[id]`. */
  selector?: string
  labels?: Partial<ScrollIndexLabels>
}

/**
 * A rail of ticks for a long page, one per heading. The tick for the section being read is
 * longer; hover or focus one to see its heading, click it to go there, or drag along the rail
 * to scrub through the page.
 */
function ScrollIndex({
  sections: sectionsProp,
  selector = 'h2[id]',
  labels: labelsProp,
  className,
  ...props
}: ScrollIndexProps) {
  const labels = useLabels('scroll-index', defaultScrollIndexLabels, labelsProp)
  const reduced = useReducedMotion()
  const [found, setFound] = React.useState<IndexSection[]>([])
  const sections = sectionsProp ?? found
  const [active, setActive] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)
  const rail = React.useRef<HTMLOListElement>(null)
  const drag = React.useRef<{ pointer: number; moved: boolean; y: number } | null>(null)

  React.useEffect(() => {
    if (sectionsProp) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the headings the page rendered
    setFound(
      Array.from(document.querySelectorAll<HTMLElement>(selector), (el) => ({
        id: el.id,
        label: el.textContent?.trim() ?? el.id,
      })),
    )
  }, [sectionsProp, selector])

  // The section being read: the last heading above the reading line.
  React.useEffect(() => {
    const update = () => {
      const line = window.innerHeight * READ_AT
      let at = 0
      sections.forEach((s, i) => {
        const top = document.getElementById(s.id)?.getBoundingClientRect().top
        if (top !== undefined && top <= line) at = i
      })
      setActive(at)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sections])

  const go = (i: number, smooth: boolean) => {
    document
      .getElementById(sections[i]?.id ?? '')
      ?.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', block: 'start' })
  }
  const indexAt = (clientY: number) => {
    const box = rail.current?.getBoundingClientRect()
    if (!box || !sections.length) return 0
    return Math.max(
      0,
      Math.min(
        sections.length - 1,
        Math.floor(((clientY - box.top) / box.height) * sections.length),
      ),
    )
  }

  if (!sections.length) return null
  return (
    <nav
      data-slot="scroll-index"
      aria-label={labels.index}
      className={cn('select-none', className)}
      {...props}
    >
      <ol
        ref={rail}
        className="flex touch-none flex-col items-end py-1"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          drag.current = { pointer: event.pointerId, moved: false, y: event.clientY }
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (!d || d.pointer !== event.pointerId) {
            if (event.pointerType === 'mouse') setHover(indexAt(event.clientY))
            return
          }
          if (!d.moved && Math.abs(event.clientY - d.y) < 4) return
          if (!d.moved) {
            d.moved = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }
          const i = indexAt(event.clientY)
          setHover(i)
          go(i, false)
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerLeave={() => {
          if (!drag.current) setHover(null)
        }}
      >
        {sections.map((section, i) => {
          const on = i === active
          return (
            <li key={section.id} className="relative flex items-center">
              {hover === i && (
                <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-popover-foreground text-xs shadow-md">
                  {section.label}
                </span>
              )}
              <a
                href={`#${section.id}`}
                aria-current={on ? 'location' : undefined}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={(event) => {
                  event.preventDefault()
                  if (drag.current?.moved) return
                  go(i, true)
                  history.replaceState(null, '', `#${section.id}`)
                }}
                className="flex h-5 w-8 items-center justify-end outline-none focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-7"
              >
                <span className="sr-only">{section.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 rounded-full transition-[width,background-color] duration-(--duration-fast,150ms)',
                    on
                      ? 'w-6 bg-primary'
                      : hover === i
                        ? 'w-4 bg-foreground/70'
                        : 'w-2.5 bg-muted-foreground/40',
                  )}
                />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { ScrollIndex }
