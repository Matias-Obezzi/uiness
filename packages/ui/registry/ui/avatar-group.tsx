'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export interface AvatarGroupItem {
  /** Full name, shown in the tooltip and the overflow list and read by screen readers. */
  name: string
  /** Picture URL. Initials stand in while it loads or when it fails. */
  src?: string
  /** Letters for the fallback. Defaults to the initials of `name`. */
  initials?: string
  /** A second line in the overflow list, like a role or an email. */
  description?: string
}

export interface AvatarGroupProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The people, in order of importance. */
  items: AvatarGroupItem[]
  /** Avatars shown before the "+N" counter. Default 4. */
  max?: number
  /** The full count when `items` holds only some of them, like the first page of members. */
  total?: number
  /** `sm` 24px, `md` 32px or `lg` 40px. Default `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** Name tooltips on hover. Default true. */
  tooltips?: boolean
  /** Heading of the overflow list. Default "More people". */
  overflowLabel?: string
}

const sizes = {
  sm: { avatar: 'size-6 text-[10px]', overlap: '-ms-1.5', counter: 'h-6 min-w-6 text-[10px]' },
  md: { avatar: 'size-8 text-xs', overlap: '-ms-2', counter: 'h-8 min-w-8 text-xs' },
  lg: { avatar: 'size-10 text-sm', overlap: '-ms-2.5', counter: 'h-10 min-w-10 text-sm' },
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

function Person({ item, className }: { item: AvatarGroupItem; className?: string }) {
  return (
    <Avatar className={className}>
      {item.src && <AvatarImage src={item.src} alt="" />}
      <AvatarFallback className="text-[length:inherit]">
        {item.initials ?? initialsOf(item.name)}
      </AvatarFallback>
    </Avatar>
  )
}

function Stacked({
  item,
  tooltip,
  className,
  avatarClassName,
}: {
  item: AvatarGroupItem
  tooltip: boolean
  className?: string
  avatarClassName?: string
}) {
  const avatar = (
    <span
      className={cn(
        'relative inline-flex rounded-full transition-transform duration-(--duration-fast,150ms) hover:z-(--z-raised,10) hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <Person item={item} className={avatarClassName} />
    </span>
  )
  if (!tooltip) return avatar
  return (
    <Tooltip>
      <TooltipTrigger asChild>{avatar}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{item.name}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Overlapping avatars for a team, the people on a document or the guests of an event. Past
 * `max`, a "+N" counter opens a list of everyone else. Each avatar wears a ring in the page
 * color, set by `--avatar-group-ring`, so the overlap reads on cards too.
 */
function AvatarGroup({
  items,
  max = 4,
  total,
  size = 'md',
  tooltips = true,
  overflowLabel = 'More people',
  className,
  ...props
}: AvatarGroupProps) {
  const count = Math.max(total ?? items.length, items.length)
  // A "+1" counter takes the room of an avatar, so show the avatar instead.
  const shown = count - max === 1 && items.length === count ? items : items.slice(0, max)
  const rest = items.slice(shown.length)
  const hiddenCount = count - shown.length
  const s = sizes[size]
  const ring = 'ring-2 ring-[color:var(--avatar-group-ring,var(--background))]'

  const names = shown.map((item) => item.name)
  const groupLabel =
    hiddenCount > 0
      ? `${names.join(', ')} and ${hiddenCount} more`
      : names.length > 1
        ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
        : (names[0] ?? 'Nobody')

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
    <div
      role="group"
      aria-label={groupLabel}
      data-slot="avatar-group"
      className={cn('flex items-center', className)}
      {...props}
    >
      {shown.map((item, i) => (
        <Stacked
          // biome-ignore lint/suspicious/noArrayIndexKey: names may repeat, and the order is the data's
          key={i}
          item={item}
          tooltip={tooltips}
          className={cn(i > 0 && s.overlap)}
          avatarClassName={cn(s.avatar, ring)}
        />
      ))}
      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger
            data-slot="avatar-group-counter"
            aria-label={`Show ${hiddenCount} more`}
            className={cn(
              'relative inline-flex items-center justify-center rounded-full bg-muted px-1.5 font-medium text-muted-foreground tabular-nums outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground',
              s.counter,
              s.overlap,
              ring,
            )}
          >
            +{hiddenCount}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <div className="border-b px-3 py-2 font-medium text-muted-foreground text-xs">
              {overflowLabel}
            </div>
            <ul className="max-h-64 overflow-y-auto p-1">
              {rest.map((item, i) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: names may repeat, and the order is the data's
                  key={i}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
                >
                  <Person item={item} className="size-7 text-[11px]" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{item.name}</div>
                    {item.description && (
                      <div className="truncate text-muted-foreground text-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {count > items.length && (
                <li className="px-2 py-1.5 text-muted-foreground text-xs">
                  and {count - items.length} more
                </li>
              )}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export { AvatarGroup }
