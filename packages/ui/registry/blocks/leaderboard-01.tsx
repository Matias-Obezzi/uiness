'use client'

import { ChevronDownIcon, ChevronUpIcon, CrownIcon, MinusIcon } from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

export interface LeaderboardPlayer {
  id: string
  name: string
  /** Region or clan, shown after the name. */
  tag?: string
  avatar?: string
  level: number
  score: number
  /** 0 to 1. */
  winRate: number
  /** Places gained since the last reset, negative for lost. */
  change?: number
}

export interface LeaderboardBoard {
  id: string
  label: string
  /** In rank order, first place first. */
  players: LeaderboardPlayer[]
}

export interface Leaderboard01Labels {
  boards: string
  rank: string
  player: string
  level: string
  score: string
  winRate: string
  change: string
  you: string
  up: string
  down: string
}

export interface Leaderboard01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  boards?: LeaderboardBoard[]
  defaultBoard?: string
  /** The reader's player id: their row is marked wherever it is. */
  you?: string
  labels?: Partial<Leaderboard01Labels>
}

const defaultLabels: Leaderboard01Labels = {
  boards: 'Leaderboard',
  rank: 'Rank',
  player: 'Player',
  level: 'Level',
  score: 'Score',
  winRate: 'Win rate',
  change: 'Change',
  you: 'You',
  up: 'Up',
  down: 'Down',
}

const names = [
  ['Vex', 'EU'],
  ['NovaByte', 'NA'],
  ['Kairo', 'KR'],
  ['Mira.exe', 'EU'],
  ['Glitchwave', 'BR'],
  ['Ashen', 'NA'],
  ['Driftking', 'JP'],
  ['Hexa', 'EU'],
  ['Lumen', 'OCE'],
  ['Pyrex', 'NA'],
] as const

/** Ten made-up players, different per board so switching shows something. */
const board = (id: string, label: string, seed: number): LeaderboardBoard => ({
  id,
  label,
  players: names.map(([name, tag], i) => {
    const turn = (i * 7 + seed) % names.length
    const [n, t] = names[turn] ?? [name, tag]
    return {
      id: n.toLowerCase(),
      name: n,
      tag: t,
      level: 80 - i * 4 - (seed % 3),
      score: Math.round(48200 / (1 + i * 0.09 + seed * 0.04)),
      winRate: Math.max(0.41, 0.74 - i * 0.025 - seed * 0.01),
      change: [2, 0, -1, 3, 1, -2, 0, 4, -3, 1][(i + seed) % 10],
    }
  }),
})

const defaultBoards = [
  board('global', 'Global', 0),
  board('weekly', 'Weekly', 3),
  board('friends', 'Friends', 5),
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(6px_0,100%_0,100%_calc(100%_-_6px),calc(100%_-_6px)_100%,0_100%,0_6px)]'

function PlayerAvatar({ player, className }: { player: LeaderboardPlayer; className?: string }) {
  return (
    <Avatar className={className}>
      {player.avatar && <AvatarImage src={player.avatar} alt="" />}
      <AvatarFallback className="font-bold font-mono text-xs">
        {player.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

function Change({ value, labels }: { value?: number; labels: Leaderboard01Labels }) {
  if (!value) return <MinusIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
  const up = value > 0
  const Icon = up ? ChevronUpIcon : ChevronDownIcon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono text-xs tabular-nums',
        up ? 'text-chart-2' : 'text-destructive',
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{`${up ? labels.up : labels.down} ${Math.abs(value)}`}</span>
      <span aria-hidden="true">{Math.abs(value)}</span>
    </span>
  )
}

/** First, second and third on steps, first in the middle and tallest. */
function Podium({ players, rank }: { players: LeaderboardPlayer[]; rank: string }) {
  const [first, second, third] = players
  // In rank order for reading; `order` puts first in the middle on screen.
  const places = [
    { player: first, place: 1, step: 'h-24' },
    { player: second, place: 2, step: 'h-16' },
    { player: third, place: 3, step: 'h-10' },
  ]
  return (
    <ol className="grid grid-cols-3 items-end gap-3">
      {places.map(({ player, place, step }) =>
        player ? (
          <li
            key={player.id}
            style={{ order: place === 1 ? 2 : place === 2 ? 1 : 3 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            {place === 1 && (
              <CrownIcon
                aria-hidden="true"
                className="size-5 text-chart-3 drop-shadow-[0_0_8px_var(--chart-3)]"
              />
            )}
            <PlayerAvatar
              player={player}
              className={cn(
                'size-12 ring-2 ring-offset-2 ring-offset-background @md:size-14',
                place === 1 ? 'ring-chart-3' : 'ring-border',
              )}
            />
            <span className="max-w-full truncate font-semibold text-sm">{player.name}</span>
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {player.score.toLocaleString('en')}
            </span>
            <span
              className={cn(
                'flex w-full items-start justify-center pt-2 font-black font-mono text-2xl',
                step,
                cut,
                place === 1
                  ? 'bg-primary text-primary-foreground shadow-[0_0_32px_-8px_var(--primary)]'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="sr-only">{`${rank} ${place}`}</span>
              <span aria-hidden="true">{place}</span>
            </span>
          </li>
        ) : null,
      )}
    </ol>
  )
}

/**
 * A ranked ladder: the top three on a podium, then everyone with their level, score, win rate
 * and how far they moved. Boards switch between scopes, like global, weekly and friends, and
 * the reader's own row is marked.
 */
function Leaderboard01({
  title = 'Ranked ladder',
  description = 'Season 04 · Resets in 12 days',
  boards = defaultBoards,
  defaultBoard,
  you = 'hexa',
  labels: labelsProp,
  className,
  ...props
}: Leaderboard01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const [current, setCurrent] = React.useState(defaultBoard ?? boards[0]?.id ?? '')
  const players = boards.find((b) => b.id === current)?.players ?? []

  return (
    <section
      data-slot="block-leaderboard-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-4xl px-6 py-12 @3xl:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id={`${id}-title`}
              className="font-black text-title uppercase italic tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
                {description}
              </p>
            )}
          </div>
          {boards.length > 1 && (
            <SegmentedControl
              aria-label={labels.boards}
              value={current}
              onValueChange={(value) => value && setCurrent(value)}
              size="sm"
            >
              {boards.map((b) => (
                <SegmentedControlItem key={b.id} value={b.id}>
                  {b.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </div>

        <div className="mt-10 @2xl:px-16">
          <Podium players={players.slice(0, 3)} rank={labels.rank} />
        </div>

        <div className="mt-8 overflow-hidden border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em]">
              <tr>
                <th scope="col" className="w-14 px-4 py-2.5 text-left font-medium">
                  {labels.rank}
                </th>
                <th scope="col" className="px-2 py-2.5 text-left font-medium">
                  {labels.player}
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-right font-medium @lg:table-cell"
                >
                  {labels.level}
                </th>
                <th scope="col" className="px-2 py-2.5 text-right font-medium">
                  {labels.score}
                </th>
                <th
                  scope="col"
                  className="hidden w-36 px-2 py-2.5 text-left font-medium @2xl:table-cell"
                >
                  {labels.winRate}
                </th>
                <th scope="col" className="w-16 px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">{labels.change}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => {
                const mine = player.id === you
                return (
                  <tr
                    key={player.id}
                    aria-current={mine ? 'true' : undefined}
                    className={cn(
                      'border-b transition-colors last:border-0 hover:bg-muted/40',
                      mine &&
                        'bg-primary/10 shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15',
                    )}
                  >
                    <td
                      className={cn(
                        'px-4 py-3 font-bold font-mono tabular-nums',
                        i < 3 ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {pad(i + 1)}
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-3">
                        <PlayerAvatar player={player} className="size-8" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-semibold">
                            <span className="truncate">{player.name}</span>
                            {mine && (
                              <span
                                className={cn(
                                  'bg-primary px-1.5 py-px font-mono text-[10px] text-primary-foreground uppercase',
                                  cut,
                                )}
                              >
                                {labels.you}
                              </span>
                            )}
                          </span>
                          {player.tag && (
                            <span className="font-mono text-muted-foreground text-xs">
                              #{player.tag}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="hidden px-2 py-3 text-right font-mono tabular-nums @lg:table-cell">
                      {player.level}
                    </td>
                    <td className="px-2 py-3 text-right font-bold font-mono tabular-nums">
                      {player.score.toLocaleString('en')}
                    </td>
                    <td className="hidden px-2 py-3 @2xl:table-cell">
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true" className="h-1.5 flex-1 bg-muted">
                          <span
                            className="block h-full bg-primary"
                            style={{ width: `${Math.round(player.winRate * 100)}%` }}
                          />
                        </span>
                        <span className="w-9 text-right font-mono text-xs tabular-nums">
                          {Math.round(player.winRate * 100)}%
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Change value={player.change} labels={labels} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export { Leaderboard01 }
