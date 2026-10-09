'use client'

import {
  CrosshairIcon,
  FlameIcon,
  LockIcon,
  ShieldIcon,
  SkullIcon,
  TrophyIcon,
  ZapIcon,
} from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pattern } from '@/components/ui/pattern'
import { cn } from '@/lib/utils'

export interface PlayerRank {
  /** Like `Diamond II`. */
  name: string
  /** Ranked points. */
  points: number
}

export interface PlayerProfile {
  name: string
  /** Region or clan, shown after the name. */
  tag?: string
  avatar?: string
  level: number
  /** Experience earned in this level, out of `xpToNext`. */
  xp: number
  xpToNext: number
  rank?: PlayerRank
}

export interface PlayerStat {
  label: string
  value: string
}

export interface PlayerAchievement {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  unlocked: boolean
  /** How far along a locked one is, 0 to 1. */
  progress?: number
}

export interface PlayerMatch {
  id: string
  result: 'win' | 'loss' | 'draw'
  mode: string
  /** Like `13 – 9`. */
  score: string
  /** Kills, deaths, assists, like `24 / 11 / 6`. */
  kda?: string
  /** When, as already written text: `2h ago`. */
  when: string
}

export interface Player01Labels {
  level: string
  xp: string
  stats: string
  achievements: string
  unlocked: string
  locked: string
  matches: string
  win: string
  loss: string
  draw: string
}

export interface Player01Props extends React.ComponentProps<'section'> {
  player?: PlayerProfile
  stats?: PlayerStat[]
  achievements?: PlayerAchievement[]
  matches?: PlayerMatch[]
  labels?: Partial<Player01Labels>
}

const defaultLabels: Player01Labels = {
  level: 'Level',
  xp: 'Experience',
  stats: 'Career',
  achievements: 'Achievements',
  unlocked: 'Unlocked',
  locked: 'Locked',
  matches: 'Recent matches',
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
}

const defaultPlayer: PlayerProfile = {
  name: 'Hexa',
  tag: 'EU',
  level: 47,
  xp: 6400,
  xpToNext: 9000,
  rank: { name: 'Diamond II', points: 2184 },
}

const defaultStats: PlayerStat[] = [
  { label: 'K/D', value: '1.84' },
  { label: 'Win rate', value: '57%' },
  { label: 'Matches', value: '1,284' },
  { label: 'Hours', value: '412' },
]

const defaultAchievements: PlayerAchievement[] = [
  {
    id: 'ace',
    name: 'Ace',
    description: 'Take out a whole team alone.',
    icon: <CrosshairIcon />,
    unlocked: true,
  },
  {
    id: 'streak',
    name: 'On fire',
    description: 'Win ten in a row.',
    icon: <FlameIcon />,
    unlocked: true,
  },
  {
    id: 'wall',
    name: 'The wall',
    description: 'Block 500 shots.',
    icon: <ShieldIcon />,
    unlocked: true,
  },
  {
    id: 'speed',
    name: 'Overclocked',
    description: 'Finish a match in under five minutes.',
    icon: <ZapIcon />,
    unlocked: false,
    progress: 0.6,
  },
  {
    id: 'reaper',
    name: 'Reaper',
    description: '10,000 eliminations.',
    icon: <SkullIcon />,
    unlocked: false,
    progress: 0.82,
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Reach Master rank.',
    icon: <TrophyIcon />,
    unlocked: false,
    progress: 0.3,
  },
]

const defaultMatches: PlayerMatch[] = [
  { id: '1', result: 'win', mode: 'Ranked', score: '13 – 9', kda: '24 / 11 / 6', when: '2h ago' },
  { id: '2', result: 'win', mode: 'Ranked', score: '13 – 11', kda: '19 / 14 / 9', when: '3h ago' },
  {
    id: '3',
    result: 'loss',
    mode: 'Ranked',
    score: '7 – 13',
    kda: '12 / 16 / 4',
    when: 'Yesterday',
  },
  {
    id: '4',
    result: 'draw',
    mode: 'Scrim',
    score: '12 – 12',
    kda: '21 / 18 / 7',
    when: 'Yesterday',
  },
  {
    id: '5',
    result: 'win',
    mode: 'Casual',
    score: '13 – 4',
    kda: '28 / 6 / 3',
    when: '2 days ago',
  },
]

/** A hexagon, for the avatar frame and the rank emblem. */
const hexagon = '[clip-path:polygon(25%_4%,75%_4%,100%_50%,75%_96%,25%_96%,0_50%)]'

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(8px_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%,0_8px)]'

const resultStyle = {
  win: 'bg-chart-2',
  loss: 'bg-destructive',
  draw: 'bg-muted-foreground',
} as const

/** Experience as a row of segments filling up, the way a game draws it. */
function XpBar({ value, max, label }: { value: number; max: number; label: string }) {
  const segments = 20
  const filled = Math.round((Math.min(value, max) / max) * segments)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="flex gap-0.5"
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: the segments are positions, not items
          key={i}
          className={cn(
            'h-2 flex-1 -skew-x-12',
            i < filled ? 'bg-primary shadow-[0_0_8px_-1px_var(--primary)]' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}

/**
 * A player's card: level and experience, rank, career figures, achievements with how close
 * the locked ones are, and the last matches won and lost.
 */
function Player01({
  player = defaultPlayer,
  stats = defaultStats,
  achievements = defaultAchievements,
  matches = defaultMatches,
  labels: labelsProp,
  className,
  ...props
}: Player01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <section
      data-slot="block-player-01"
      aria-labelledby={`${id}-name`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="overflow-hidden border bg-card">
          {/* The banner. */}
          <div className="relative h-28 overflow-hidden bg-[linear-gradient(110deg,color-mix(in_oklab,var(--primary)_45%,transparent),transparent_70%)] @2xl:h-36">
            <Pattern variant="grid" className="text-primary/20" />
            <div
              aria-hidden="true"
              className="absolute inset-0 [background:repeating-linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_6%,transparent)_0_1px,transparent_1px_4px)]"
            />
          </div>

          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex flex-wrap items-end gap-x-5 gap-y-3 @2xl:-mt-14">
              <div className="relative">
                <div className={cn('bg-primary p-1', hexagon)}>
                  <Avatar className={cn('size-24 rounded-none @2xl:size-28', hexagon)}>
                    {player.avatar && <AvatarImage src={player.avatar} alt="" />}
                    <AvatarFallback className="rounded-none font-black font-mono text-2xl">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span
                  className={cn(
                    'absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background px-2 py-0.5 font-bold font-mono text-primary text-xs ring-1 ring-primary',
                    cut,
                  )}
                >
                  <span className="sr-only">{`${labels.level} ${player.level}`}</span>
                  <span aria-hidden="true">{player.level}</span>
                </span>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <h2
                  id={`${id}-name`}
                  className="truncate font-black text-3xl uppercase italic tracking-tight"
                >
                  {player.name}
                  {player.tag && (
                    <span className="ml-2 font-mono font-normal text-base text-muted-foreground not-italic">
                      #{player.tag}
                    </span>
                  )}
                </h2>
              </div>

              {player.rank && (
                <div className="flex items-center gap-3 pb-1">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-12 items-center justify-center bg-chart-1 font-black text-background text-lg',
                      hexagon,
                    )}
                  >
                    {player.rank.name.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block font-bold uppercase tracking-wide">
                      {player.rank.name}
                    </span>
                    <span className="font-mono text-muted-foreground text-xs tabular-nums">
                      {player.rank.points.toLocaleString('en')} RP
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <span>
                  {labels.level} {player.level} → {player.level + 1}
                </span>
                <span className="tabular-nums">
                  {player.xp.toLocaleString('en')} / {player.xpToNext.toLocaleString('en')} XP
                </span>
              </div>
              <XpBar value={player.xp} max={player.xpToNext} label={labels.xp} />
            </div>

            {stats.length > 0 && (
              <dl
                aria-label={labels.stats}
                className="mt-6 grid grid-cols-2 gap-px border bg-border @md:grid-cols-4"
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse gap-1 bg-card px-4 py-3">
                    <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                      {stat.label}
                    </dt>
                    <dd className="font-bold font-mono text-2xl tabular-nums">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 grid gap-8 @3xl:grid-cols-[1.3fr_1fr]">
              {achievements.length > 0 && (
                <div>
                  <h3 className="flex items-baseline justify-between font-bold uppercase tracking-wide">
                    {labels.achievements}
                    <span className="font-mono font-normal text-muted-foreground text-xs tabular-nums">
                      {unlocked}/{achievements.length}
                    </span>
                  </h3>
                  <ul className="mt-3 grid grid-cols-2 gap-2 @md:grid-cols-3">
                    {achievements.map((a) => (
                      <li
                        key={a.id}
                        className={cn(
                          'relative flex flex-col gap-2 border p-3',
                          a.unlocked
                            ? 'border-primary/40 bg-primary/5'
                            : 'bg-muted/30 text-muted-foreground',
                        )}
                        title={a.description}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex size-8 items-center justify-center [&_svg]:size-4',
                            a.unlocked ? 'text-primary' : 'opacity-50',
                          )}
                        >
                          {a.unlocked ? a.icon : <LockIcon />}
                        </span>
                        <span className="font-semibold text-foreground text-sm">{a.name}</span>
                        <span className="sr-only">
                          {a.unlocked ? labels.unlocked : labels.locked}
                          {a.description ? `. ${a.description}` : ''}
                        </span>
                        {!a.unlocked && a.progress !== undefined && (
                          <span aria-hidden="true" className="h-1 bg-muted">
                            <span
                              className="block h-full bg-muted-foreground"
                              style={{ width: `${Math.round(a.progress * 100)}%` }}
                            />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {matches.length > 0 && (
                <div>
                  <h3 className="font-bold uppercase tracking-wide">{labels.matches}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {matches.map((m) => (
                      <li
                        key={m.id}
                        className="relative flex items-center gap-3 overflow-hidden border bg-background py-2 pr-3 pl-4 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className={cn('absolute inset-y-0 left-0 w-1', resultStyle[m.result])}
                        />
                        <span
                          className={cn(
                            'w-10 font-bold font-mono text-xs uppercase',
                            m.result === 'win' && 'text-chart-2',
                            m.result === 'loss' && 'text-destructive',
                            m.result === 'draw' && 'text-muted-foreground',
                          )}
                        >
                          {labels[m.result]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono tabular-nums">{m.score}</span>
                          <span className="block text-muted-foreground text-xs">
                            {m.mode} · {m.when}
                          </span>
                        </span>
                        {m.kda && (
                          <span className="font-mono text-muted-foreground text-xs tabular-nums">
                            {m.kda}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Player01 }
