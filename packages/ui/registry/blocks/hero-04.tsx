'use client'

import { PlayIcon, ZapIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/ui/number-ticker'
import { RetroGrid } from '@/components/ui/retro-grid'
import { ScrambleText } from '@/components/ui/scramble-text'
import { cn } from '@/lib/utils'

export interface Hero04Action {
  label: string
  href: string
}

export interface Hero04Stat {
  label: string
  value: number
  /** Written after the number, like `+` or `ms`. */
  suffix?: string
}

export interface Hero04Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The line above the title, with a live dot. `null` hides it. */
  eyebrow?: React.ReactNode
  /** The game's name. Scrambles into place, so plain text. */
  title?: string
  /** A short line under the title, in the HUD's mono type. */
  tagline?: React.ReactNode
  description?: React.ReactNode
  primaryAction?: Hero04Action | null
  /** Usually the trailer. */
  secondaryAction?: Hero04Action | null
  platforms?: string[]
  stats?: Hero04Stat[]
}

const defaultStats: Hero04Stat[] = [
  { label: 'Players online', value: 184320 },
  { label: 'Tracks', value: 42 },
  { label: 'Avg. ping', value: 18, suffix: 'ms' },
]

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(12px_0,100%_0,100%_calc(100%_-_12px),calc(100%_-_12px)_100%,0_100%,0_12px)]'

/** Brackets in the four corners of the frame, like a HUD's. */
function Corners() {
  const corner = 'absolute size-5 border-primary'
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-4 @3xl:inset-6">
      <span className={cn(corner, 'top-0 left-0 border-t-2 border-l-2')} />
      <span className={cn(corner, 'top-0 right-0 border-t-2 border-r-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'right-0 bottom-0 border-r-2 border-b-2')} />
    </span>
  )
}

/**
 * A launch hero for a game: the title scrambles in over a synthwave floor, inside a HUD frame,
 * with the platforms it runs on and live figures under it.
 */
function Hero04({
  eyebrow = 'Season 04 · Now live',
  title = 'Neon Drift',
  tagline = '// Race the grid. Own the night.',
  description = 'Twelve new tracks, a ranked ladder that resets every season and cross-play on every platform. Free to play, no pay to win.',
  primaryAction = { label: 'Play free', href: '#' },
  secondaryAction = { label: 'Watch trailer', href: '#' },
  platforms = ['PC', 'PlayStation 5', 'Xbox Series', 'Switch'],
  stats = defaultStats,
  className,
  ...props
}: Hero04Props) {
  const id = React.useId()
  return (
    <section
      data-slot="block-hero-04"
      aria-labelledby={`${id}-title`}
      className={cn('@container relative isolate w-full overflow-hidden bg-background', className)}
      {...props}
    >
      <RetroGrid
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 [mask-image:linear-gradient(to_top,black_30%,transparent)]"
        lineColor="color-mix(in oklab, var(--primary) 45%, transparent)"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]"
      />
      {/* Scanlines, faint enough to read through. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_0_1px,transparent_1px_4px)]"
      />
      <Corners />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-8 pt-20 pb-12 text-center @3xl:pt-28">
        {eyebrow && (
          <p
            className={cn(
              'inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 font-mono text-primary text-xs uppercase tracking-[0.2em]',
              cut,
            )}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {eyebrow}
          </p>
        )}

        <h1
          id={`${id}-title`}
          className="mt-6 font-black text-[clamp(3rem,15cqi,8.5rem)] uppercase italic leading-[0.85] tracking-tighter [text-shadow:0_0_40px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
        >
          <span className="sr-only">{title}</span>
          <ScrambleText aria-hidden="true" text={title} trigger="mount" />
        </h1>
        {tagline && (
          <p className="mt-4 font-mono text-primary text-sm uppercase tracking-[0.25em]">
            {tagline}
          </p>
        )}
        {description && (
          <p className="mt-6 max-w-xl text-pretty text-lead text-muted-foreground">{description}</p>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {primaryAction && (
              <Button
                asChild
                size="lg"
                className={cn(
                  'h-12 px-8 font-bold uppercase tracking-wider shadow-[0_0_32px_-6px_var(--primary)]',
                  cut,
                )}
              >
                <a href={primaryAction.href}>
                  <ZapIcon />
                  {primaryAction.label}
                </a>
              </Button>
            )}
            {secondaryAction && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 font-bold uppercase tracking-wider"
              >
                <a href={secondaryAction.href}>
                  <PlayIcon />
                  {secondaryAction.label}
                </a>
              </Button>
            )}
          </div>
        )}

        {platforms.length > 0 && (
          <ul className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-muted-foreground text-xs uppercase tracking-widest">
            {platforms.map((platform, i) => (
              <li key={platform} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">/</span>}
                {platform}
              </li>
            ))}
          </ul>
        )}

        {stats.length > 0 && (
          <dl className="mt-16 grid w-full max-w-2xl grid-cols-1 divide-y border-y bg-background/60 backdrop-blur-sm @md:grid-cols-3 @md:divide-x @md:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1 px-4 py-4">
                <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  {stat.label}
                </dt>
                <dd className="font-bold font-mono text-2xl tabular-nums">
                  <NumberTicker value={stat.value} />
                  {stat.suffix}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}

export { Hero04 }
