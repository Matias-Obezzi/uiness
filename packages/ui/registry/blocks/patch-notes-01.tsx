'use client'

import { ArrowDownIcon, ArrowUpIcon, SparklesIcon, WrenchIcon } from 'lucide-react'
import * as React from 'react'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

export type PatchKind = 'buff' | 'nerf' | 'fix' | 'new'

/** A line of a change: plain text, or a value going from one number to another. */
export type PatchChange = string | { label: string; from: string; to: string }

export interface PatchEntry {
  /** What changed: a character, a weapon, a map. */
  target: string
  kind: PatchKind
  changes: PatchChange[]
}

export interface PatchSection {
  id: string
  title: string
  entries: PatchEntry[]
}

export interface PatchNotes01Labels {
  filter: string
  all: string
  buff: string
  nerf: string
  fix: string
  new: string
  empty: string
}

export interface PatchNotes01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  version?: string
  title?: React.ReactNode
  /** When it shipped, as already written text. */
  date?: string
  summary?: React.ReactNode
  sections?: PatchSection[]
  labels?: Partial<PatchNotes01Labels>
}

const defaultLabels: PatchNotes01Labels = {
  filter: 'Show',
  all: 'All',
  buff: 'Buff',
  nerf: 'Nerf',
  fix: 'Fix',
  new: 'New',
  empty: 'Nothing of that kind in this patch.',
}

const defaultSections: PatchSection[] = [
  {
    id: 'agents',
    title: 'Agents',
    entries: [
      {
        target: 'Vex',
        kind: 'buff',
        changes: [
          { label: 'Pulse Rifle damage', from: '24', to: '28' },
          'Overdrive now refunds 20% of its charge when cancelled.',
        ],
      },
      {
        target: 'Kairo',
        kind: 'nerf',
        changes: [
          { label: 'Phase Step cooldown', from: '8s', to: '11s' },
          { label: 'Blink range', from: '12m', to: '10m' },
        ],
      },
      {
        target: 'Lumen',
        kind: 'new',
        changes: ['A new support agent who bends light to reveal and blind.'],
      },
    ],
  },
  {
    id: 'maps',
    title: 'Maps',
    entries: [
      {
        target: 'Neon Docks',
        kind: 'fix',
        changes: [
          'Players can no longer stand on the crane in B site.',
          'Fixed a gap in the wall by the north spawn.',
        ],
      },
      { target: 'Skyline', kind: 'new', changes: ['Back in the ranked rotation.'] },
    ],
  },
  {
    id: 'system',
    title: 'System',
    entries: [
      {
        target: 'Matchmaking',
        kind: 'fix',
        changes: ['Parties of five no longer wait longer than solo players.'],
      },
      {
        target: 'Ranked',
        kind: 'buff',
        changes: [{ label: 'Points for a win streak', from: '+15', to: '+20' }],
      },
    ],
  },
]

const kinds: PatchKind[] = ['buff', 'nerf', 'fix', 'new']

const kindStyle: Record<PatchKind, { tag: string; Icon: typeof ArrowUpIcon }> = {
  buff: { tag: 'bg-chart-2/15 text-chart-2', Icon: ArrowUpIcon },
  nerf: { tag: 'bg-destructive/15 text-destructive', Icon: ArrowDownIcon },
  fix: { tag: 'bg-muted text-muted-foreground', Icon: WrenchIcon },
  new: { tag: 'bg-primary/15 text-primary', Icon: SparklesIcon },
}

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(6px_0,100%_0,100%_calc(100%_-_6px),calc(100%_-_6px)_100%,0_100%,0_6px)]'

function Change({ change }: { change: PatchChange }) {
  if (typeof change === 'string') return <>{change}</>
  return (
    <>
      {change.label}{' '}
      <span className="whitespace-nowrap font-mono tabular-nums">
        <del className="text-muted-foreground">{change.from}</del>
        <span aria-hidden="true"> → </span>
        <ins className="font-semibold no-underline">{change.to}</ins>
      </span>
    </>
  )
}

/**
 * A game's patch notes: the version, then every change by section, each tagged as a buff,
 * a nerf, a fix or something new, and numbers shown going from the old value to the new one.
 * A filter keeps one kind.
 */
function PatchNotes01({
  version = 'v4.2.0',
  title = 'Overclock',
  date = 'October 8, 2026',
  summary = 'Vex hits harder, Kairo blinks less often, Lumen joins the roster and Skyline is back in ranked.',
  sections = defaultSections,
  labels: labelsProp,
  className,
  ...props
}: PatchNotes01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const [filter, setFilter] = React.useState<'all' | PatchKind>('all')

  const all = sections.flatMap((s) => s.entries)
  const count = (kind: PatchKind) => all.filter((e) => e.kind === kind).length
  const shown = sections
    .map((s) => ({ ...s, entries: s.entries.filter((e) => filter === 'all' || e.kind === filter) }))
    .filter((s) => s.entries.length > 0)

  return (
    <section
      data-slot="block-patch-notes-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-3xl px-6 py-12 @3xl:py-16">
        <header className="border-b pb-8">
          <p className="font-mono text-primary text-sm uppercase tracking-[0.25em]">
            Patch {version}
            {date && <span className="text-muted-foreground"> · {date}</span>}
          </p>
          <h2
            id={`${id}-title`}
            className="mt-3 font-black text-[clamp(2.5rem,9cqi,4.5rem)] uppercase italic leading-none tracking-tighter"
          >
            {title}
          </h2>
          {summary && <p className="mt-4 text-pretty text-lead text-muted-foreground">{summary}</p>}
        </header>

        {/* Scrolls rather than wraps on a narrow screen: the thumb slides along one row. */}
        <div className="mt-6 overflow-x-auto">
          <SegmentedControl
            aria-label={labels.filter}
            value={filter}
            onValueChange={(value) => value && setFilter(value as 'all' | PatchKind)}
            size="sm"
          >
            <SegmentedControlItem value="all">
              {labels.all}
              <span className="ml-1.5 font-mono text-muted-foreground tabular-nums">
                {all.length}
              </span>
            </SegmentedControlItem>
            {kinds.map((kind) => (
              <SegmentedControlItem key={kind} value={kind} disabled={count(kind) === 0}>
                {labels[kind]}
                <span className="ml-1.5 font-mono text-muted-foreground tabular-nums">
                  {count(kind)}
                </span>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {shown.length === 0 ? (
          <p className="mt-10 text-muted-foreground">{labels.empty}</p>
        ) : (
          <div className="mt-8 space-y-10">
            {shown.map((section) => (
              <section key={section.id} aria-labelledby={`${id}-${section.id}`}>
                <h3
                  id={`${id}-${section.id}`}
                  className="flex items-center gap-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.25em]"
                >
                  {section.title}
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.entries.map((entry) => {
                    const { tag, Icon } = kindStyle[entry.kind]
                    return (
                      <li
                        key={entry.target + entry.kind}
                        className="border bg-card p-4 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 font-bold font-mono text-[11px] uppercase tracking-wider',
                              tag,
                              cut,
                            )}
                          >
                            <Icon aria-hidden="true" className="size-3" />
                            {labels[entry.kind]}
                          </span>
                          <span className="font-bold uppercase tracking-wide">{entry.target}</span>
                        </div>
                        <ul className="mt-3 space-y-1.5 pl-1 text-sm">
                          {entry.changes.map((change) => (
                            <li
                              key={typeof change === 'string' ? change : change.label}
                              className="flex gap-2"
                            >
                              <span aria-hidden="true" className="text-primary">
                                ›
                              </span>
                              <span>
                                <Change change={change} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export { PatchNotes01 }
