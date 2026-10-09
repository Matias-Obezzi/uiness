'use client'

import {
  CarIcon,
  CheckIcon,
  CoinsIcon,
  CrownIcon,
  FlagIcon,
  GemIcon,
  LockIcon,
  MusicIcon,
  PaletteIcon,
  ShirtIcon,
  SparklesIcon,
  StickerIcon,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PassRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface PassReward {
  name: string
  rarity: PassRarity
  icon?: React.ReactNode
}

export interface PassTier {
  level: number
  free?: PassReward
  premium?: PassReward
}

export interface BattlePass01Labels {
  endsIn: string
  tier: string
  xp: string
  free: string
  premium: string
  unlock: string
  unlocked: string
  claimed: string
  locked: string
  rewards: string
  rarity: Record<PassRarity, string>
}

export interface BattlePass01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  season?: string
  title?: React.ReactNode
  /** When the season ends: a date, a timestamp or an ISO string. Default twelve days from now. */
  endsAt?: Date | number | string
  /** The highest tier reached. */
  tier?: number
  /** Experience earned towards the next tier, out of `xpPerTier`. */
  xp?: number
  xpPerTier?: number
  /** Whether the premium track is owned. */
  premium?: boolean
  /** What the premium track costs, as written text. `null` hides the button. */
  price?: string | null
  tiers?: PassTier[]
  onUnlock?: () => void
  labels?: Partial<BattlePass01Labels>
}

const defaultLabels: BattlePass01Labels = {
  endsIn: 'Ends in',
  tier: 'Tier',
  xp: 'Experience to the next tier',
  free: 'Free',
  premium: 'Premium',
  unlock: 'Unlock premium',
  unlocked: 'Premium unlocked',
  claimed: 'claimed',
  locked: 'locked',
  rewards: 'Rewards by tier',
  rarity: { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
}

/** The theme's chart colors stand in for the rarities, so they follow any theme. */
const rarityColor: Record<PassRarity, string> = {
  common: 'var(--muted-foreground)',
  rare: 'var(--chart-1)',
  epic: 'var(--chart-4)',
  legendary: 'var(--chart-3)',
}

const premiumRewards: [string, React.ReactNode][] = [
  ['Chrome wrap', <PaletteIcon key="i" />],
  ['Night runner', <ShirtIcon key="i" />],
  ['Glitch emote', <SparklesIcon key="i" />],
  ['Synthwave track', <MusicIcon key="i" />],
  ['Holo banner', <FlagIcon key="i" />],
]

/** Thirty tiers: credits on the free track, a reward on every premium one, a car every tenth. */
const defaultTiers: PassTier[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1
  const [name, icon] = premiumRewards[i % premiumRewards.length] as [string, React.ReactNode]
  return {
    level,
    free:
      level % 2 === 0
        ? { name: `${level * 10} credits`, rarity: 'common', icon: <CoinsIcon /> }
        : level % 5 === 0
          ? { name: 'Sticker', rarity: 'rare', icon: <StickerIcon /> }
          : undefined,
    premium:
      level % 10 === 0
        ? { name: `Drift car Mk ${level / 10}`, rarity: 'legendary', icon: <CarIcon /> }
        : level % 5 === 0
          ? { name: 'Crown banner', rarity: 'epic', icon: <CrownIcon /> }
          : { name, rarity: level % 3 === 0 ? 'rare' : 'common', icon: icon ?? <GemIcon /> },
  }
})

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(10px_0,100%_0,100%_calc(100%_-_10px),calc(100%_-_10px)_100%,0_100%,0_10px)]'

const toTime = (value: Date | number | string) => new Date(value).getTime()

/** Milliseconds left until `to`, ticking every second. */
function useCountdown(to: number) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return Math.max(0, to - now)
}

const two = (n: number) => String(n).padStart(2, '0')

function formatLeft(ms: number) {
  const minutes = Math.floor(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return `${days}d ${two(hours)}h ${two(minutes % 60)}m`
}

function Reward({
  reward,
  claimed,
  locked,
  label,
}: {
  reward?: PassReward
  claimed: boolean
  locked: boolean
  label: string
}) {
  if (!reward)
    return <div aria-hidden="true" className="aspect-square border border-dashed opacity-40" />
  return (
    <div
      style={{ '--rarity': rarityColor[reward.rarity] } as React.CSSProperties}
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden border border-b-2 border-b-(--rarity) bg-[linear-gradient(to_top,color-mix(in_oklab,var(--rarity)_30%,transparent),transparent_75%)] p-2 text-center',
        // Locked rewards keep their color, as a teaser, under a lock.
        locked && 'opacity-70',
      )}
    >
      <span aria-hidden="true" className="text-(--rarity) [&_svg]:size-6">
        {reward.icon}
      </span>
      <span className="line-clamp-2 font-medium text-[11px] leading-tight">{reward.name}</span>
      <span className="sr-only">{label}</span>
      {claimed && !locked && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-4 items-center justify-center bg-chart-2 text-background"
        >
          <CheckIcon className="size-3" />
        </span>
      )}
      {locked && (
        <LockIcon
          aria-hidden="true"
          className="absolute top-1 right-1 size-3.5 text-muted-foreground"
        />
      )}
    </div>
  )
}

/**
 * A season's battle pass: time left, the tier reached with the experience towards the next,
 * and the track of rewards, free above and premium below, scrolled to where the player is.
 */
function BattlePass01({
  season = 'Season 04',
  title = 'Neon Drift',
  endsAt,
  tier = 12,
  xp = 1350,
  xpPerTier = 2000,
  premium = false,
  price = '950',
  tiers = defaultTiers,
  onUnlock,
  labels: labelsProp,
  className,
  ...props
}: BattlePass01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  // Without a date the season ends twelve days from the first render, and stays put.
  const [end] = React.useState(() =>
    endsAt === undefined ? Date.now() + 12 * 86400000 + 4 * 3600000 : toTime(endsAt),
  )
  const target = endsAt === undefined ? end : toTime(endsAt)
  const left = useCountdown(target)
  const track = React.useRef<HTMLOListElement>(null)
  const last = tiers[tiers.length - 1]?.level ?? 0

  // Start with the next tier to earn in the middle of the track.
  React.useEffect(() => {
    const list = track.current
    const next = list?.querySelector<HTMLElement>('[data-next]')
    if (!list || !next) return
    list.scrollLeft = next.offsetLeft - list.clientWidth / 2 + next.offsetWidth / 2
  }, [])

  const segments = 20
  const filled = Math.round((Math.min(xp, xpPerTier) / xpPerTier) * segments)

  return (
    <section
      data-slot="block-battle-pass-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-primary text-xs uppercase tracking-[0.25em]">{season}</p>
            <h2
              id={`${id}-title`}
              className="mt-1 font-black text-[clamp(2.25rem,7cqi,3.5rem)] uppercase italic leading-none tracking-tighter"
            >
              {title}
            </h2>
            <p className="mt-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
              {labels.endsIn}{' '}
              <time
                className="text-foreground tabular-nums"
                dateTime={new Date(target).toISOString()}
              >
                {formatLeft(left)}
              </time>
            </p>
          </div>

          {premium ? (
            <p
              className={cn(
                'inline-flex items-center gap-2 bg-primary/10 px-4 py-2 font-bold text-primary text-sm uppercase tracking-wider',
                cut,
              )}
            >
              <CrownIcon aria-hidden="true" className="size-4" />
              {labels.unlocked}
            </p>
          ) : (
            price !== null && (
              <Button
                onClick={onUnlock}
                size="lg"
                className={cn(
                  'h-12 px-6 font-bold uppercase tracking-wider shadow-[0_0_32px_-6px_var(--primary)]',
                  cut,
                )}
              >
                <CrownIcon />
                {labels.unlock}
                <span className="inline-flex items-center gap-1 font-mono opacity-80">
                  <GemIcon aria-hidden="true" className="size-3.5" />
                  {price}
                </span>
              </Button>
            )
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border bg-card p-4">
          <p className="font-black font-mono text-3xl tabular-nums">
            <span className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
              {labels.tier}{' '}
            </span>
            {tier}
            <span className="text-base text-muted-foreground">/{last}</span>
          </p>
          <div className="min-w-48 flex-1 space-y-1.5">
            <div
              role="progressbar"
              aria-label={labels.xp}
              aria-valuemin={0}
              aria-valuemax={xpPerTier}
              aria-valuenow={xp}
              className="flex gap-0.5"
            >
              {Array.from({ length: segments }, (_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: the segments are positions, not items
                  key={i}
                  className={cn(
                    'h-2.5 flex-1 -skew-x-12',
                    i < filled ? 'bg-primary shadow-[0_0_8px_-1px_var(--primary)]' : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <p className="text-right font-mono text-muted-foreground text-xs tabular-nums">
              {xp.toLocaleString('en')} / {xpPerTier.toLocaleString('en')} XP
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
          {/* The track names, level with the reward rows. */}
          <div
            aria-hidden="true"
            className="flex flex-col gap-2 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]"
          >
            <span className="flex-1 rotate-180 text-center [writing-mode:vertical-rl]">
              {labels.free}
            </span>
            <span className="h-6" />
            <span className="flex-1 rotate-180 text-center text-primary [writing-mode:vertical-rl]">
              {labels.premium}
            </span>
          </div>
          <ol
            ref={track}
            aria-label={labels.rewards}
            className="relative flex snap-x gap-2 overflow-x-auto py-2 [scrollbar-width:thin]"
          >
            {tiers.map((t) => {
              const reached = t.level <= tier
              const next = t.level === tier + 1
              const rarity = (r?: PassReward) => (r ? labels.rarity[r.rarity] : '')
              const state = (owned: boolean) =>
                owned ? (reached ? labels.claimed : '') : labels.locked
              return (
                <li
                  key={t.level}
                  data-next={next || undefined}
                  className="grid w-24 shrink-0 snap-center grid-rows-[auto_auto_auto] gap-2"
                >
                  <Reward
                    reward={t.free}
                    claimed={reached}
                    locked={false}
                    label={`${labels.tier} ${t.level}, ${labels.free}: ${t.free?.name}, ${rarity(t.free)} ${state(true)}`}
                  />
                  <div className="relative flex h-6 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-[-4px] top-1/2 h-0.5 -translate-y-1/2',
                        reached ? 'bg-primary' : 'bg-border',
                      )}
                    />
                    <span
                      className={cn(
                        'relative px-2 font-bold font-mono text-xs tabular-nums',
                        cut,
                        reached
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                        next && 'bg-background text-primary ring-2 ring-primary ring-inset',
                      )}
                    >
                      {t.level}
                    </span>
                  </div>
                  <Reward
                    reward={t.premium}
                    claimed={reached}
                    locked={!premium}
                    label={`${labels.tier} ${t.level}, ${labels.premium}: ${t.premium?.name}, ${rarity(t.premium)} ${state(premium)}`}
                  />
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

export { BattlePass01 }
