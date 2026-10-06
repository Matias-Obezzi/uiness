'use client'

import { ActivityIcon, BarChart3Icon, BlocksIcon, SlidersHorizontalIcon } from 'lucide-react'
import * as React from 'react'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { Label } from '@/components/ui/label'
import { Marquee } from '@/components/ui/marquee'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Odometer } from '@/components/ui/odometer'
import { Switch } from '@/components/ui/switch'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface BentoFeature {
  /** An icon element, like `<ActivityIcon />`. */
  icon?: React.ReactNode
  title: string
  description: React.ReactNode
  /** The small live preview at the top of the cell. */
  visual?: React.ReactNode
  /** Take two columns instead of one when there is room. */
  wide?: boolean
}

export interface Features02Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  features?: BentoFeature[]
}

const counterSteps = [3, 7, 2, 5, 9, 4, 6, 1]

/** A figure that keeps climbing while it is on screen, its digits rolling like an odometer. */
function CounterVisual() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false })
  const reduced = useReducedMotion()
  const [value, setValue] = React.useState(128_406)
  React.useEffect(() => {
    if (!inView || reduced) return
    let step = 0
    const timer = setInterval(() => {
      setValue((v) => v + (counterSteps[step++ % counterSteps.length] ?? 1) * 11)
    }, 1800)
    return () => clearInterval(timer)
  }, [inView, reduced])
  return (
    <div
      ref={ref}
      className="relative flex h-full min-h-40 flex-col justify-center overflow-hidden rounded-lg border bg-gradient-to-br from-muted/60 to-background p-5"
    >
      <div
        aria-hidden
        className="-right-10 -bottom-16 absolute size-48 rounded-full bg-primary/10 blur-2xl"
      />
      <span className="mb-2 inline-flex items-center gap-2 text-caption text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70 motion-reduce:animate-none" />
          <span className="relative size-2 rounded-full bg-emerald-500" />
        </span>
        Events processed today
      </span>
      <Odometer value={value} className="font-semibold text-5xl tracking-tight @3xl:text-6xl" />
    </div>
  )
}

const tags = [
  'Webhooks',
  'REST API',
  'SSO',
  'Audit log',
  'CSV import',
  'GraphQL',
  'Slack alerts',
  'Zapier',
  'SCIM',
  'Custom domains',
]

/** Two rows of integration tags drifting past each other. */
function TagsVisual() {
  const pill = (tag: string) => (
    <span
      key={tag}
      className="whitespace-nowrap rounded-full border bg-background px-3 py-1 text-muted-foreground text-xs shadow-xs"
    >
      {tag}
    </span>
  )
  return (
    <div className="flex h-full min-h-40 flex-col justify-center gap-3 rounded-lg border bg-muted/40 py-5">
      <Marquee duration={28} gap="0.5rem">
        {tags.slice(0, 5).map(pill)}
      </Marquee>
      <Marquee duration={34} gap="0.5rem" reverse>
        {tags.slice(5).map(pill)}
      </Marquee>
      <Marquee duration={30} gap="0.5rem">
        {[...tags.slice(3, 8)].reverse().map(pill)}
      </Marquee>
    </div>
  )
}

const bars = [32, 48, 40, 62, 55, 78, 70, 94]

/** A week of bars that grow in, with the headline figure counting up beside them. */
function ChartVisual() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  return (
    <div
      ref={ref}
      className="flex h-full min-h-40 flex-col justify-between gap-4 rounded-lg border bg-muted/40 p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption text-muted-foreground">Weekly active</span>
        <span className="font-semibold text-emerald-600 text-lg tabular-nums dark:text-emerald-400">
          +<NumberTicker value={38} />%
        </span>
      </div>
      <div aria-hidden className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative series
            key={i}
            className={cn(
              'flex-1 origin-bottom rounded-t-sm transition-transform duration-700 ease-emphasized motion-reduce:transition-none',
              i === bars.length - 1 ? 'bg-primary' : 'bg-primary/25',
              !inView && 'scale-y-0 motion-reduce:scale-y-100',
            )}
            style={{ height: `${h}%`, transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

const settings = [
  { id: 'sync', label: 'Realtime sync', on: true },
  { id: 'digest', label: 'Weekly digest', on: false },
  { id: 'preview', label: 'Preview deploys', on: true },
]

/** A small settings panel that works: flip the switches and the status follows. */
function ToggleVisual() {
  const baseId = React.useId()
  const [state, setState] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(settings.map((s) => [s.id, s.on])),
  )
  const live = state.sync
  const count = Object.values(state).filter(Boolean).length
  return (
    <div className="flex h-full min-h-40 flex-col gap-3 rounded-lg border bg-muted/40 p-4 @xl:flex-row @xl:items-center">
      <div className="flex flex-1 flex-col divide-y rounded-lg border bg-background">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
            <Label htmlFor={`${baseId}-${s.id}`} className="font-normal">
              {s.label}
            </Label>
            <Switch
              id={`${baseId}-${s.id}`}
              checked={state[s.id] ?? false}
              onCheckedChange={(on) => setState((prev) => ({ ...prev, [s.id]: on }))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-1 @xl:w-40">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-medium text-xs transition-colors',
            live
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-background text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              live
                ? 'animate-pulse bg-emerald-500 motion-reduce:animate-none'
                : 'bg-muted-foreground',
            )}
          />
          {live ? 'Live' : 'Paused'}
        </span>
        <span className="text-caption text-muted-foreground" aria-live="polite">
          {count} of {settings.length} enabled
        </span>
      </div>
    </div>
  )
}

const defaultFeatures: BentoFeature[] = [
  {
    icon: <ActivityIcon />,
    title: 'Real-time by default',
    description: 'Every event lands on the board the second it happens. No refresh button.',
    visual: <CounterVisual />,
    wide: true,
  },
  {
    icon: <BarChart3Icon />,
    title: 'Trends at a glance',
    description: 'Week over week, without building a single chart.',
    visual: <ChartVisual />,
  },
  {
    icon: <BlocksIcon />,
    title: 'Plays well with others',
    description: 'Forty integrations and a typed API for the rest.',
    visual: <TagsVisual />,
  },
  {
    icon: <SlidersHorizontalIcon />,
    title: 'Settings that stay out of the way',
    description: 'Sensible defaults, and one switch when you want something different.',
    visual: <ToggleVisual />,
    wide: true,
  },
]

/**
 * A bento of features where each cell carries a small live preview: a counter that rolls,
 * bars that grow, tags that drift and switches that work. One column when narrow, two on
 * a tablet, three when there is room.
 */
function Features02({
  eyebrow = 'Why teams switch',
  title = 'Small details, all of them working',
  description = 'A product is the sum of a hundred little decisions. Here are a few of ours, running live.',
  features = defaultFeatures,
  className,
  ...props
}: Features02Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-features-02"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-eyebrow text-primary uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
        </div>
        {/* BentoGrid switches columns at a viewport breakpoint; reset that and use the
            container instead, so the block reflows inside narrow frames too. */}
        <BentoGrid className="mt-12 md:grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-3">
          {features.map((feature) => (
            <BentoCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              header={feature.visual}
              className={cn(
                'p-3 [&>[data-slot=bento-body]]:px-2 [&>[data-slot=bento-body]]:pb-2',
                feature.wide && '@xl:col-span-2',
              )}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}

export { Features02 }
