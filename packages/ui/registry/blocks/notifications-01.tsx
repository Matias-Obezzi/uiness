'use client'

import {
  AtSignIcon,
  BellIcon,
  CheckCheckIcon,
  ChevronDownIcon,
  GitMergeIcon,
  type LucideIcon,
  MessageSquareIcon,
  RocketIcon,
  ShieldAlertIcon,
  UserPlusIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/collapsible'
import { Odometer } from '@/ui/odometer'

export type NotificationKind = 'mention' | 'comment' | 'merge' | 'deploy' | 'security' | 'invite'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  /** Who did it. Without one the kind's icon stands in. */
  actor?: string
  /** The headline, like "commented on Saved views". */
  title: string
  /** When it happened, ISO. Groups the list by day and shows as relative time. */
  time: string
  read?: boolean
  /** What shows when the notification is opened. */
  details?: React.ReactNode
  /** A link in the opened notification. */
  action?: { label: string; href: string }
}

export interface NotificationFilter {
  id: string
  label: string
  /** Which notifications it keeps. */
  match: (item: NotificationItem, read: boolean) => boolean
}

export interface NotificationsLabels {
  markAllRead: string
  markRead: string
  markUnread: string
  /** `{count}` is replaced. */
  unread: string
  today: string
  yesterday: string
  earlier: string
  empty: string
  filters: string
}

export interface Notifications01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** Newest first. */
  notifications?: NotificationItem[]
  filters?: NotificationFilter[]
  /** Called with ids whenever notifications are marked read or unread. */
  onReadChange?: (ids: string[], read: boolean) => void
  /** The moment "today" is measured from. Defaults to now. */
  now?: Date
  locale?: string
  labels?: Partial<NotificationsLabels>
}

const kinds: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  mention: { icon: AtSignIcon, tone: 'bg-chart-1/15 text-chart-1' },
  comment: { icon: MessageSquareIcon, tone: 'bg-chart-2/15 text-chart-2' },
  merge: { icon: GitMergeIcon, tone: 'bg-chart-4/15 text-chart-4' },
  deploy: { icon: RocketIcon, tone: 'bg-chart-3/15 text-chart-3' },
  security: { icon: ShieldAlertIcon, tone: 'bg-destructive/15 text-destructive' },
  invite: { icon: UserPlusIcon, tone: 'bg-chart-5/15 text-chart-5' },
}

const DAY = 24 * 60 * 60 * 1000

/** The default feed is written relative to the moment it is shown, so it never looks stale. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString()

const makeDefaults = (): NotificationItem[] => [
  {
    id: 'n1',
    kind: 'mention',
    actor: 'Camille Laurent',
    title: 'mentioned you in Q4 planning',
    time: ago(4),
    details:
      '“@you can we get the saved views work into the first sprint? Kettlebrook asked about it again this morning.”',
    action: { label: 'Reply', href: '#' },
  },
  {
    id: 'n2',
    kind: 'deploy',
    title: 'atlas v2.4.0 deployed to production',
    time: ago(38),
    details:
      'Build 1842 passed 312 checks in 4 minutes 12 seconds. No errors in the first half hour.',
    action: { label: 'View deployment', href: '#' },
  },
  {
    id: 'n3',
    kind: 'merge',
    actor: 'Wei Zhang',
    title: 'merged Faster search for large workspaces',
    time: ago(95),
    read: true,
    details: '24 files changed, 1,204 additions and 388 deletions. Closes three issues.',
  },
  {
    id: 'n4',
    kind: 'security',
    title: 'New sign in from Lisbon, Portugal',
    time: ago(60 * 26),
    details:
      'Chrome on macOS, 2 hours after your last sign in. If this was not you, reset your password and sign out other sessions.',
    action: { label: 'Review sessions', href: '#' },
  },
  {
    id: 'n5',
    kind: 'comment',
    actor: 'Oskar Lind',
    title: 'commented on Keyboard shortcuts spec',
    time: ago(60 * 29),
    read: true,
    details: '“Looks good. One question: do single key shortcuts stay on for screen reader users?”',
  },
  {
    id: 'n6',
    kind: 'invite',
    actor: 'Amara Nwosu',
    title: 'invited you to the Infrastructure team',
    time: ago(60 * 24 * 4),
    action: { label: 'Accept invite', href: '#' },
  },
]

const defaultFilters: NotificationFilter[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'unread', label: 'Unread', match: (_, read) => !read },
  {
    id: 'mentions',
    label: 'Mentions',
    match: (item) => item.kind === 'mention' || item.kind === 'comment',
  },
]

const defaultLabels: NotificationsLabels = {
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  unread: '{count} unread',
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
  empty: 'You are all caught up.',
  filters: 'Show',
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/**
 * A notifications page section: filters along the top, the list grouped by day, unread ones
 * marked with a dot, and a button to mark them all read. Opening a notification reveals its
 * details in place and marks it read; each can be put back to unread.
 */
function Notifications01({
  title = 'Notifications',
  description = 'Mentions, reviews, deploys and anything that needs your attention.',
  notifications: notificationsProp,
  filters = defaultFilters,
  onReadChange,
  now: nowProp,
  locale,
  labels: labelsProp,
  className,
  ...props
}: Notifications01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const [defaults] = React.useState(makeDefaults)
  const notifications = notificationsProp ?? defaults
  const [read, setRead] = React.useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.read).map((n) => n.id)),
  )
  const [filter, setFilter] = React.useState(filters[0]?.id ?? 'all')
  const [open, setOpen] = React.useState<string | null>(null)
  const now = nowProp ?? new Date()

  const isRead = (id: string) => read.has(id)
  const mark = (ids: string[], value: boolean) => {
    const changed = ids.filter((id) => read.has(id) !== value)
    if (changed.length === 0) return
    setRead((prev) => {
      const next = new Set(prev)
      for (const id of changed) value ? next.add(id) : next.delete(id)
      return next
    })
    onReadChange?.(changed, value)
  }

  const unread = notifications.filter((n) => !read.has(n.id)).length
  const active = filters.find((f) => f.id === filter) ?? filters[0]
  const visible = notifications.filter((n) => !active || active.match(n, read.has(n.id)))

  const relative = React.useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale],
  )
  const when = (iso: string) => {
    const diff = (new Date(iso).getTime() - now.getTime()) / 1000
    const abs = Math.abs(diff)
    if (abs < 60) return relative.format(0, 'second')
    if (abs < 3600) return relative.format(Math.round(diff / 60), 'minute')
    if (abs < 86400) return relative.format(Math.round(diff / 3600), 'hour')
    return relative.format(Math.round(diff / 86400), 'day')
  }

  const today = startOfDay(now).getTime()
  const groups = [
    { id: 'today', label: labels.today, items: [] as NotificationItem[] },
    { id: 'yesterday', label: labels.yesterday, items: [] as NotificationItem[] },
    { id: 'earlier', label: labels.earlier, items: [] as NotificationItem[] },
  ]
  for (const item of visible) {
    const day = startOfDay(new Date(item.time)).getTime()
    const group = day >= today ? groups[0] : day >= today - DAY ? groups[1] : groups[2]
    group?.items.push(item)
  }

  return (
    <section
      data-slot="block-notifications-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-3xl px-4 py-12 @md:px-6 @3xl:py-16">
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-end @xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 id={headingId} className="text-heading">
                {title}
              </h2>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs transition-colors',
                  unread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Odometer value={unread} duration={500} />
                <span className="sr-only"> unread</span>
              </span>
            </div>
            {description != null && (
              <p className="mt-1.5 text-muted-foreground text-sm">{description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={unread === 0}
            onClick={() =>
              mark(
                notifications.map((n) => n.id),
                true,
              )
            }
            className="w-fit"
          >
            <CheckCheckIcon aria-hidden />
            {labels.markAllRead}
          </Button>
        </div>

        {filters.length > 1 && (
          // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring a border and a legend to undo
          <div
            role="group"
            aria-label={labels.filters}
            className="mt-6 inline-flex rounded-lg bg-muted p-1"
          >
            {filters.map((f) => {
              const pressed = f.id === filter
              const count = notifications.filter((n) => f.match(n, read.has(n.id))).length
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-medium text-sm outline-none transition-[color,background-color,box-shadow] duration-(--duration-fast,150ms) focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    pressed
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                  <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-8" aria-live="polite">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground duration-(--duration-slow,300ms) animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BellIcon aria-hidden className="size-5" />
              </span>
              {labels.empty}
            </div>
          ) : (
            groups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.id}>
                  <h3 className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {group.label}
                  </h3>
                  <ul className="overflow-hidden rounded-2xl border bg-card">
                    {group.items.map((item) => (
                      <li key={item.id} className="border-b last:border-b-0">
                        <Row
                          item={item}
                          read={isRead(item.id)}
                          open={open === item.id}
                          onOpenChange={(next) => {
                            setOpen(next ? item.id : null)
                            if (next) mark([item.id], true)
                          }}
                          onToggleRead={() => mark([item.id], !isRead(item.id))}
                          when={when(item.time)}
                          labels={labels}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </div>
      </div>
    </section>
  )
}

function Row({
  item,
  read,
  open,
  onOpenChange,
  onToggleRead,
  when,
  labels,
}: {
  item: NotificationItem
  read: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleRead: () => void
  when: string
  labels: NotificationsLabels
}) {
  const { icon: Icon, tone } = kinds[item.kind]
  const expandable = item.details != null || item.action != null
  return (
    <Collapsible
      open={expandable && open}
      onOpenChange={onOpenChange}
      disabled={!expandable}
      data-read={read ? '' : undefined}
      className={cn(
        'group/row relative transition-colors duration-(--duration-normal,200ms)',
        !read && 'bg-primary/[0.03]',
        'data-[state=open]:bg-muted/40',
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="relative mt-0.5 shrink-0">
          {item.actor ? (
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">{initials(item.actor)}</AvatarFallback>
            </Avatar>
          ) : (
            <span className={cn('flex size-9 items-center justify-center rounded-full', tone)}>
              <Icon aria-hidden className="size-4" />
            </span>
          )}
          {item.actor && (
            <span className="absolute -right-1 -bottom-1 flex size-4.5 rounded-full bg-card ring-2 ring-card">
              <span className={cn('flex size-full items-center justify-center rounded-full', tone)}>
                <Icon aria-hidden className="size-2.5" />
              </span>
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <CollapsibleTrigger
            disabled={!expandable}
            className="w-full rounded-sm text-left text-sm outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50 focus-visible:after:ring-inset enabled:cursor-pointer"
          >
            {item.actor && (
              <>
                <span className="font-semibold">{item.actor}</span>{' '}
              </>
            )}
            <span className={cn(read ? 'text-muted-foreground' : 'text-foreground')}>
              {item.title}
            </span>
          </CollapsibleTrigger>
          <p className="mt-0.5 text-caption text-muted-foreground">
            <time dateTime={item.time}>{when}</time>
          </p>
          {expandable && (
            <CollapsibleContent>
              <div className="pt-3">
                {item.details != null && (
                  <div className="rounded-xl border bg-background p-3 text-pretty text-muted-foreground text-sm">
                    {item.details}
                  </div>
                )}
                {item.action && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="relative z-(--z-raised,10) mt-3"
                  >
                    <a href={item.action.href}>{item.action.label}</a>
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          )}
        </div>

        <div className="relative z-(--z-raised,10) flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleRead}
            aria-label={read ? labels.markUnread : labels.markRead}
            title={read ? labels.markUnread : labels.markRead}
            className="flex size-7 items-center justify-center rounded-full outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span
              aria-hidden
              className={cn(
                'size-2.5 rounded-full transition-[background-color,scale] duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out)',
                read ? 'scale-75 bg-transparent ring-1 ring-muted-foreground/40' : 'bg-primary',
              )}
            />
          </button>
          {expandable && (
            <ChevronDownIcon
              aria-hidden
              className="size-4 text-muted-foreground transition-transform duration-(--duration-normal,200ms) group-data-[state=open]/row:rotate-180 motion-reduce:transition-none"
            />
          )}
        </div>
      </div>
    </Collapsible>
  )
}

export { Notifications01 }
