'use client'

import { ArrowUpRightIcon, ChevronDownIcon, RssIcon } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface ChangelogEntry {
  /** Shown on the badge, like `2.4.0`. Also the entry's key, so keep it unique. */
  version: string
  /** The release day, ISO, like `2026-09-28`. Entries are grouped by its month. */
  date: string
  title: string
  /** The line that is always visible. */
  summary: React.ReactNode
  /** Labels the feed can be filtered by, like `Feature` or `Fix`. */
  tags?: string[]
  /** What shows when the entry is opened. Without it the entry does not open. */
  details?: React.ReactNode
  /** A link to the full notes. `undefined` hides it. */
  href?: string
}

export interface ChangelogLabels {
  /** The chip that shows every entry. */
  all: string
  /** Accessible name of the row of chips. */
  filter: string
  expand: string
  collapse: string
  /** Shown when the chosen tag has no entries. */
  empty: string
  /** The link at the end of an opened entry. */
  readMore: string
}

export interface Changelog01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  /** The lead under the heading. `null` hides it. */
  description?: React.ReactNode | null
  /** Newest first. The feed keeps the order given. */
  entries?: ChangelogEntry[]
  /** The tags offered as chips. Defaults to every tag in `entries`, in the order met. */
  tags?: string[]
  /** Version of the entry that starts open. `null` starts with all closed. Default the first. */
  defaultOpen?: string | null
  /** Where "Subscribe" goes, an RSS feed or a signup. `null` hides it. */
  subscribe?: { label: string; href: string } | null
  /** Locale for the month headings and dates. Defaults to the browser's. */
  locale?: string
  labels?: Partial<ChangelogLabels>
}

const defaultEntries: ChangelogEntry[] = [
  {
    version: '2.4.0',
    date: '2026-09-28',
    title: 'Saved views for every board',
    summary: 'Keep a filter, a sort and a grouping under a name, and share it with a link.',
    tags: ['Feature'],
    details: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Save any combination of filters, sort order and grouping as a view.</li>
        <li>Views are private until you share them; shared views update for everyone.</li>
        <li>Pin up to five views to the sidebar for one click access.</li>
      </ul>
    ),
    href: '#',
  },
  {
    version: '2.3.2',
    date: '2026-09-17',
    title: 'Faster search across large workspaces',
    summary: 'Results now arrive in under 80 ms for workspaces with a million items.',
    tags: ['Improvement'],
    details: (
      <p>
        We moved search to a new index that updates as you type. Large workspaces see results about
        four times sooner, and typos are forgiven up to two letters.
      </p>
    ),
  },
  {
    version: '2.3.1',
    date: '2026-09-04',
    title: 'Fixes for date pickers and exports',
    summary: 'Ranges across a daylight saving change no longer lose an hour.',
    tags: ['Fix'],
    details: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Date ranges that cross a daylight saving change keep their length.</li>
        <li>CSV exports quote fields that contain line breaks.</li>
        <li>The calendar opens on the selected month instead of today.</li>
      </ul>
    ),
  },
  {
    version: '2.3.0',
    date: '2026-08-21',
    title: 'Automations, now with conditions',
    summary: 'Run a rule only when a field matches, and chain rules one after another.',
    tags: ['Feature', 'Improvement'],
    details: (
      <p>
        Every automation can now check a condition before it runs, and the result of one rule can
        start the next. The editor shows a preview of what would have run over the last week.
      </p>
    ),
    href: '#',
  },
  {
    version: '2.2.4',
    date: '2026-08-06',
    title: 'Keyboard shortcuts you can change',
    summary: 'Remap any shortcut from settings, or turn single key shortcuts off.',
    tags: ['Improvement'],
    details: (
      <p>
        Open Settings, then Shortcuts. Conflicts are flagged as you type, and your mapping follows
        you to every device you sign in on.
      </p>
    ),
  },
  {
    version: '2.2.3',
    date: '2026-07-24',
    title: 'Notification fixes',
    summary: 'Mentions in edited comments now notify the people added in the edit.',
    tags: ['Fix'],
  },
]

const defaultLabels: ChangelogLabels = {
  all: 'All',
  filter: 'Filter by tag',
  expand: 'Show details',
  collapse: 'Hide details',
  empty: 'Nothing under this tag yet.',
  readMore: 'Full release notes',
}

/** Tag dots cycle through the chart colours, so a theme recolours them too. */
const tagTones = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

/** `2026-09-28` read as a calendar day, not as midnight UTC, so it never slips a day. */
const toDay = (iso: string) => {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * A release feed: chips filter it by tag, entries sit under their month, and each one opens
 * in place to show its details. Opening one closes the last, so the feed reads like an
 * accordion. On a wide container the month rides beside its entries; narrow, it sits above.
 */
function Changelog01({
  eyebrow = 'Changelog',
  title = 'What’s new',
  description = 'New features, improvements and fixes, every couple of weeks.',
  entries = defaultEntries,
  tags: tagsProp,
  defaultOpen,
  subscribe = { label: 'Subscribe', href: '#' },
  locale,
  labels: labelsProp,
  className,
  ...props
}: Changelog01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const [tag, setTag] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState<string | null>(
    defaultOpen === undefined ? (entries[0]?.version ?? null) : defaultOpen,
  )

  const tags = React.useMemo(
    () => tagsProp ?? [...new Set(entries.flatMap((entry) => entry.tags ?? []))],
    [tagsProp, entries],
  )
  const toneOf = (name: string) => tagTones[Math.max(0, tags.indexOf(name)) % tagTones.length]

  const months = React.useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    const groups: { key: string; label: string; entries: ChangelogEntry[] }[] = []
    for (const entry of entries) {
      if (tag && !entry.tags?.includes(tag)) continue
      const key = entry.date.slice(0, 7)
      let group = groups.find((g) => g.key === key)
      if (!group) {
        group = { key, label: monthFormat.format(toDay(entry.date)), entries: [] }
        groups.push(group)
      }
      group.entries.push(entry)
    }
    return groups
  }, [entries, tag, locale])

  const dayFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
    [locale],
  )
  const counts = (name: string | null) =>
    name ? entries.filter((entry) => entry.tags?.includes(name)).length : entries.length

  return (
    <section
      data-slot="block-changelog-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-5xl px-6 py-16 @3xl:py-24">
        <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-end @2xl:justify-between">
          <div className="max-w-2xl">
            {eyebrow != null && (
              <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
            )}
            <h2 id={headingId} className="text-balance text-title">
              {title}
            </h2>
            {description != null && (
              <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
            )}
          </div>
          {subscribe && (
            <a
              href={subscribe.href}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border bg-background px-4 py-2 font-medium text-sm shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <RssIcon aria-hidden className="size-4 text-orange-500" />
              {subscribe.label}
            </a>
          )}
        </div>

        {tags.length > 0 && (
          // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring a border and a legend to undo
          <div role="group" aria-label={labels.filter} className="mt-10 flex flex-wrap gap-2">
            {[null, ...tags].map((name) => {
              const pressed = tag === name
              return (
                <button
                  key={name ?? '*'}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setTag(name)}
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-full border px-3 font-medium text-sm outline-none transition-colors duration-(--duration-fast,150ms) focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    pressed
                      ? 'border-foreground bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {name && <span aria-hidden className={cn('size-2 rounded-full', toneOf(name))} />}
                  {name ?? labels.all}
                  <span className={cn('tabular-nums', pressed ? 'opacity-70' : 'opacity-60')}>
                    {counts(name)}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div aria-live="polite" className="mt-10">
          {months.length === 0 ? (
            <p className="rounded-2xl border border-dashed px-6 py-12 text-center text-muted-foreground">
              {labels.empty}
            </p>
          ) : (
            months.map((month) => (
              <div
                key={`${tag}:${month.key}`}
                className="grid gap-4 border-t py-8 duration-(--duration-slow,300ms) animate-in fade-in-0 slide-in-from-bottom-2 first:border-t-0 first:pt-0 motion-reduce:animate-none @3xl:grid-cols-[11rem_minmax(0,1fr)] @3xl:gap-10"
              >
                <h3 className="font-medium text-muted-foreground text-sm @3xl:sticky @3xl:top-24 @3xl:self-start @3xl:pt-1">
                  {month.label}
                </h3>
                <ol className="flex flex-col gap-3">
                  {month.entries.map((entry) => (
                    <li key={entry.version}>
                      <Entry
                        entry={entry}
                        open={open === entry.version}
                        onOpenChange={(next) => setOpen(next ? entry.version : null)}
                        day={dayFormat.format(toDay(entry.date))}
                        toneOf={toneOf}
                        labels={labels}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function Entry({
  entry,
  open,
  onOpenChange,
  day,
  toneOf,
  labels,
}: {
  entry: ChangelogEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  day: string
  toneOf: (tag: string) => string | undefined
  labels: ChangelogLabels
}) {
  const expandable = entry.details != null || entry.href != null
  return (
    <Collapsible
      open={expandable && open}
      onOpenChange={onOpenChange}
      disabled={!expandable}
      data-slot="changelog-entry"
      className={cn(
        'group/entry rounded-2xl border bg-card p-5 transition-[box-shadow,border-color] duration-(--duration-normal,200ms) @md:p-6',
        'data-[state=open]:border-foreground/20 data-[state=open]:shadow-md',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant="outline" className="font-mono">
          v{entry.version}
        </Badge>
        <time dateTime={entry.date} className="text-caption text-muted-foreground">
          {day}
        </time>
        {entry.tags?.map((name) => (
          <span key={name} className="inline-flex items-center gap-1.5 text-caption">
            <span aria-hidden className={cn('size-1.5 rounded-full', toneOf(name))} />
            {name}
          </span>
        ))}
      </div>
      <h4 className="mt-3 text-subheading">{entry.title}</h4>
      <div className="mt-1.5 text-pretty text-muted-foreground">{entry.summary}</div>
      {expandable && (
        <>
          <CollapsibleContent>
            <div className="pt-4 text-pretty text-muted-foreground text-sm leading-relaxed">
              {entry.details}
              {entry.href && (
                <a
                  href={entry.href}
                  className="mt-4 inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {labels.readMore}
                  <ArrowUpRightIcon aria-hidden className="size-3.5" />
                </a>
              )}
            </div>
          </CollapsibleContent>
          <CollapsibleTrigger className="mt-4 inline-flex items-center gap-1.5 rounded-md font-medium text-sm outline-none transition-colors hover:text-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {open ? labels.collapse : labels.expand}
            <ChevronDownIcon
              aria-hidden
              className="size-4 transition-transform duration-(--duration-normal,200ms) group-data-[state=open]/entry:rotate-180 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
        </>
      )}
    </Collapsible>
  )
}

export { Changelog01 }
