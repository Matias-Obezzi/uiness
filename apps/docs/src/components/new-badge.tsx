import { cn } from '@/lib/utils'

/** The "New" tag next to a page that shipped recently. */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-primary px-1.5 py-px font-medium text-[10px] text-primary-foreground uppercase leading-4 tracking-wide',
        className,
      )}
    >
      New
    </span>
  )
}
