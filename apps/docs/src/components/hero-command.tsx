import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { track } from '~/lib/metrics'
import { site } from '~/lib/site'

/** The packages, by the registry item that installs each one. */
const ITEMS = ['island', 'image', 'fx', 'toast', 'sortable', 'choreo', 'three-viewer']
const STEP = 2200

/**
 * The install command as a terminal line whose item rolls up to the next package every couple
 * of seconds. Copying, from the button or a selection, takes the command as it reads then.
 * With reduced motion it stays on the first item.
 */
export function HeroCommand({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  // One past the end is a copy of the first, so the roll always goes up; then it jumps back.
  const [index, setIndex] = useState(0)
  const [snapping, setSnapping] = useState(false)

  useEffect(() => {
    if (reduced) return
    // Past the copy of the first item only if its transition never ended (a hidden tab): on
    // to the second, so it never rolls into nothing.
    const timer = setInterval(() => setIndex((i) => (i >= ITEMS.length ? 1 : i + 1)), STEP)
    return () => clearInterval(timer)
  }, [reduced])

  const item = ITEMS[index % ITEMS.length] ?? 'island'
  // Short enough to sit beside the button whole; npx takes the latest shadcn on its own.
  const prefix = `npx shadcn add ${site.registryNamespace}/`
  const command = `${prefix}${item}`
  const longest = Math.max(...ITEMS.map((name) => name.length))

  return (
    <div
      className={cn(
        'flex h-10 min-w-0 items-center gap-2 rounded-lg border bg-muted/40 pr-1 pl-3 font-mono text-xs sm:text-sm dark:bg-black/40',
        className,
      )}
      onCopy={() => {
        if (document.getSelection()?.toString().trim()) track('install')
      }}
    >
      <span aria-hidden="true" className="select-none text-muted-foreground">
        $
      </span>
      <span className="sr-only">{command}</span>
      <span
        aria-hidden="true"
        className="flex min-w-0 items-center overflow-hidden whitespace-nowrap"
      >
        <span className="truncate">{prefix}</span>
        <span
          className="relative inline-block h-[1lh] shrink-0 overflow-hidden text-foreground"
          style={{ width: `${longest}ch` }}
        >
          <span
            className={cn(
              'flex flex-col',
              !snapping &&
                'transition-transform duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1))',
            )}
            // One line per item: a percentage would be of the whole column, every item at once.
            style={{ transform: `translateY(calc(${-index} * 1lh))` }}
            onTransitionEnd={() => {
              if (index < ITEMS.length) return
              // At the copy of the first item: back to the real one, without a transition.
              setSnapping(true)
              setIndex(0)
              requestAnimationFrame(() => requestAnimationFrame(() => setSnapping(false)))
            }}
          >
            {[...ITEMS, ITEMS[0]].map((name, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the first item appears twice
              <span key={i} className="h-[1lh]">
                {name}
              </span>
            ))}
          </span>
        </span>
      </span>
      <CopyButton
        value={() => command}
        label="Copy command"
        onCopy={() => track('install')}
        className="ml-auto size-8 shrink-0 text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
      />
    </div>
  )
}
