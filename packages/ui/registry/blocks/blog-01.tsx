'use client'

import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

export interface BlogAuthor {
  name: string
  role?: string
  image?: string
}

export interface BlogPost {
  /** Unique, used as the key and passed to `onOpenPost`. */
  slug: string
  title: string
  excerpt: string
  category: string
  /** ISO day, like `2026-09-24`. */
  date: string
  /** Minutes, shown as `6 min read`. */
  readingTime?: number
  author: BlogAuthor
  /** A cover picture. Without one the card gets a soft gradient in the category's colour. */
  image?: { src: string; alt: string }
  /** The article, shown in the reader. Without it the reader shows the excerpt. */
  body?: React.ReactNode
  /** Lead the page with this post while no filter is on. The first featured post wins. */
  featured?: boolean
}

export interface BlogLabels {
  all: string
  filter: string
  featured: string
  /** `{minutes}` is replaced. */
  readingTime: string
  read: string
  previous: string
  next: string
  /** `{page}` and `{pages}` are replaced. */
  page: string
  pagination: string
  empty: string
  close: string
}

export interface Blog01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** Newest first. */
  posts?: BlogPost[]
  /** Cards per page, after the featured post. Default 6. */
  perPage?: number
  /** Called when a post opens in the reader, for analytics or to update the address. */
  onOpenPost?: (slug: string) => void
  /** Locale for dates. Defaults to the browser's. */
  locale?: string
  labels?: Partial<BlogLabels>
}

const paragraphs = (...lines: string[]) => (
  <>
    {lines.map((line) => (
      <p key={line.slice(0, 24)}>{line}</p>
    ))}
  </>
)

const defaultPosts: BlogPost[] = [
  {
    slug: 'designing-the-second-visit',
    title: 'Designing for the second visit',
    excerpt:
      'First impressions get the attention, but the second visit is where a product earns a habit. Here is what we changed once we started watching it.',
    category: 'Design',
    date: '2026-09-24',
    readingTime: 7,
    author: { name: 'Maya Okafor', role: 'Head of Product' },
    featured: true,
    body: paragraphs(
      'Most onboarding work goes into the first five minutes. We did the same, until we looked at what happened the day after: people came back, looked for the thing they had made, and could not find it.',
      'So we moved recent work to the top of every empty screen, kept the last view you used, and stopped showing tips to people who had already acted on them. Returning users went up by a fifth in a month.',
      'The lesson was not about any one feature. A product is used far more often than it is discovered, and the second visit is where that starts.',
    ),
  },
  {
    slug: 'postgres-to-the-edge',
    title: 'Taking Postgres to the edge, carefully',
    excerpt: 'How we cut read latency in half without giving up a single strong guarantee.',
    category: 'Engineering',
    date: '2026-09-17',
    readingTime: 11,
    author: { name: 'Tomás Rivera', role: 'Staff Engineer' },
    body: paragraphs(
      'Read replicas close to users sound simple until a user writes something and reads it back a moment later from a replica that has not caught up.',
      'We tag each session with the log position of its last write and route reads to replicas that have reached it, falling back to the primary when none have. Most reads never notice.',
    ),
  },
  {
    slug: 'saved-views',
    title: 'Saved views are here',
    excerpt: 'Name a filter, share it with a link, and pin it to the sidebar.',
    category: 'Product',
    date: '2026-09-10',
    readingTime: 3,
    author: { name: 'Lena Fischer', role: 'Product Manager' },
  },
  {
    slug: 'writing-errors',
    title: 'Error messages people actually read',
    excerpt: 'Say what happened, say what to do, and never blame the person reading it.',
    category: 'Design',
    date: '2026-09-03',
    readingTime: 5,
    author: { name: 'Sam Lee', role: 'Content Designer' },
  },
  {
    slug: 'on-call',
    title: 'An on-call rotation people do not dread',
    excerpt: 'Fewer pages, clearer runbooks, and a rule that every page gets a follow-up.',
    category: 'Engineering',
    date: '2026-08-27',
    readingTime: 8,
    author: { name: 'Priya Natarajan', role: 'SRE Lead' },
  },
  {
    slug: 'customer-fieldnote',
    title: 'How Quillfeather plans a quarter in one afternoon',
    excerpt: 'Three teams, one board, and a Monday meeting they no longer need.',
    category: 'Customers',
    date: '2026-08-20',
    readingTime: 6,
    author: { name: 'Maya Okafor', role: 'Head of Product' },
  },
  {
    slug: 'keyboard-first',
    title: 'Keyboard first, mouse friendly',
    excerpt: 'Every action has a shortcut now, and you can change all of them.',
    category: 'Product',
    date: '2026-08-13',
    readingTime: 4,
    author: { name: 'Lena Fischer', role: 'Product Manager' },
  },
  {
    slug: 'type-scale',
    title: 'A type scale that survives real content',
    excerpt: 'Fluid sizes, sensible line heights, and why we stopped at seven steps.',
    category: 'Design',
    date: '2026-08-06',
    readingTime: 6,
    author: { name: 'Sam Lee', role: 'Content Designer' },
  },
  {
    slug: 'search-index',
    title: 'Rebuilding search, one shard at a time',
    excerpt: 'A new index that updates as you type, migrated without downtime.',
    category: 'Engineering',
    date: '2026-07-30',
    readingTime: 9,
    author: { name: 'Tomás Rivera', role: 'Staff Engineer' },
  },
]

const defaultLabels: BlogLabels = {
  all: 'All',
  filter: 'Filter by category',
  featured: 'Featured',
  readingTime: '{minutes} min read',
  read: 'Read article',
  previous: 'Previous',
  next: 'Next',
  page: 'Page {page} of {pages}',
  pagination: 'Pages',
  empty: 'No posts in this category yet.',
  close: 'Close article',
}

/** Covers without a picture take a gradient from the chart colours, one per category. */
const covers = [
  'from-chart-1/60 via-chart-2/30 to-transparent',
  'from-chart-2/60 via-chart-3/30 to-transparent',
  'from-chart-3/60 via-chart-4/30 to-transparent',
  'from-chart-4/60 via-chart-5/30 to-transparent',
  'from-chart-5/60 via-chart-1/30 to-transparent',
]

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))

const toDay = (iso: string) => {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

/**
 * A blog index: a featured post up top, chips to filter by category, a grid of cards that
 * pages through, and a reader that slides in from the side when a card is opened, so people
 * can read without leaving the list. One column when narrow, up to three when wide.
 */
function Blog01({
  eyebrow = 'Blog',
  title = 'Notes from the team',
  description = 'Product updates, engineering deep dives and the occasional opinion.',
  posts = defaultPosts,
  perPage = 6,
  onOpenPost,
  locale,
  labels: labelsProp,
  className,
  ...props
}: Blog01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const [category, setCategory] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(0)
  const [reading, setReading] = React.useState<BlogPost | null>(null)
  const [readerOpen, setReaderOpen] = React.useState(false)

  const categories = React.useMemo(() => [...new Set(posts.map((p) => p.category))], [posts])
  const coverOf = (name: string) =>
    covers[Math.max(0, categories.indexOf(name)) % covers.length] ?? covers[0]
  const dateFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
    [locale],
  )

  const featured = category ? undefined : posts.find((p) => p.featured)
  const list = posts.filter((p) => p !== featured && (!category || p.category === category))
  const pages = Math.max(1, Math.ceil(list.length / perPage))
  const current = Math.min(page, pages - 1)
  const shown = list.slice(current * perPage, current * perPage + perPage)

  const open = (post: BlogPost) => {
    setReading(post)
    setReaderOpen(true)
    onOpenPost?.(post.slug)
  }
  const goTo = (next: number) => {
    setPage(next)
    // Back to the top of the list, not of the page, so the new cards are in view.
    const el = gridRef.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
  }

  const meta = (post: BlogPost) => (
    <div className="flex items-center gap-3 text-caption text-muted-foreground">
      <Avatar className="size-7">
        {post.author.image && <AvatarImage src={post.author.image} alt="" />}
        <AvatarFallback className="text-[0.65rem]">{initials(post.author.name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate">
        <span className="font-medium text-foreground">{post.author.name}</span>
        {' · '}
        <time dateTime={post.date}>{dateFormat.format(toDay(post.date))}</time>
      </span>
    </div>
  )

  return (
    <section
      data-slot="block-blog-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
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

        {featured && (
          <article className="group/post relative mt-12 grid overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-lg @3xl:grid-cols-2">
            <Cover post={featured} gradient={coverOf(featured.category)} large />
            <div className="flex flex-col p-6 @md:p-8 @3xl:p-10">
              <div className="flex items-center gap-2">
                <Badge>{labels.featured}</Badge>
                <Badge variant="outline">{featured.category}</Badge>
              </div>
              <h3 className="mt-5 text-balance text-heading @3xl:text-title">
                <button
                  type="button"
                  onClick={() => open(featured)}
                  className="text-left outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                >
                  {featured.title}
                </button>
              </h3>
              <p className="mt-3 text-pretty text-muted-foreground">{featured.excerpt}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                {meta(featured)}
                <span className="inline-flex items-center gap-1 font-medium text-sm">
                  {labels.read}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-4 transition-transform duration-(--duration-fast,150ms) group-hover/post:translate-x-0.5"
                  />
                </span>
              </div>
            </div>
          </article>
        )}

        <div ref={gridRef} className="mt-12 scroll-mt-24">
          {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring a border and a legend to undo */}
          <div role="group" aria-label={labels.filter} className="flex flex-wrap gap-2">
            {[null, ...categories].map((name) => {
              const pressed = category === name
              return (
                <button
                  key={name ?? '*'}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => {
                    setCategory(name)
                    setPage(0)
                  }}
                  className={cn(
                    'h-8 rounded-full border px-3.5 font-medium text-sm outline-none transition-colors duration-(--duration-fast,150ms) focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    pressed
                      ? 'border-foreground bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {name ?? labels.all}
                </button>
              )
            })}
          </div>

          {shown.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed px-6 py-12 text-center text-muted-foreground">
              {labels.empty}
            </p>
          ) : (
            <ul
              key={`${category}:${current}`}
              className="mt-8 grid gap-6 @xl:grid-cols-2 @4xl:grid-cols-3"
            >
              {shown.map((post, i) => (
                <li
                  key={post.slug}
                  className="fill-mode-backwards duration-(--duration-slow,300ms) animate-in fade-in-0 slide-in-from-bottom-3 motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <article className="group/post relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-[box-shadow,translate] duration-(--duration-normal,200ms) hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none">
                    <Cover post={post} gradient={coverOf(post.category)} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2 text-caption text-muted-foreground">
                        <span className="font-medium text-foreground">{post.category}</span>
                        {post.readingTime && (
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon aria-hidden className="size-3" />
                            {fill(labels.readingTime, { minutes: post.readingTime })}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-balance font-semibold text-lg leading-snug">
                        <button
                          type="button"
                          onClick={() => open(post)}
                          className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                        >
                          {post.title}
                        </button>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-pretty text-muted-foreground text-sm">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-5">{meta(post)}</div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav
              aria-label={labels.pagination}
              className="mt-10 flex items-center justify-between gap-4"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={current === 0}
                onClick={() => goTo(current - 1)}
              >
                <ChevronLeftIcon aria-hidden />
                {labels.previous}
              </Button>
              <ol className="hidden items-center gap-1 @md:flex">
                {Array.from({ length: pages }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: pages are their index
                  <li key={i}>
                    <Button
                      variant={i === current ? 'secondary' : 'ghost'}
                      size="sm"
                      aria-current={i === current ? 'page' : undefined}
                      onClick={() => goTo(i)}
                      className="min-w-8 tabular-nums"
                    >
                      {i + 1}
                    </Button>
                  </li>
                ))}
              </ol>
              <span className="text-muted-foreground text-sm tabular-nums @md:hidden">
                {fill(labels.page, { page: current + 1, pages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pages - 1}
                onClick={() => goTo(current + 1)}
              >
                {labels.next}
                <ChevronRightIcon aria-hidden />
              </Button>
            </nav>
          )}
        </div>
      </div>

      <Drawer open={readerOpen} onOpenChange={setReaderOpen}>
        <DrawerContent
          side="right"
          showCloseButton={false}
          className="w-[min(42rem,100vw)] max-w-none"
        >
          {reading && (
            <DrawerBody className="px-0 pb-10">
              <article>
                <Cover
                  post={reading}
                  gradient={coverOf(reading.category)}
                  className="aspect-[21/9] h-auto min-h-0"
                />
                <div className="px-6 pt-6">
                  <Badge variant="outline">{reading.category}</Badge>
                  <DrawerTitle className="mt-4 text-balance font-bold text-2xl leading-tight tracking-tight">
                    {reading.title}
                  </DrawerTitle>
                  <DrawerDescription className="mt-3 text-pretty text-base">
                    {reading.excerpt}
                  </DrawerDescription>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-6">
                    {meta(reading)}
                    {reading.readingTime && (
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <ClockIcon aria-hidden className="size-3" />
                        {fill(labels.readingTime, { minutes: reading.readingTime })}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col gap-4 text-pretty text-body leading-relaxed">
                    {reading.body ?? <p>{reading.excerpt}</p>}
                  </div>
                </div>
              </article>
            </DrawerBody>
          )}
          <DrawerClose className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border bg-background/80 shadow-sm outline-none backdrop-blur transition-colors hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <XIcon aria-hidden className="size-4" />
            <span className="sr-only">{labels.close}</span>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </section>
  )
}

function Cover({
  post,
  gradient,
  large,
  className,
}: {
  post: BlogPost
  gradient: string | undefined
  large?: boolean
  className?: string
}) {
  if (post.image)
    return (
      <img
        src={post.image.src}
        alt={post.image.alt}
        className={cn(
          'w-full object-cover',
          large ? 'aspect-[16/9] h-full' : 'aspect-[16/9]',
          className,
        )}
      />
    )
  return (
    <div
      aria-hidden
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        large ? 'aspect-[16/9] h-full min-h-48' : 'aspect-[16/9]',
        className,
      )}
    >
      <div className={cn('absolute inset-0 bg-linear-to-br', gradient)} />
      <span className="absolute right-4 bottom-2 select-none font-bold text-7xl text-foreground/5 tracking-tighter">
        {post.category.charAt(0)}
      </span>
    </div>
  )
}

export { Blog01 }
