import {
  scrollToElement,
  useActiveSection,
  useHorizontalWheel,
  useScrollEdges,
} from '@uiness/scroll'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const cards = ['Plan', 'Write', 'Review', 'Ship', 'Measure', 'Learn', 'Repeat']

export default function ScrollHorizontal() {
  const row = useRef<HTMLDivElement>(null)
  // The card under the middle of the row, read left to right; the row is its own scroller.
  const active = useActiveSection(row, { axis: 'x' })
  const { atStart, atEnd } = useScrollEdges(row)
  useHorizontalWheel(row)

  const go = (index: number) => {
    const card = row.current?.children[index]
    if (card) scrollToElement(card, { container: row.current, axis: 'x', offset: 16 })
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        ref={row}
        className="flex gap-4 overflow-x-auto scroll-px-4 px-4 py-2 [scrollbar-width:none]"
      >
        {cards.map((title, i) => (
          <div
            key={title}
            className={cn(
              'flex h-36 w-56 shrink-0 items-end rounded-xl border bg-card p-4 font-medium transition-colors',
              i === active && 'border-primary',
            )}
          >
            {i + 1}. {title}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          {cards.map((title, i) => (
            <span
              key={title}
              className={cn(
                'size-1.5 rounded-full bg-muted-foreground/30 transition-colors',
                i === active && 'bg-primary',
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous"
            disabled={atStart}
            onClick={() => go(Math.max(0, active - 1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next"
            disabled={atEnd}
            onClick={() => go(Math.min(cards.length - 1, active + 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
