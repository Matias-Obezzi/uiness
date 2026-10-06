'use client'

import { CheckIcon, MinusIcon, SparklesIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'

/** `true` included, `false` missing, `'partial'` half there, or a short text like `5 GB`. */
export type ComparisonValue = boolean | 'partial' | string

export interface ComparisonProduct {
  /** Key for the values in each row. */
  id: string
  name: string
  /** A short line under the name, like a price. */
  caption?: string
  /** The column to draw the eye to, usually yours. */
  highlight?: boolean
}

export interface ComparisonRow {
  feature: string
  /** A hint under the feature name. */
  description?: string
  /** One value per product id. A missing one reads as `false`. */
  values: Record<string, ComparisonValue>
}

export interface ComparisonSection {
  title: string
  rows: ComparisonRow[]
}

export interface ComparisonLabels {
  feature: string
  yes: string
  no: string
  partial: string
  /** On the highlighted column. */
  recommended: string
}

/** Whose product is being compared. The same shape as the `brand` of the other blocks. */
export interface ComparisonBrand {
  /** Named in the default title and on the default highlighted column. */
  name: string
}

export interface Comparison01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  brand?: ComparisonBrand
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  /** Default `Why teams switch to <brand.name>`. */
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** One per column. The default puts the brand first, against two alternatives. */
  products?: ComparisonProduct[]
  sections?: ComparisonSection[]
  /** A button under the highlighted column. `null` hides it. */
  action?: { label: string; href: string } | null
  /**
   * Height of the box the table scrolls in, so the header can stay put while the rows move.
   * `null` lets the table grow to its full height.
   */
  maxHeight?: string | null
  labels?: Partial<ComparisonLabels>
}

const defaultBrand: ComparisonBrand = { name: 'Acme' }

const defaultProducts = (name: string): ComparisonProduct[] => [
  { id: 'us', name, caption: 'from $12 / seat', highlight: true },
  { id: 'a', name: 'Legacy Suite', caption: 'from $25 / seat' },
  { id: 'b', name: 'Spreadsheets', caption: 'free-ish' },
]

const defaultSections: ComparisonSection[] = [
  {
    title: 'Planning',
    rows: [
      { feature: 'Boards, lists and timelines', values: { us: true, a: true, b: 'partial' } },
      {
        feature: 'Saved views',
        description: 'Filters you name and share',
        values: { us: true, a: 'partial', b: false },
      },
      { feature: 'Automations', values: { us: 'Unlimited', a: '250 / month', b: false } },
      { feature: 'Realtime collaboration', values: { us: true, a: false, b: true } },
    ],
  },
  {
    title: 'Data and security',
    rows: [
      { feature: 'SSO and SCIM', values: { us: true, a: 'Enterprise', b: false } },
      { feature: 'Audit log', values: { us: '1 year', a: '90 days', b: false } },
      { feature: 'EU data residency', values: { us: true, a: 'partial', b: false } },
      { feature: 'Export everything', values: { us: true, a: 'partial', b: true } },
    ],
  },
  {
    title: 'Support',
    rows: [
      { feature: 'Median first reply', values: { us: '2 hours', a: '2 days', b: '—' } },
      { feature: 'Free migration help', values: { us: true, a: false, b: false } },
    ],
  },
]

const defaultLabels: ComparisonLabels = {
  feature: 'Feature',
  yes: 'Included',
  no: 'Not included',
  partial: 'Partly',
  recommended: 'Recommended',
}

function Value({
  value,
  labels,
  highlight,
}: {
  value: ComparisonValue | undefined
  labels: ComparisonLabels
  highlight?: boolean
}) {
  if (value === true)
    return (
      <span
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-full',
          highlight ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground',
        )}
      >
        <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
        <span className="sr-only">{labels.yes}</span>
      </span>
    )
  if (value === 'partial')
    return (
      <span
        title={labels.partial}
        className="inline-flex size-6 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      >
        <MinusIcon aria-hidden className="size-3.5" strokeWidth={3} />
        <span className="sr-only">{labels.partial}</span>
      </span>
    )
  if (value === false || value === undefined)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground/60">
        <XIcon aria-hidden className="size-4" />
        <span className="sr-only">{labels.no}</span>
      </span>
    )
  return (
    <span className={cn('text-sm', highlight ? 'font-semibold' : 'text-muted-foreground')}>
      {value}
    </span>
  )
}

/**
 * Your product against the alternatives. On a wide container it is a table whose header stays
 * in view while the rows scroll, with your column lifted out in colour; narrow, each product
 * becomes a card with the same rows, yours first. Cells hold a tick, a cross, a half mark or
 * a short text, and each says what it means to screen readers.
 */
function Comparison01({
  brand = defaultBrand,
  eyebrow = 'Compare',
  title = `Why teams switch to ${brand.name}`,
  description = 'An honest look at what you get, side by side with the tools people usually come from.',
  products = defaultProducts(brand.name),
  sections = defaultSections,
  action = { label: 'Start free trial', href: '#' },
  maxHeight = '34rem',
  labels: labelsProp,
  className,
  ...props
}: Comparison01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const ordered = [...products].sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight))

  return (
    <section
      data-slot="block-comparison-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="mx-auto max-w-2xl text-center">
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

        {/* Wide: one table. */}
        <div
          data-slot="comparison-table"
          className="mt-12 hidden @2xl:block"
          style={
            maxHeight ? ({ '--comparison-height': maxHeight } as React.CSSProperties) : undefined
          }
        >
          <Table
            containerClassName={cn(
              'rounded-2xl bg-card',
              maxHeight && 'max-h-(--comparison-height) overflow-y-auto',
            )}
            className="table-fixed"
          >
            <colgroup>
              <col className="w-[34%]" />
              {products.map((p) => (
                <col key={p.id} />
              ))}
            </colgroup>
            <TableHeader
              sticky
              className="[&_th]:bg-card [&_th]:shadow-[inset_0_-1px_0_var(--color-border)]"
            >
              <TableRow className="hover:bg-transparent">
                <TableHead
                  scope="col"
                  className="h-auto px-5 py-4 align-bottom text-muted-foreground"
                >
                  {labels.feature}
                </TableHead>
                {products.map((p) => (
                  <TableHead
                    key={p.id}
                    scope="col"
                    className={cn(
                      'h-auto whitespace-normal px-4 py-4 text-center align-bottom',
                      // Opaque, so the rows scrolling under the sticky header do not show through.
                      p.highlight &&
                        'relative bg-[color-mix(in_oklab,var(--color-primary)_6%,var(--color-card))]!',
                    )}
                  >
                    {p.highlight && (
                      <>
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/60 via-primary to-primary/60"
                        />
                        <Badge className="mb-2 gap-1">
                          <SparklesIcon aria-hidden />
                          {labels.recommended}
                        </Badge>
                      </>
                    )}
                    <span className="block font-semibold text-base">{p.name}</span>
                    {p.caption && (
                      <span className="block font-normal text-muted-foreground text-xs">
                        {p.caption}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            {sections.map((section) => (
              <TableBody key={section.title} className="[&_tr:last-child]:border-b">
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead
                    scope="colgroup"
                    colSpan={products.length + 1}
                    className="h-9 px-5 text-eyebrow text-muted-foreground uppercase"
                  >
                    {section.title}
                  </TableHead>
                </TableRow>
                {section.rows.map((row) => (
                  <TableRow key={row.feature} className="hover:bg-muted/30">
                    <TableHead
                      scope="row"
                      className="h-auto whitespace-normal px-5 py-3.5 font-normal"
                    >
                      <span className="block font-medium">{row.feature}</span>
                      {row.description && (
                        <span className="block text-muted-foreground text-xs">
                          {row.description}
                        </span>
                      )}
                    </TableHead>
                    {products.map((p) => (
                      <TableCell
                        key={p.id}
                        className={cn(
                          'whitespace-normal px-4 py-3.5 text-center',
                          p.highlight && 'bg-primary/5',
                        )}
                      >
                        <Value value={row.values[p.id]} labels={labels} highlight={p.highlight} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ))}
            {action && (
              <tfoot>
                <tr>
                  <td />
                  {products.map((p) => (
                    <td key={p.id} className={cn('px-4 py-5', p.highlight && 'bg-primary/5')}>
                      {p.highlight && (
                        <Button asChild className="w-full">
                          <a href={action.href}>{action.label}</a>
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </Table>
        </div>

        {/* Narrow: a card per product. */}
        <ul data-slot="comparison-cards" className="mt-10 flex flex-col gap-4 @2xl:hidden">
          {ordered.map((p) => (
            <li
              key={p.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card',
                p.highlight && 'border-primary/40 shadow-md ring-1 ring-primary/20',
              )}
            >
              <div
                className={cn(
                  'flex items-start justify-between gap-3 border-b px-5 py-4',
                  p.highlight && 'bg-primary/5',
                )}
              >
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.caption && <p className="text-muted-foreground text-xs">{p.caption}</p>}
                </div>
                {p.highlight && (
                  <Badge className="gap-1">
                    <SparklesIcon aria-hidden />
                    {labels.recommended}
                  </Badge>
                )}
              </div>
              {sections.map((section) => (
                <div key={section.title} className="px-5 py-3">
                  <h4 className="py-1 text-eyebrow text-muted-foreground uppercase">
                    {section.title}
                  </h4>
                  <dl className="divide-y">
                    {section.rows.map((row) => (
                      <div
                        key={row.feature}
                        className="flex items-center justify-between gap-4 py-2.5"
                      >
                        <dt className="text-sm">{row.feature}</dt>
                        <dd className="shrink-0 text-right">
                          <Value value={row.values[p.id]} labels={labels} highlight={p.highlight} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              {p.highlight && action && (
                <div className="border-t px-5 py-4">
                  <Button asChild className="w-full">
                    <a href={action.href}>{action.label}</a>
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export { Comparison01 }
