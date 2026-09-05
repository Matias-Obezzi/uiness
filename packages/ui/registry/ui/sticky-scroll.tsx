'use client'

import { useActiveSection } from '@uiness/scroll'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StickyScrollItem {
  title: React.ReactNode
  description?: React.ReactNode
  /** What the sticky panel shows while this item is being read. */
  content: React.ReactNode
}

export interface StickyScrollProps extends React.ComponentProps<'div'> {
  items: StickyScrollItem[]
  /** Line across the viewport that decides the active item, 0 top to 1 bottom. Default 0.5. */
  anchor?: number
  onActiveChange?: (index: number) => void
  /** Classes for the sticky panel. */
  panelClassName?: string
  /** Classes for each text section. */
  sectionClassName?: string
}

/**
 * Text sections on one side, a sticky panel on the other that swaps its content as you
 * read. On narrow screens the content sits under each section instead.
 */
function StickyScroll({
  items,
  anchor = 0.5,
  onActiveChange,
  panelClassName,
  sectionClassName,
  className,
  ...props
}: StickyScrollProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const active = useActiveSection(listRef, { anchor })
  const changeRef = React.useRef(onActiveChange)
  changeRef.current = onActiveChange
  React.useEffect(() => {
    changeRef.current?.(active)
  }, [active])

  return (
    <div
      data-slot="sticky-scroll"
      className={cn('grid gap-10 md:grid-cols-2', className)}
      {...props}
    >
      <div ref={listRef} data-slot="sticky-scroll-sections">
        {items.map((item, i) => (
          <section
            // biome-ignore lint/suspicious/noArrayIndexKey: items are positional
            key={i}
            data-slot="sticky-scroll-section"
            data-state={i === active ? 'active' : 'inactive'}
            className={cn(
              'flex min-h-[60vh] flex-col justify-center gap-3 transition-opacity duration-500 data-[state=inactive]:opacity-30',
              sectionClassName,
            )}
          >
            <h3 className="font-semibold text-2xl tracking-tight">{item.title}</h3>
            {item.description && (
              <div className="max-w-prose text-muted-foreground">{item.description}</div>
            )}
            <div className="mt-4 md:hidden">{item.content}</div>
          </section>
        ))}
      </div>
      <div
        data-slot="sticky-scroll-panel"
        className={cn(
          'sticky top-[calc(50vh-10rem)] hidden h-80 overflow-hidden rounded-xl md:block',
          panelClassName,
        )}
      >
        {items.map((item, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: items are positional
            key={i}
            aria-hidden={i !== active}
            data-slot="sticky-scroll-content"
            data-state={i === active ? 'active' : 'inactive'}
            className="absolute inset-0 transition-[opacity,transform] duration-500 ease-out data-[state=inactive]:pointer-events-none data-[state=inactive]:scale-95 data-[state=inactive]:opacity-0 motion-reduce:transition-none"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}

export { StickyScroll }
