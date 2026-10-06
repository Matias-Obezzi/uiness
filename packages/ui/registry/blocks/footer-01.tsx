'use client'

import {
  ArrowRightIcon,
  GitBranchIcon,
  LoaderCircleIcon,
  type LucideIcon,
  MailCheckIcon,
  MessagesSquareIcon,
  RssIcon,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FooterLink {
  label: string
  href: string
}

/** Whose site this is. The same shape as the `brand` of the other blocks. */
export interface FooterBrand {
  /** The wordmark, and the watermark. */
  name: string
  /** Where the wordmark goes. Default `/`. */
  href?: string
  /** The mark before the name, like `<MountainIcon />` or an `<img>`. Without one it shows the first letter. */
  logo?: React.ReactNode
  /** The company's legal name for the copyright line, like `Acme, Inc.`. Default `name`. */
  legalName?: string
}

export interface FooterSocial {
  /** Accessible name of the icon link, like `GitHub`. */
  label: string
  href: string
  icon: LucideIcon
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterNewsletter {
  title: React.ReactNode
  description?: React.ReactNode
  /** Label of the email field. */
  label?: string
  placeholder?: string
  /** Text of the submit button. */
  button?: string
  /** What shows in place of the form once subscribed. */
  success?: React.ReactNode
  /** What shows when `onSubscribe` throws. */
  error?: React.ReactNode
}

export interface Footer01Props extends React.ComponentProps<'footer'> {
  brand?: FooterBrand
  /** A line or two under the wordmark. */
  description?: React.ReactNode
  /** Icon links under the description. */
  socials?: FooterSocial[]
  /** Titled lists of links, three or four read best. */
  columns?: FooterColumn[]
  /** The signup strip. `null` hides it. */
  newsletter?: FooterNewsletter | null
  /** Called with the email when the signup is sent. Return a promise to show a pending state. */
  onSubscribe?: (email: string) => void | Promise<void>
  /** The brand name set huge and faded between the links and the bottom bar. Default true. */
  watermark?: boolean
  /** The line in the bottom bar. Default `© <year> <brand.legalName>`. */
  copyright?: React.ReactNode
  /** Links in the bottom bar: privacy, terms, cookies. */
  legal?: FooterLink[]
}

const defaultBrand: FooterBrand = { name: 'Acme', href: '#', legalName: 'Acme, Inc.' }

const defaultSocials: FooterSocial[] = [
  { label: 'GitHub', href: '#', icon: GitBranchIcon },
  { label: 'Community', href: '#', icon: MessagesSquareIcon },
  { label: 'RSS feed', href: '#', icon: RssIcon },
]

const defaultColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#' },
      { label: 'Integrations', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'API reference', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Customers', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
]

const defaultNewsletter: FooterNewsletter = {
  title: 'Notes from the team',
  description: 'One short email a month: what shipped, what we learned, nothing else.',
  label: 'Email address',
  placeholder: 'you@company.com',
  button: 'Subscribe',
  success: 'You are on the list. Check your inbox to confirm.',
  error: 'That did not go through. Try again in a moment.',
}

const defaultLegal: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Cookies', href: '#' },
]

type Status = 'idle' | 'pending' | 'done' | 'error'

/**
 * A full footer: the wordmark with a short blurb and social links, columns of links, a
 * newsletter signup that thanks people in place, and a bottom bar with the copyright and
 * legal links. The columns fold from four across to two as its container narrows.
 */
function Footer01({
  brand = defaultBrand,
  description = 'The planning tool for teams who would rather be building. Made with care in Lisbon and Montréal.',
  socials = defaultSocials,
  columns = defaultColumns,
  newsletter = defaultNewsletter,
  onSubscribe,
  watermark = true,
  copyright = `© ${new Date().getFullYear()} ${brand.legalName ?? brand.name}`,
  legal = defaultLegal,
  className,
  ...props
}: Footer01Props) {
  const newsletterId = React.useId()
  const emailId = React.useId()
  const [status, setStatus] = React.useState<Status>('idle')

  const subscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'pending') return
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    setStatus('pending')
    try {
      await onSubscribe?.(email)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer
      data-slot="block-footer-01"
      className={cn('@container relative w-full overflow-hidden border-t', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 pt-16 @3xl:pt-20">
        <div className="grid gap-12 @4xl:grid-cols-12">
          <div className="flex flex-col items-start gap-5 @4xl:col-span-4">
            <a
              href={brand.href ?? '/'}
              className="group flex items-center gap-2 rounded-md font-semibold text-subheading outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm transition-transform duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none [&_svg]:size-4"
              >
                {brand.logo ?? brand.name.charAt(0)}
              </span>
              {brand.name}
            </a>
            {description && (
              <p className="max-w-xs text-pretty text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            )}
            {socials.length > 0 && (
              <ul className="flex gap-1">
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <a href={href} aria-label={label} title={label}>
                        <Icon />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.length > 0 && (
            <nav
              aria-label="Footer"
              className="grid grid-cols-2 gap-x-6 gap-y-10 @2xl:grid-cols-(--footer-cols) @4xl:col-span-8"
              style={
                {
                  '--footer-cols': `repeat(${columns.length}, minmax(0, 1fr))`,
                } as React.CSSProperties
              }
            >
              {columns.map((column) => (
                <div key={column.title}>
                  <h2 className="font-medium text-sm">{column.title}</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="rounded-sm text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>

        {newsletter && (
          <section
            aria-labelledby={newsletterId}
            className="relative mt-16 grid gap-6 overflow-hidden rounded-2xl border bg-muted/40 p-6 @3xl:grid-cols-[1fr_minmax(0,24rem)] @3xl:items-center @3xl:p-8"
          >
            <div>
              <h2 id={newsletterId} className="text-subheading">
                {newsletter.title}
              </h2>
              {newsletter.description && (
                <p className="mt-1.5 text-pretty text-muted-foreground text-sm">
                  {newsletter.description}
                </p>
              )}
            </div>
            <div aria-live="polite">
              {status === 'done' ? (
                <p className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm duration-(--duration-slow,300ms) animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MailCheckIcon aria-hidden className="size-4" />
                  </span>
                  {newsletter.success}
                </p>
              ) : (
                <form onSubmit={subscribe} className="flex flex-col gap-2">
                  <Label htmlFor={emailId} className="sr-only">
                    {newsletter.label ?? 'Email address'}
                  </Label>
                  <div className="flex flex-col gap-2 @md:flex-row">
                    <Input
                      id={emailId}
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={newsletter.placeholder}
                      aria-invalid={status === 'error' || undefined}
                      className="h-10 bg-background"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={status === 'pending'}
                      className="group"
                    >
                      {newsletter.button ?? 'Subscribe'}
                      {status === 'pending' ? (
                        <LoaderCircleIcon
                          aria-hidden
                          className="animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <ArrowRightIcon
                          aria-hidden
                          className="transition-transform duration-(--duration-fast,150ms) group-hover:translate-x-0.5"
                        />
                      )}
                    </Button>
                  </div>
                  {status === 'error' && newsletter.error && (
                    <p role="alert" className="text-destructive text-sm">
                      {newsletter.error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </section>
        )}
      </div>

      {watermark && (
        <div
          aria-hidden
          className="pointer-events-none mx-auto -mb-[3cqw] max-w-6xl select-none overflow-hidden px-6 pt-10 text-center font-bold text-[min(16cqw,12rem)] leading-none tracking-tighter"
        >
          <span className="bg-linear-to-b from-foreground/15 to-foreground/0 bg-clip-text text-transparent">
            {brand.name}
          </span>
        </div>
      )}

      <div className="relative border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          {copyright && <p className="text-caption text-muted-foreground">{copyright}</p>}
          {legal.length > 0 && (
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="rounded-sm text-caption text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}

export { Footer01 }
