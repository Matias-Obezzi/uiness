'use client'

import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import type * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

/**
 * A card that previews what a link points at, on hover or keyboard focus. Same API as the
 * shadcn/ui hover card, with delays tuned so passing the pointer over a link does not open it.
 */
function HoverCard({
  openDelay = 500,
  closeDelay = 200,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger(props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

export interface HoverCardContentProps
  extends React.ComponentProps<typeof HoverCardPrimitive.Content> {
  /** Draw a small arrow pointing at the trigger. */
  arrow?: boolean
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 6,
  arrow = false,
  children,
  ...props
}: HoverCardContentProps) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-(--z-popover,60) w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-hidden',
          'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'data-[state=closed]:duration-(--duration-fast,150ms) data-[state=open]:duration-(--duration-slow,300ms) data-[state=open]:ease-(--easing-spring,linear(0,0.4_20%,1.1_50%,0.96_70%,1))',
          className,
        )}
        {...props}
      >
        {children}
        {arrow && (
          <HoverCardPrimitive.Arrow
            width={12}
            height={6}
            className="fill-popover drop-shadow-[0_1px_0_var(--color-border)]"
          />
        )}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}

export interface ProfileHoverCardStat {
  label: string
  value: React.ReactNode
}

export interface ProfileHoverCardProps
  extends Omit<React.ComponentProps<typeof HoverCardPrimitive.Root>, 'children'> {
  /** The person's or the place's name. */
  name: string
  /** A handle or address under the name, like "@ana" or "acme.com". */
  handle?: string
  /** Picture URL. Initials of `name` show while it loads or when it is missing. */
  avatar?: string
  /** A sentence or two about them. */
  description?: React.ReactNode
  /** Small figures along the bottom, like followers. */
  stats?: ProfileHoverCardStat[]
  /** Extra lines between the description and the stats, such as a location or a join date. */
  meta?: React.ReactNode
  /** A button in the corner, like Follow. */
  action?: React.ReactNode
  /** The element that opens the card, usually a link. Passed through `asChild`. */
  children: React.ReactElement
  /** Where the card opens. Default `bottom`. */
  side?: React.ComponentProps<typeof HoverCardPrimitive.Content>['side']
  /** Alignment against the trigger. Default `start`. */
  align?: React.ComponentProps<typeof HoverCardPrimitive.Content>['align']
  /** Classes for the card. */
  className?: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

/** A ready-made preview of a person or a site: picture, name, handle, a line and a few figures. */
function ProfileHoverCard({
  name,
  handle,
  avatar,
  description,
  stats,
  meta,
  action,
  children,
  side = 'bottom',
  align = 'start',
  className,
  ...props
}: ProfileHoverCardProps) {
  return (
    <HoverCard {...props}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        data-slot="profile-hover-card"
        className={cn('w-80', className)}
      >
        <div className="flex items-start justify-between gap-3">
          <Avatar className="size-12">
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          {action}
        </div>
        <div className="mt-3 space-y-1">
          <p className="font-semibold leading-tight">{name}</p>
          {handle && <p className="text-muted-foreground text-sm">{handle}</p>}
        </div>
        {description && <p className="mt-3 text-pretty text-sm">{description}</p>}
        {meta && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs [&_svg]:size-3.5">
            {meta}
          </div>
        )}
        {stats && stats.length > 0 && (
          <dl className="mt-3 flex gap-4 text-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-row-reverse items-baseline gap-1">
                <dt className="text-muted-foreground">{stat.label}</dt>
                <dd className="font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger, ProfileHoverCard }
