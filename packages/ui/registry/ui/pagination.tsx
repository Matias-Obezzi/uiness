'use client'

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/utils'
import { type Button, buttonVariants } from '@/ui/button'

function Pagination({
  className,
  'aria-label': label = 'Pagination',
  ...props
}: React.ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="pagination"
      aria-label={label}
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem(props: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

export interface PaginationLinkProps
  extends React.ComponentProps<'a'>,
    Pick<React.ComponentProps<typeof Button>, 'size'> {
  /** The page being shown. Highlighted and announced as the current page. */
  isActive?: boolean
  /** Render the child element, such as a `<button>` or your router's link, instead of an `<a>`. */
  asChild?: boolean
}

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  asChild,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      data-slot="pagination-link"
      data-active={isActive || undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }),
        'tabular-nums active:scale-100',
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, children, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      {children ?? (
        <>
          <ChevronLeftIcon />
          <span className="hidden sm:block">Previous</span>
        </>
      )}
    </PaginationLink>
  )
}

function PaginationNext({ className, children, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      {children ?? (
        <>
          <span className="hidden sm:block">Next</span>
          <ChevronRightIcon />
        </>
      )}
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export type PageRangeItem = number | 'ellipsis-start' | 'ellipsis-end'

/**
 * The pages to list around `page` (1 based): `boundaries` at each end, `siblings` on each side
 * of the current one, and an ellipsis for each gap. The list keeps the same length while you
 * move through the pages, so the buttons do not jump around under the pointer. A gap of one page
 * shows that page instead of an ellipsis.
 */
function getPageRange(
  page: number,
  pageCount: number,
  siblings = 1,
  boundaries = 1,
): PageRangeItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)
  const count = Math.max(1, pageCount)
  const s = Math.max(0, siblings)
  const b = Math.max(1, boundaries)
  const current = Math.min(Math.max(1, page), count)
  // Boundaries at each end, the current page, its siblings and the two ellipses.
  if (count <= 2 * b + 2 * s + 3) return range(1, count)

  // The window around the current page slides, but never into the boundaries and the slot
  // each ellipsis needs.
  const start = Math.max(Math.min(current - s, count - b - 2 * s - 1), b + 2)
  const end = Math.min(Math.max(current + s, b + 2 * s + 2), count - b - 1)

  return [
    ...range(1, b),
    start > b + 2 ? 'ellipsis-start' : b + 1,
    ...range(start, end),
    end < count - b - 1 ? 'ellipsis-end' : count - b,
    ...range(count - b + 1, count),
  ]
}

export interface PaginatorProps extends Omit<React.ComponentProps<'nav'>, 'onChange'> {
  /** The current page, starting at 1. */
  page: number
  /** How many items there are in all. */
  total: number
  /** Items on each page. Default 10. */
  pageSize?: number
  /** Called with the page to go to. */
  onPageChange?: (page: number) => void
  /** Pages listed on each side of the current one. Default 1. */
  siblings?: number
  /** Pages always listed at the start and at the end, at least 1. Default 1. */
  boundaries?: number
  /**
   * Show "Page 2 of 10" between the arrows instead of the list of pages. `auto`, the default,
   * switches to it when the paginator is narrower than 28rem, as on phones.
   */
  compact?: boolean | 'auto'
  /**
   * Builds the address of a page. With it every page is a real link that works without script
   * and can be crawled; `onPageChange` still runs on click.
   */
  getPageHref?: (page: number) => string
  /** The words around the compact counter. Default "Page {page} of {count}". */
  formatCompact?: (page: number, count: number) => React.ReactNode
}

/**
 * Ready-made pagination: works out the pages to list, with ellipses, from `page`, `total` and
 * `pageSize`, and turns into "Page 2 of 10" on narrow screens.
 */
function Paginator({
  page,
  total,
  pageSize = 10,
  onPageChange,
  siblings = 1,
  boundaries = 1,
  compact = 'auto',
  getPageHref,
  formatCompact = (current, count) => (
    <>
      Page <span className="font-medium text-foreground">{current}</span> of{' '}
      <span className="font-medium text-foreground">{count}</span>
    </>
  ),
  className,
  ...props
}: PaginatorProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const current = Math.min(Math.max(1, page), pageCount)

  const go = (target: number) => (event: React.MouseEvent) => {
    if (target < 1 || target > pageCount || target === current) {
      event.preventDefault()
      return
    }
    if (onPageChange) {
      // A plain click stays in the app; a modified one opens the link the browser's way.
      if (getPageHref && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0))
        return
      if (getPageHref) event.preventDefault()
      onPageChange(target)
    }
  }

  // A link when there is an address, a button otherwise. Disabled ends lose their link.
  const control = (target: number, children: React.ReactNode, disabled = false) =>
    getPageHref ? (
      <a
        href={disabled ? undefined : getPageHref(target)}
        aria-disabled={disabled || undefined}
        onClick={go(target)}
      >
        {children}
      </a>
    ) : (
      <button type="button" disabled={disabled} onClick={go(target)}>
        {children}
      </button>
    )

  const previous = (
    <PaginationItem>
      <PaginationPrevious asChild>
        {control(
          current - 1,
          <>
            <ChevronLeftIcon />
            <span className="hidden @md:block">Previous</span>
          </>,
          current <= 1,
        )}
      </PaginationPrevious>
    </PaginationItem>
  )
  const next = (
    <PaginationItem>
      <PaginationNext asChild>
        {control(
          current + 1,
          <>
            <span className="hidden @md:block">Next</span>
            <ChevronRightIcon />
          </>,
          current >= pageCount,
        )}
      </PaginationNext>
    </PaginationItem>
  )

  const full = (
    <PaginationContent
      data-slot="paginator-pages"
      className={cn(compact === 'auto' && 'hidden @md:flex')}
    >
      {previous}
      {getPageRange(current, pageCount, siblings, boundaries).map((item) =>
        typeof item === 'number' ? (
          <PaginationItem key={item}>
            <PaginationLink
              asChild
              isActive={item === current}
              aria-label={`Page ${item}`}
              className="min-w-9 px-2"
            >
              {control(item, item)}
            </PaginationLink>
          </PaginationItem>
        ) : (
          <PaginationItem key={item}>
            <PaginationEllipsis />
          </PaginationItem>
        ),
      )}
      {next}
    </PaginationContent>
  )

  const short = (
    <PaginationContent
      data-slot="paginator-compact"
      className={cn('gap-2', compact === 'auto' && '@md:hidden')}
    >
      {previous}
      <PaginationItem
        aria-live="polite"
        className="px-2 text-muted-foreground text-sm tabular-nums"
      >
        {formatCompact(current, pageCount)}
      </PaginationItem>
      {next}
    </PaginationContent>
  )

  return (
    // The container query, rather than a screen one, lets it go compact in a narrow column too.
    <Pagination data-slot="paginator" className={cn('@container', className)} {...props}>
      <div className="flex justify-center">
        {compact !== true && full}
        {compact !== false && short}
      </div>
    </Pagination>
  )
}

export {
  getPageRange,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Paginator,
}
