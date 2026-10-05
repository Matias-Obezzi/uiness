'use client'

import {
  BookOpenIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  GlobeIcon,
  type LucideIcon,
  MessagesSquareIcon,
  PlusIcon,
  ScaleIcon,
  StarIcon,
  TagIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Odometer } from '@/ui/odometer'
import { Tabs, TabsList, TabsTrigger } from '@/ui/tabs'

export interface PageHeaderTab {
  id: string
  label: string
  icon?: LucideIcon
  /** A number beside the label. It rolls to its new value when it changes. */
  count?: number
}

export interface PageHeaderAction {
  label: string
  icon?: LucideIcon
  href?: string
  onClick?: () => void
  /** The main action stays in the folded bar. Use it on one action. */
  primary?: boolean
}

export interface PageHeaderContext {
  /** The tab that is open. */
  tab: string
  /** The current counts, by tab id. */
  counts: Record<string, number>
  /** Change a tab's count from the content, like after closing an issue. */
  setCount: (tab: string, count: number | ((count: number) => number)) => void
}

export interface PageHeaderLabels {
  star: string
  starred: string
  breadcrumb: string
  tabs: string
}

export interface PageHeader01Props
  extends Omit<React.ComponentProps<'section'>, 'title' | 'children'> {
  /** The trail above the title. An empty list hides it. */
  breadcrumbs?: { label: string; href: string }[]
  title?: string
  description?: React.ReactNode | null
  /** A badge beside the title, like `Public`. `null` hides it. */
  status?: string | null
  /** Small facts under the description. */
  meta?: { icon?: LucideIcon; label: string }[]
  /** A star button with a count that rolls when pressed. `null` hides it. */
  star?: { count: number; starred?: boolean; onChange?: (starred: boolean) => void } | null
  actions?: PageHeaderAction[]
  tabs?: PageHeaderTab[]
  /** The open tab, when you control it. */
  value?: string
  defaultValue?: string
  onValueChange?: (tab: string) => void
  /**
   * Give the block a scroll box of this height, with the header folding inside it. `null`
   * leaves scrolling to the page, and the bar sticks to the top of the window.
   */
  height?: string | null
  /** Distance from the top where the folded bar sticks, for pages with a fixed navbar. */
  stickyOffset?: number
  labels?: Partial<PageHeaderLabels>
  /** What sits under the tabs. A function gets the open tab and a way to change counts. */
  children?: React.ReactNode | ((context: PageHeaderContext) => React.ReactNode)
}

const defaultTabs: PageHeaderTab[] = [
  { id: 'overview', label: 'Overview', icon: BookOpenIcon },
  { id: 'issues', label: 'Issues', icon: CircleDotIcon, count: 6 },
  { id: 'pulls', label: 'Pull requests', icon: GitPullRequestIcon, count: 3 },
  { id: 'discussions', label: 'Discussions', icon: MessagesSquareIcon, count: 12 },
  { id: 'releases', label: 'Releases', icon: TagIcon, count: 28 },
]

const defaultMeta = [
  { icon: GlobeIcon, label: 'northwind.dev' },
  { icon: ScaleIcon, label: 'MIT license' },
  { icon: GitBranchIcon, label: 'main' },
  { icon: ClockIcon, label: 'Updated 2 hours ago' },
]

const defaultLabels: PageHeaderLabels = {
  star: 'Star',
  starred: 'Starred',
  breadcrumb: 'Breadcrumb',
  tabs: 'Project sections',
}

const defaultActions: PageHeaderAction[] = [{ label: 'New issue', icon: PlusIcon, primary: true }]

/**
 * A project header: breadcrumbs, a title with a status, a line about it, small facts, a star
 * button and actions, over tabs with counts. Scroll past the title and the tab bar keeps to
 * the top, picking up a small title and the main action, so the page stays navigable. Counts
 * roll to their new value whenever they change. Works inside its own scroll box or the page.
 */
function PageHeader01({
  breadcrumbs = [
    { label: 'Northwind', href: '#' },
    { label: 'Projects', href: '#' },
  ],
  title = 'atlas',
  description = 'The design system and component library behind every Northwind product.',
  status = 'Public',
  meta = defaultMeta,
  star = { count: 1284 },
  actions = defaultActions,
  tabs = defaultTabs,
  value: valueProp,
  defaultValue,
  onValueChange,
  height = '36rem',
  stickyOffset = 0,
  labels: labelsProp,
  children,
  className,
  style,
  ...props
}: PageHeader01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const scrollRef = React.useRef<HTMLElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const [folded, setFolded] = React.useState(false)
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? tabs[0]?.id ?? '')
  const tab = valueProp ?? uncontrolled
  const setTab = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  // Counts follow the props, and the content may move them in between. The string stands in
  // for the tabs so a new array with the same counts does not reset them.
  const countsKey = JSON.stringify(
    Object.fromEntries(tabs.filter((t) => t.count !== undefined).map((t) => [t.id, t.count])),
  )
  const [counts, setCounts] = React.useState<Record<string, number>>(() => JSON.parse(countsKey))
  React.useEffect(() => setCounts(JSON.parse(countsKey)), [countsKey])
  const setCount = React.useCallback<PageHeaderContext['setCount']>((id, next) => {
    setCounts((prev) => ({
      ...prev,
      [id]: typeof next === 'function' ? next(prev[id] ?? 0) : next,
    }))
  }, [])

  const [starred, setStarred] = React.useState(star?.starred ?? false)
  const starCount = (star?.count ?? 0) - (star?.starred ? 1 : 0) + (starred ? 1 : 0)

  // The title has left when the line under it passes under the bar. Observed against the
  // block's own scroll box when it has one, the window otherwise.
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const bar = barRef.current?.offsetHeight ?? 48
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Out of view below the fold is not the same as scrolled past: only the latter folds.
        if (entry)
          setFolded(
            !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
          )
      },
      {
        root: height ? scrollRef.current : null,
        rootMargin: `-${bar + stickyOffset}px 0px 0px 0px`,
      },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [height, stickyOffset])

  const primary = actions.find((a) => a.primary)
  const renderAction = (action: PageHeaderAction, compact = false) => {
    const Icon = action.icon
    const content = (
      <>
        {Icon && <Icon aria-hidden />}
        {action.label}
      </>
    )
    const variant = action.primary ? 'default' : 'outline'
    const size = compact ? 'sm' : 'default'
    return action.href ? (
      <Button key={action.label} asChild variant={variant} size={size}>
        <a href={action.href}>{content}</a>
      </Button>
    ) : (
      <Button key={action.label} variant={variant} size={size} onClick={action.onClick}>
        {content}
      </Button>
    )
  }

  const body =
    typeof children === 'function' ? (
      children({ tab, counts, setCount })
    ) : children === undefined ? (
      <DemoContent tab={tab} counts={counts} setCount={setCount} />
    ) : (
      children
    )

  return (
    <section
      ref={scrollRef}
      data-slot="block-page-header-01"
      data-folded={folded ? '' : undefined}
      aria-labelledby={headingId}
      className={cn(
        '@container relative w-full',
        height && 'overflow-y-auto overscroll-contain',
        className,
      )}
      style={height ? { height, ...style } : style}
      {...props}
    >
      <header className="mx-auto max-w-6xl px-6 pt-8 @3xl:pt-12">
        {breadcrumbs.length > 0 && (
          <nav aria-label={labels.breadcrumb} className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-muted-foreground text-sm">
              {breadcrumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  <a
                    href={crumb.href}
                    className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {crumb.label}
                  </a>
                  <ChevronRightIcon aria-hidden className="size-3.5 opacity-60" />
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-start @3xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60 font-semibold text-lg text-primary-foreground uppercase shadow-sm"
              >
                {title.charAt(0)}
              </span>
              <h1 id={headingId} className="text-title">
                {title}
              </h1>
              {status && (
                <span className="rounded-full border px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
                  {status}
                </span>
              )}
            </div>
            {description != null && (
              <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{description}</p>
            )}
            {meta.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-sm">
                {meta.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-1.5">
                    {Icon && <Icon aria-hidden className="size-4" />}
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {star && (
              <Button
                variant="outline"
                aria-pressed={starred}
                onClick={() => {
                  setStarred(!starred)
                  star.onChange?.(!starred)
                }}
                className="group/star gap-0 overflow-hidden p-0 has-[>svg]:p-0"
              >
                <span className="flex items-center gap-2 px-3">
                  <StarIcon
                    aria-hidden
                    className={cn(
                      'transition-[color,fill,scale] duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) group-active/star:scale-75',
                      starred && 'fill-amber-400 text-amber-400',
                    )}
                  />
                  {starred ? labels.starred : labels.star}
                </span>
                <span className="flex h-full items-center border-l bg-muted/50 px-3 tabular-nums">
                  <Odometer value={starCount} duration={600} />
                </span>
              </Button>
            )}
            {actions.map((action) => renderAction(action))}
          </div>
        </div>
      </header>
      <div ref={sentinelRef} aria-hidden className="h-px" />

      <div
        ref={barRef}
        data-slot="page-header-bar"
        className={cn(
          'sticky z-(--z-sticky,40) mt-6 border-b bg-background/85 backdrop-blur-md transition-shadow duration-(--duration-normal,200ms)',
          folded && 'shadow-sm',
        )}
        style={{ top: stickyOffset }}
      >
        <div className="mx-auto flex max-w-6xl items-center px-6">
          <div
            aria-hidden={!folded}
            className={cn(
              'flex min-w-0 shrink-0 items-center gap-2 overflow-hidden pr-3 transition-[max-width,opacity,translate] duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none',
              folded ? 'max-w-48 translate-x-0 opacity-100' : 'max-w-0 -translate-x-2 opacity-0',
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs uppercase">
              {title.charAt(0)}
            </span>
            <span className="truncate font-semibold text-sm">{title}</span>
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="min-w-0 flex-1 gap-0">
            <TabsList
              aria-label={labels.tabs}
              className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none]"
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="relative h-12 flex-none rounded-none border-0 px-3 text-muted-foreground shadow-none after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-(--duration-normal,200ms) hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:scale-x-100 dark:data-[state=active]:border-0 dark:data-[state=active]:bg-transparent"
                >
                  {Icon && <Icon aria-hidden />}
                  {label}
                  {counts[id] !== undefined && (
                    <span className="rounded-full bg-muted px-1.5 py-px font-medium text-muted-foreground text-xs">
                      <Odometer value={counts[id] ?? 0} duration={600} />
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {primary && (
            <div
              aria-hidden={!folded}
              inert={!folded}
              className={cn(
                'ml-3 hidden shrink-0 transition-[opacity,translate] duration-(--duration-slow,300ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none @2xl:block',
                folded
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-1 opacity-0',
              )}
            >
              {renderAction(primary, true)}
            </div>
          )}
        </div>
      </div>

      {/* In its own scroll box, short content still leaves room to scroll the title away, so
          switching tabs never snaps the header open again. */}
      <div className={cn('mx-auto max-w-6xl px-6 py-8', height && 'min-h-full')}>{body}</div>
    </section>
  )
}

const demoIssues = [
  { id: 1, title: 'Tooltip flickers when moving between two triggers', label: 'bug' },
  { id: 2, title: 'Add a compact density to the table', label: 'enhancement' },
  { id: 3, title: 'Dark mode borders too faint on cards', label: 'design' },
  { id: 4, title: 'Combobox loses focus after clearing', label: 'bug' },
  { id: 5, title: 'Document the motion tokens', label: 'docs' },
  { id: 6, title: 'Drawer snap points on landscape phones', label: 'bug' },
]

/** Something to scroll through in the preview, with issues you can close to see a count roll. */
function DemoContent({ tab, setCount }: PageHeaderContext) {
  const [open, setOpen] = React.useState(demoIssues)
  if (tab !== 'issues') {
    return (
      <div className="grid gap-3 @2xl:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: placeholders without identity
            key={i}
            className="flex flex-col gap-2.5 rounded-xl border bg-card p-4"
          >
            <span className="h-3 w-2/5 rounded-full bg-muted" />
            <span className="h-2.5 w-full rounded-full bg-muted/70" />
            <span className="h-2.5 w-4/5 rounded-full bg-muted/70" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {open.map((issue) => (
        <li key={issue.id} className="flex items-center gap-3 px-4 py-3">
          <CircleDotIcon
            aria-hidden
            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
          <span className="hidden rounded-full border px-2 py-0.5 text-muted-foreground text-xs @md:inline">
            {issue.label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen((list) => list.filter((i) => i.id !== issue.id))
              setCount('issues', (count) => Math.max(0, count - 1))
            }}
          >
            Close
          </Button>
        </li>
      ))}
      {open.length === 0 && (
        <li className="px-4 py-10 text-center text-muted-foreground text-sm">
          All caught up. Nothing open.
        </li>
      )}
    </ul>
  )
}

export { PageHeader01 }
