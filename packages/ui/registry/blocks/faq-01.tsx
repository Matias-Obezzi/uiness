'use client'

import { ArrowRightIcon, ChevronDownIcon, MessageCircleIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FaqItem {
  question: string
  answer: React.ReactNode
}

export interface FaqContact {
  /** The line before the link. */
  text?: string
  label: string
  href: string
}

export interface Faq01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  /** The lead under the heading. `null` hides it. */
  description?: React.ReactNode | null
  items?: FaqItem[]
  /** Index of the question that starts open. `null` starts with all closed. */
  defaultOpen?: number | null
  /** Close the open question when another one opens. Default false. */
  exclusive?: boolean
  /** Where to go when the answer is not here. `null` hides it. */
  contact?: FaqContact | null
}

const defaultItems: FaqItem[] = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The Starter plan is free forever for up to three projects, with no credit card needed. Upgrade whenever you outgrow it.',
  },
  {
    question: 'Can I change plans later?',
    answer:
      'Any time, from the billing page. Upgrades apply right away and are prorated; downgrades take effect at the end of the current period.',
  },
  {
    question: 'How does the 14-day trial work?',
    answer:
      'You get every Pro feature for 14 days. We remind you three days before it ends, and nothing is charged unless you choose a plan.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'In the EU or the US, your choice, encrypted at rest and in transit. You can export all of it, in open formats, whenever you like.',
  },
  {
    question: 'Do you offer discounts for nonprofits and education?',
    answer:
      'We do: 50% off any paid plan for registered nonprofits, schools and students. Write to us from your organisation’s address.',
  },
  {
    question: 'What happens if I cancel?',
    answer:
      'Your workspace stays readable for 90 days, so you can export everything. After that it is deleted for good, backups included.',
  },
]

/**
 * Questions and answers beside a heading: two columns when there is room, one when not.
 * Each question is a native disclosure, so it opens with a click, Enter or Space and tells
 * screen readers whether it is expanded. Where the browser can animate to `auto` height the
 * answer slides open; elsewhere it simply appears.
 */
function Faq01({
  eyebrow = 'FAQ',
  title = 'Questions, answered',
  description = 'Everything you need to know about plans, billing and your data. Can’t find what you are looking for?',
  items = defaultItems,
  defaultOpen = 0,
  exclusive = false,
  contact = { text: 'Still have questions?', label: 'Talk to our team', href: '#' },
  className,
  ...props
}: Faq01Props) {
  const headingId = React.useId()
  const groupName = React.useId()

  return (
    <section
      data-slot="block-faq-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-16 @3xl:py-24">
        <div className="@3xl:sticky @3xl:top-24 @3xl:self-start">
          {eyebrow != null && (
            <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
          )}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description != null && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
          {contact != null && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border bg-muted/40 p-4">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background shadow-xs ring-1 ring-border"
              >
                <MessageCircleIcon className="size-4.5" />
              </span>
              <div className="min-w-0 text-sm">
                {contact.text && <p className="text-muted-foreground">{contact.text}</p>}
                <a
                  href={contact.href}
                  className="group/link inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {contact.label}
                  <ArrowRightIcon className="size-3.5 transition-transform duration-(--duration-fast,150ms) group-hover/link:translate-x-0.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="border-t [interpolate-size:allow-keywords]">
          {items.map((item, i) => (
            <details
              key={item.question}
              name={exclusive ? groupName : undefined}
              open={i === defaultOpen}
              className={cn(
                'group border-b',
                // Progressive enhancement: where `::details-content` and `interpolate-size`
                // exist the answer slides between 0 and its natural height.
                'details-content:h-0 details-content:overflow-clip details-content:transition-[height,content-visibility] details-content:duration-(--duration-slow,300ms) details-content:ease-emphasized details-content:[transition-behavior:allow-discrete] open:details-content:h-auto motion-reduce:details-content:transition-none',
              )}
            >
              <summary className="-mx-2 flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg px-2 py-5 text-left font-medium text-body outline-none transition-colors hover:text-foreground/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background transition-colors duration-(--duration-normal,200ms) group-open:bg-primary group-open:text-primary-foreground"
                >
                  <ChevronDownIcon className="size-4 transition-transform duration-(--duration-slow,300ms) ease-emphasized group-open:rotate-180 motion-reduce:transition-none" />
                </span>
              </summary>
              <div className="pr-12 pb-6 text-muted-foreground text-pretty opacity-0 transition-opacity duration-(--duration-slow,300ms) group-open:opacity-100 motion-reduce:transition-none">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Faq01 }
