'use client'

import { BadgeCheck, BarChart2, Heart, MessageCircle, Repeat2 } from 'lucide-react'
import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useLabels, useLocale } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface TweetCardLabels {
  /** Label for reply action button. */
  reply: string
  /** Label for repost action button. */
  repost: string
  /** Label for like action button. */
  like: string
  /** Label for views metric count. */
  views: string
  /** Badge label for verified accounts. */
  verified: string
  /** Title for quoted tweet container. */
  quoted: string
}

export const defaultTweetCardLabels: TweetCardLabels = {
  reply: 'Reply',
  repost: 'Repost',
  like: 'Like',
  views: 'Views',
  verified: 'Verified account',
  quoted: 'Quoted tweet',
}

export type TweetToken =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; handle: string; href: string }
  | { type: 'hashtag'; value: string; tag: string; href: string }
  | { type: 'url'; value: string; href: string }

/**
 * Parses tweet plain text into tokens linking mentions, hashtags, and URLs.
 * Pure function with no dangerouslySetInnerHTML.
 */
export function tokenizeTweet(text: string): TweetToken[] {
  if (!text) return []
  const regex = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_]+)|(#[a-zA-Z0-9_\p{L}]+)/gu
  const tokens: TweetToken[] = []
  let lastIndex = 0
  let match = regex.exec(text)

  while (match !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const [full] = match
    if (full.startsWith('http://') || full.startsWith('https://')) {
      tokens.push({ type: 'url', value: full, href: full })
    } else if (full.startsWith('@')) {
      const handle = full.slice(1)
      tokens.push({ type: 'mention', value: full, handle, href: `https://x.com/${handle}` })
    } else if (full.startsWith('#')) {
      const tag = full.slice(1)
      tokens.push({ type: 'hashtag', value: full, tag, href: `https://x.com/hashtag/${tag}` })
    }
    lastIndex = regex.lastIndex
    match = regex.exec(text)
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens
}

export interface TweetAuthor {
  name: string
  handle: string
  avatar: string
  verified?: boolean
}

export interface TweetMedia {
  type: 'image' | 'video'
  src: string
  alt?: string
}

export interface TweetMetrics {
  replies?: number
  reposts?: number
  likes?: number
  views?: number
}

export interface TweetCardQuoteProps {
  author: TweetAuthor
  text: string
  createdAt?: Date | string
  media?: TweetMedia[]
}

export interface TweetCardProps extends React.ComponentProps<'article'> {
  /** Author details: name, handle, avatar image, and verified flag. */
  author: TweetAuthor
  /** Raw text of the post. Links, mentions and hashtags will be tokenized. */
  text: string
  /** Media items (1 to 4 images or videos). */
  media?: TweetMedia[]
  /** Optional nested quoted tweet. */
  quoted?: TweetCardQuoteProps
  /** Post timestamp as Date or ISO string. */
  createdAt: Date | string
  /** Engagement counts (replies, reposts, likes, views). */
  metrics?: TweetMetrics
  /** URL to the original post. */
  href?: string
  /** Custom logo slot in the top right corner. */
  icon?: React.ReactNode
}

function formatCompactNumber(num: number | undefined, locale?: string): string {
  if (num === undefined) return ''
  try {
    return new Intl.NumberFormat(locale || 'en', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num)
  } catch {
    return String(num)
  }
}

function formatTweetDate(date: Date | string, locale?: string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale || 'en', {
      month: 'short',
      day: 'numeric',
    }).format(d)
  } catch {
    return String(date)
  }
}

/** Renders tokenized tweet text safely without dangerouslySetInnerHTML. */
function TweetContent({ text }: { text: string }) {
  const tokens = React.useMemo(() => tokenizeTweet(text), [text])

  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground select-text">
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional slices of a single text
          return <span key={index}>{token.value}</span>
        }
        return (
          <a
            // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional slices of a single text
            key={index}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {token.value}
          </a>
        )
      })}
    </p>
  )
}

/** Renders 1 to 4 media items in an adaptive CSS grid. */
function MediaGrid({ media }: { media: TweetMedia[] }) {
  if (!media.length) return null

  const count = Math.min(media.length, 4)

  return (
    <div
      className={cn(
        'mt-3 grid gap-1.5 overflow-hidden rounded-xl border border-border/60 bg-muted/30',
        count === 1 && 'grid-cols-1',
        count === 2 && 'aspect-[16/9] grid-cols-2',
        count === 3 && 'aspect-[16/9] grid-cols-2',
        count === 4 && 'aspect-[16/9] grid-cols-2 grid-rows-2',
      )}
    >
      {media.slice(0, 4).map((item, idx) => {
        const isSpanned = count === 3 && idx === 0
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: media items are positional in the grid
            key={idx}
            className={cn('relative overflow-hidden bg-muted/40', isSpanned && 'row-span-2')}
          >
            {item.type === 'image' ? (
              <img
                src={item.src}
                alt={item.alt || ''}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              // biome-ignore lint/a11y/useMediaCaption: external tweet video without bundled captions
              <video src={item.src} controls playsInline className="h-full w-full object-cover" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Presentational tweet card with tokenized text, responsive media grid and engagement metrics.
 */
function TweetCard({
  author,
  text,
  media = [],
  quoted,
  createdAt,
  metrics,
  href,
  icon,
  className,
  ...props
}: TweetCardProps) {
  const labels = useLabels('tweet-card', defaultTweetCardLabels)
  const locale = useLocale()
  const ref = React.useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true })

  const handleClick = (e: React.MouseEvent) => {
    if (href && !(e.target as HTMLElement).closest('a, button')) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.key === 'Enter' || e.key === ' ') &&
      href &&
      !(e.target as HTMLElement).closest('a, button')
    ) {
      e.preventDefault()
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <article
      ref={ref}
      data-slot="tweet-card"
      tabIndex={href ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={href ? handleKeyDown : undefined}
      className={cn(
        'group/tweet relative w-full max-w-xl rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-all duration-200 hover:border-border/80 hover:shadow-md',
        'transition-opacity duration-500',
        inView ? 'opacity-100' : 'opacity-0',
        href &&
          'cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={author.avatar}
            alt={author.name}
            className="h-10 w-10 rounded-full object-cover bg-muted shrink-0"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1 font-semibold text-foreground text-sm truncate">
              <span className="truncate">{author.name}</span>
              {author.verified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-label={labels.verified}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <span className="truncate">@{author.handle}</span>
              <span>·</span>
              <time dateTime={typeof createdAt === 'string' ? createdAt : createdAt.toISOString()}>
                {formatTweetDate(createdAt, locale)}
              </time>
            </div>
          </div>
        </div>
        {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
      </div>

      {/* Tweet Body */}
      <div className="mt-3">
        <TweetContent text={text} />
        <MediaGrid media={media} />

        {/* Quoted Tweet */}
        {quoted && (
          <section
            className="mt-3 rounded-xl border border-border/70 p-3 bg-muted/20"
            aria-label={labels.quoted}
          >
            <div className="flex items-center gap-2">
              <img
                src={quoted.author.avatar}
                alt={quoted.author.name}
                className="h-5 w-5 rounded-full object-cover bg-muted shrink-0"
              />
              <span className="text-xs font-semibold text-foreground truncate">
                {quoted.author.name}
              </span>
              {quoted.author.verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">
                @{quoted.author.handle}
              </span>
              {quoted.createdAt && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTweetDate(quoted.createdAt, locale)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-foreground/90 whitespace-pre-wrap">{quoted.text}</p>
            {quoted.media && quoted.media.length > 0 && <MediaGrid media={quoted.media} />}
          </section>
        )}
      </div>

      {/* Engagement Metrics */}
      {metrics && (
        <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{labels.reply}: </span>
            <span>{formatCompactNumber(metrics.replies, locale)}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Repeat2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{labels.repost}: </span>
            <span>{formatCompactNumber(metrics.reposts, locale)}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Heart className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{labels.like}: </span>
            <span>{formatCompactNumber(metrics.likes, locale)}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <BarChart2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{labels.views}: </span>
            <span>{formatCompactNumber(metrics.views, locale)}</span>
          </div>
        </div>
      )}
    </article>
  )
}

/** Loading placeholder skeleton matching TweetCard dimensions. */
function TweetCardSkeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tweet-card-skeleton"
      className={cn(
        'w-full max-w-xl rounded-2xl border border-border bg-card p-4 shadow-xs animate-pulse',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-2.5 w-20 rounded bg-muted/70" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
      <div className="mt-4 h-32 rounded-xl bg-muted/60" />
      <div className="mt-4 flex justify-between border-t border-border/40 pt-2.5">
        <div className="h-3 w-8 rounded bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
      </div>
    </div>
  )
}

export { TweetCard, TweetCardSkeleton }
