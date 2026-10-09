'use client'

import {
  CarIcon,
  CheckIcon,
  CoinsIcon,
  CrownIcon,
  GhostIcon,
  PaletteIcon,
  RocketIcon,
  ShirtIcon,
  SparklesIcon,
  SwordIcon,
  TimerIcon,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Pattern } from '@/components/ui/pattern'
import { TiltCard, TiltCardItem } from '@/components/ui/tilt-card'
import { cn } from '@/lib/utils'

export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface ShopItem {
  id: string
  name: string
  /** What it is: an outfit, an emote, a wrap. */
  type: string
  rarity: ShopRarity
  price: number
  /** The price before a discount, shown struck through. */
  originalPrice?: number
  image?: string
  /** Drawn on the item's art when there is no image. */
  icon?: React.ReactNode
}

export interface Shop01Labels {
  resetsIn: string
  balance: string
  featured: string
  daily: string
  buy: string
  owned: string
  notEnough: string
  rarity: Record<ShopRarity, string>
}

export interface Shop01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  /** When the shop rotates: a date, a timestamp or an ISO string. Default six hours from now. */
  resetsAt?: Date | number | string
  /** Credits the player has to spend. */
  balance?: number
  /** The currency's name, for screen readers. */
  currency?: string
  featured?: ShopItem | null
  items?: ShopItem[]
  /** Ids already owned. */
  owned?: string[]
  /**
   * Called when the player buys something. The block takes the price off the balance and marks
   * the item owned at once; charge for it here.
   */
  onBuy?: (item: ShopItem) => void
  labels?: Partial<Shop01Labels>
}

const defaultLabels: Shop01Labels = {
  resetsIn: 'Resets in',
  balance: 'Balance',
  featured: 'Featured',
  daily: 'Daily',
  buy: 'Buy',
  owned: 'Owned',
  notEnough: 'Not enough credits',
  rarity: { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
}

const defaultFeatured: ShopItem = {
  id: 'phantom',
  name: 'Phantom Drift',
  type: 'Car bundle',
  rarity: 'legendary',
  price: 1800,
  originalPrice: 2400,
  icon: <CarIcon />,
}

const defaultItems: ShopItem[] = [
  {
    id: 'specter',
    name: 'Specter',
    type: 'Outfit',
    rarity: 'epic',
    price: 1200,
    icon: <GhostIcon />,
  },
  {
    id: 'katana',
    name: 'Neon Katana',
    type: 'Melee',
    rarity: 'rare',
    price: 800,
    icon: <SwordIcon />,
  },
  {
    id: 'chrome',
    name: 'Liquid Chrome',
    type: 'Wrap',
    rarity: 'rare',
    price: 600,
    icon: <PaletteIcon />,
  },
  {
    id: 'liftoff',
    name: 'Liftoff',
    type: 'Emote',
    rarity: 'common',
    price: 300,
    icon: <RocketIcon />,
  },
  {
    id: 'crown',
    name: 'Pixel Crown',
    type: 'Banner',
    rarity: 'epic',
    price: 900,
    icon: <CrownIcon />,
  },
  {
    id: 'runner',
    name: 'Night Runner',
    type: 'Outfit',
    rarity: 'common',
    price: 500,
    icon: <ShirtIcon />,
  },
  {
    id: 'sparkle',
    name: 'Afterglow',
    type: 'Trail',
    rarity: 'legendary',
    price: 1500,
    icon: <SparklesIcon />,
  },
  {
    id: 'coins',
    name: 'Lucky Coin',
    type: 'Charm',
    rarity: 'common',
    price: 200,
    icon: <CoinsIcon />,
  },
]

/** The theme's chart colors stand in for the rarities, so they follow any theme. */
const rarityColor: Record<ShopRarity, string> = {
  common: 'var(--muted-foreground)',
  rare: 'var(--chart-1)',
  epic: 'var(--chart-4)',
  legendary: 'var(--chart-3)',
}

/** Corners cut at 45°: the shape of a game's menu rather than a web app's. */
const cut =
  '[clip-path:polygon(8px_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%,0_8px)]'

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
const clock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
}

/** The item's picture, or its icon on a glow in the color of its rarity. */
function Art({
  item,
  big = false,
  className,
}: {
  item: ShopItem
  big?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_60%,color-mix(in_oklab,var(--rarity)_45%,transparent),transparent_70%)]',
        className,
      )}
    >
      <Pattern variant="dots" className="text-(--rarity)/30" />
      {item.image ? (
        <img src={item.image} alt="" className="relative size-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'relative text-(--rarity) drop-shadow-[0_0_16px_var(--rarity)]',
            big ? '[&_svg]:size-24' : '[&_svg]:size-12',
          )}
        >
          {item.icon}
        </span>
      )}
    </div>
  )
}

function Price({ item, currency }: { item: ShopItem; currency: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold font-mono tabular-nums">
      <CoinsIcon aria-hidden="true" className="size-4 text-chart-3" />
      <span aria-hidden="true">{item.price.toLocaleString('en')}</span>
      <span className="sr-only">{`${item.price.toLocaleString('en')} ${currency}`}</span>
      {item.originalPrice !== undefined && (
        <del className="font-normal text-muted-foreground text-xs">
          {item.originalPrice.toLocaleString('en')}
        </del>
      )}
    </span>
  )
}

/**
 * A game's item shop: a featured item that tilts toward the pointer, the daily items by rarity,
 * the player's balance and a clock to the next rotation. Buying takes the price off at once.
 */
function Shop01({
  title = 'Item shop',
  resetsAt,
  balance: initialBalance = 2600,
  currency = 'credits',
  featured = defaultFeatured,
  items = defaultItems,
  owned: initialOwned = ['coins'],
  onBuy,
  labels: labelsProp,
  className,
  ...props
}: Shop01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const [end] = React.useState(() =>
    resetsAt === undefined ? Date.now() + 6 * 3600000 + 12 * 60000 : toTime(resetsAt),
  )
  const left = useCountdown(resetsAt === undefined ? end : toTime(resetsAt))
  const [balance, setBalance] = React.useState(initialBalance)
  const [owned, setOwned] = React.useState(() => new Set(initialOwned))

  const buy = (item: ShopItem) => {
    if (owned.has(item.id) || item.price > balance) return
    setBalance((b) => b - item.price)
    setOwned((set) => new Set(set).add(item.id))
    onBuy?.(item)
  }

  const action = (item: ShopItem, size: 'sm' | 'lg') => {
    const has = owned.has(item.id)
    const short = !has && item.price > balance
    return (
      <Button
        size={size}
        variant={has ? 'secondary' : 'default'}
        disabled={has || short}
        onClick={() => buy(item)}
        title={short ? labels.notEnough : undefined}
        className={cn('font-bold uppercase tracking-wider', cut, size === 'lg' && 'h-11 px-6')}
      >
        {has ? (
          <>
            <CheckIcon />
            {labels.owned}
          </>
        ) : (
          <>
            {labels.buy} <span className="sr-only">{item.name}</span>
          </>
        )}
      </Button>
    )
  }

  return (
    <section
      data-slot="block-shop-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id={`${id}-title`}
              className="font-black text-[clamp(2.25rem,7cqi,3.5rem)] uppercase italic leading-none tracking-tighter"
            >
              {title}
            </h2>
            <p className="mt-2 inline-flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
              <TimerIcon aria-hidden="true" className="size-3.5" />
              {labels.resetsIn}{' '}
              <span className="text-foreground tabular-nums" role="timer">
                {clock(left)}
              </span>
            </p>
          </div>
          <p
            className={cn(
              'inline-flex items-center gap-2 border border-chart-3/40 bg-chart-3/10 px-4 py-2 font-bold font-mono tabular-nums',
              cut,
            )}
          >
            <CoinsIcon aria-hidden="true" className="size-4 text-chart-3" />
            <span aria-hidden="true">{balance.toLocaleString('en')}</span>
            <span className="sr-only" aria-live="polite">
              {`${labels.balance}: ${balance.toLocaleString('en')} ${currency}`}
            </span>
          </p>
        </div>

        <div className="mt-8 grid gap-6 @3xl:grid-cols-[1.1fr_2fr]">
          {featured && (
            <div>
              <h3 className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.25em]">
                {labels.featured}
              </h3>
              <TiltCard max={8} className="h-full">
                <article
                  aria-label={featured.name}
                  style={{ '--rarity': rarityColor[featured.rarity] } as React.CSSProperties}
                  className="flex h-full flex-col overflow-hidden border border-(--rarity)/50 bg-card shadow-[0_0_48px_-16px_var(--rarity)]"
                >
                  <TiltCardItem depth={30} className="flex-1">
                    <Art item={featured} big className="h-full min-h-56" />
                  </TiltCardItem>
                  <div className="space-y-3 border-t p-5">
                    <p className="font-mono text-(--rarity) text-[11px] uppercase tracking-[0.25em]">
                      {labels.rarity[featured.rarity]} · {featured.type}
                    </p>
                    <p className="font-black text-2xl uppercase italic tracking-tight">
                      {featured.name}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <Price item={featured} currency={currency} />
                      {action(featured, 'lg')}
                    </div>
                  </div>
                </article>
              </TiltCard>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.25em]">
              {labels.daily}
            </h3>
            <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @5xl:grid-cols-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{ '--rarity': rarityColor[item.rarity] } as React.CSSProperties}
                  className="group flex flex-col overflow-hidden border border-b-2 border-b-(--rarity) bg-card transition-[border-color,box-shadow] hover:border-(--rarity)/60 hover:shadow-[0_0_24px_-10px_var(--rarity)]"
                >
                  <Art item={item} className="aspect-[4/3]" />
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="font-mono text-(--rarity) text-[10px] uppercase tracking-[0.2em]">
                      {labels.rarity[item.rarity]}
                    </p>
                    <p className="font-bold leading-tight">{item.name}</p>
                    <p className="text-muted-foreground text-xs">{item.type}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <Price item={item} currency={currency} />
                      {action(item, 'sm')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Shop01 }
