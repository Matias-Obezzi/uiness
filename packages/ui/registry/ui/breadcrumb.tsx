'use client'

import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

export interface BreadcrumbLabels {
  /** Name of the navigation landmark. */
  nav: string
  /** Read out for a `BreadcrumbEllipsis`. */
  more: string
  /** Name of the button that opens the folded crumbs of `BreadcrumbTrail`. */
  showMore: (count: number) => string
}

export const defaultBreadcrumbLabels: BreadcrumbLabels = {
  nav: 'Breadcrumb',
  more: 'More',
  showMore: (count) => `Show ${count} more`,
}

function Breadcrumb({ 'aria-label': ariaLabel, ...props }: React.ComponentProps<'nav'>) {
  const labels = useLabels('breadcrumb', defaultBreadcrumbLabels)
  return <nav data-slot="breadcrumb" aria-label={ariaLabel ?? labels.nav} {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm sm:gap-2.5',
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex min-w-0 items-center gap-1.5', className)}
      {...props}
    />
  )
}

export interface BreadcrumbLinkProps extends React.ComponentProps<'a'> {
  /** Render the child element, such as your router's link, instead of an `<a>`. */
  asChild?: boolean
}

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        'rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

/** The page you are on. Not a link, and announced as the current page. */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('truncate font-normal text-foreground', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  const labels = useLabels('breadcrumb', defaultBreadcrumbLabels)
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">{labels.more}</span>
    </span>
  )
}

export interface BreadcrumbTrailItem {
  /** What the crumb says. */
  label: React.ReactNode
  /** Where it goes. Leave it out for a crumb that is not a page of its own. */
  href?: string
  /** Shown before the label, in the trail and in the menu. */
  icon?: React.ReactNode
  /** A stable key when two labels could be the same. Defaults to `href` or the position. */
  id?: string
}

export interface BreadcrumbTrailProps extends Omit<React.ComponentProps<'nav'>, 'children'> {
  /** From the root to the current page. The last one is the page you are on. */
  items: BreadcrumbTrailItem[]
  /**
   * The most crumbs shown before the middle ones fold into a menu. The trail also folds more of
   * them when it is wider than its container. Default 4.
   */
  maxItems?: number
  /** Crumbs always kept at the start when folding. Default 1. */
  itemsBeforeCollapse?: number
  /** Crumbs kept at the end when folding, the current page included. Default 2. */
  itemsAfterCollapse?: number
  /** Fold more crumbs while the trail would overflow its container. Default true. */
  fit?: boolean
  /** Replaces the chevron between crumbs. */
  separator?: React.ReactNode
  /**
   * Renders a link, for your router. It gets the destination and the content, and the element it
   * returns receives the styles and handlers. Defaults to an `<a>`.
   */
  renderLink?: (link: { href: string; children: React.ReactNode }) => React.ReactElement
  /** Names the folded crumbs menu button. Default "Show {n} more". */
  moreLabel?: (count: number) => string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<BreadcrumbLabels>
}

const defaultRenderLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href}>{children}</a>
)

/**
 * Which crumbs show: the first `head`, then a fold, then the last `tail`. A `tail` of 0 means
 * every crumb. Each `step` folds one more crumb, for when the trail is too wide.
 */
function plan(count: number, max: number, before: number, after: number, step: number) {
  if (count <= max && step === 0) return { head: count, tail: 0 }
  const head = Math.max(0, Math.min(before, count - 1))
  const room = count - head
  const tail = count <= max ? room - step : Math.min(after, room - 1) - step
  return { head, tail: Math.max(1, tail) }
}

/**
 * A trail from a list of pages. When there are more than `maxItems`, or when they do not fit on
 * one line, the middle ones fold into a menu behind an ellipsis button, so the first crumb and
 * the current page always stay in view.
 */
function BreadcrumbTrail({
  items,
  maxItems = 4,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  fit = true,
  separator,
  renderLink = defaultRenderLink,
  moreLabel,
  labels: labelsProp,
  className,
  ...props
}: BreadcrumbTrailProps) {
  const labels = useLabels('breadcrumb', defaultBreadcrumbLabels, labelsProp)
  const listRef = React.useRef<HTMLOListElement>(null)
  const measureRef = React.useRef<HTMLOListElement>(null)
  // How many more crumbs to fold, past what `maxItems` already folds, to fit the width.
  const [step, setStep] = React.useState(0)
  const count = items.length

  React.useLayoutEffect(() => {
    const list = listRef.current
    const measure = measureRef.current
    if (!fit || !list || !measure || typeof ResizeObserver === 'undefined') return
    const container = list.parentElement ?? list
    const compute = () => {
      const available = container.clientWidth
      const widths = Array.from(measure.children, (el) => (el as HTMLElement).offsetWidth)
      // The measuring list holds every crumb, then a separator, then the fold button.
      const sep = widths[count] ?? 0
      const fold = widths[count + 1] ?? 0
      if (available === 0) return setStep(0)
      const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0
      let next = 0
      for (;;) {
        const { head, tail } = plan(count, maxItems, itemsBeforeCollapse, itemsAfterCollapse, next)
        const shown =
          tail === 0
            ? widths.slice(0, count)
            : [...widths.slice(0, head), fold, ...widths.slice(count - tail, count)]
        const total = shown.reduce((sum, w) => sum + w, 0) + (shown.length - 1) * (sep + gap * 2)
        if (total <= available || (tail === 1 && next > 0)) break
        next++
      }
      setStep(next)
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    return () => observer.disconnect()
  }, [fit, count, maxItems, itemsBeforeCollapse, itemsAfterCollapse])

  const layout = plan(count, maxItems, itemsBeforeCollapse, itemsAfterCollapse, fit ? step : 0)
  const head = layout.tail === 0 ? count : layout.head
  const tail = layout.tail
  const hidden = items.slice(head, count - tail)
  const keyOf = (item: BreadcrumbTrailItem, index: number) => item.id ?? item.href ?? String(index)

  const crumb = (item: BreadcrumbTrailItem, index: number) => {
    const content = (
      <>
        {item.icon}
        <span className="truncate">{item.label}</span>
      </>
    )
    if (index === count - 1) {
      return <BreadcrumbPage className="inline-flex items-center gap-1.5">{content}</BreadcrumbPage>
    }
    if (!item.href)
      return <span className="inline-flex min-w-0 items-center gap-1.5">{content}</span>
    return (
      <BreadcrumbLink asChild className="inline-flex min-w-0 items-center gap-1.5">
        {renderLink({ href: item.href, children: content })}
      </BreadcrumbLink>
    )
  }

  const shown = [
    ...items.slice(0, head).map((item, i) => ({ item, index: i })),
    ...(hidden.length > 0 ? [null] : []),
    ...items.slice(count - tail).map((item, i) => ({ item, index: count - tail + i })),
  ]

  return (
    <Breadcrumb
      data-slot="breadcrumb-trail"
      aria-label={labels.nav}
      className={cn('relative min-w-0', className)}
      {...props}
    >
      <BreadcrumbList ref={listRef} className="flex-nowrap">
        {shown.map((entry, i) => (
          <React.Fragment key={entry ? keyOf(entry.item, entry.index) : 'fold'}>
            {i > 0 && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
            <BreadcrumbItem className={entry && entry.index === count - 1 ? 'min-w-0' : 'shrink-0'}>
              {entry ? (
                crumb(entry.item, entry.index)
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={(moreLabel ?? labels.showMore)(hidden.length)}
                    className="flex size-7 items-center justify-center rounded-md outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {hidden.map((item, j) => (
                      <DropdownMenuItem
                        key={keyOf(item, head + j)}
                        asChild={Boolean(item.href)}
                        disabled={!item.href}
                      >
                        {item.href ? (
                          renderLink({
                            href: item.href,
                            children: (
                              <>
                                {item.icon}
                                {item.label}
                              </>
                            ),
                          })
                        ) : (
                          <span>
                            {item.icon}
                            {item.label}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
      {fit && (
        // Every crumb at its natural width, out of sight and clipped so it never widens the
        // page, so the trail knows what fits before it folds anything.
        <div
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
        >
          <BreadcrumbList ref={measureRef} className="w-max flex-nowrap whitespace-nowrap">
            {items.map((item, index) => (
              <BreadcrumbItem key={keyOf(item, index)} className="shrink-0">
                {item.icon}
                <span>{item.label}</span>
              </BreadcrumbItem>
            ))}
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            <BreadcrumbItem className="size-7 shrink-0" />
          </BreadcrumbList>
        </div>
      )}
    </Breadcrumb>
  )
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
}
