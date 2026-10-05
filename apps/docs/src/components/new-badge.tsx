import { cn } from '@/lib/utils'

/**
 * The mark of a page that shipped recently: a dot in the primary color. Screen readers hear
 * "New". Small enough to sit after any title in the sidebar without pushing it to a new line.
 */
export function NewDot({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      <span className="sr-only">New</span>
    </span>
  )
}

/** The same dot with the word, where there is room for it: the page title and the search. */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 font-medium text-[10px] text-muted-foreground leading-4',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      New
    </span>
  )
}
