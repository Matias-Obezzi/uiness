'use client'

import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pattern } from '@/components/ui/pattern'
import { ScrambleText } from '@/components/ui/scramble-text'
import { cn } from '@/lib/utils'

export interface NotFoundLink {
  label: string
  description?: string
  href: string
}

export interface NotFound01Labels {
  search: string
  searchPlaceholder: string
  submit: string
  popular: string
}

export interface NotFound01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The big figure. Default `404`. */
  code?: string
  title?: React.ReactNode
  description?: React.ReactNode
  /** Where search goes: the query is sent as `q`. `null` hides the search. */
  searchAction?: string | null
  /** Called with the query instead of navigating, for a search in the page. */
  onSearch?: (query: string) => void
  links?: NotFoundLink[]
  home?: { label: string; href: string } | null
  labels?: Partial<NotFound01Labels>
}

const defaultLabels: NotFound01Labels = {
  search: 'Search the site',
  searchPlaceholder: 'What were you looking for?',
  submit: 'Search',
  popular: 'Popular pages',
}

const defaultLinks: NotFoundLink[] = [
  { label: 'Documentation', description: 'Guides and the API reference.', href: '#' },
  { label: 'Changelog', description: 'What shipped, week by week.', href: '#' },
  { label: 'Support', description: 'Talk to a person, usually within the hour.', href: '#' },
]

/**
 * A page that was not found, without the dead end: the code scrambles into place, then a
 * search, a few pages people usually want, and the way home. The search is a plain GET form,
 * so it works before any script runs.
 */
function NotFound01({
  code = '404',
  title = 'This page took a day off',
  description = 'The link may be old, or the page moved. Search for it, or start from one of these.',
  searchAction = '/search',
  onSearch,
  links = defaultLinks,
  home = { label: 'Back to home', href: '/' },
  labels: labelsProp,
  className,
  ...props
}: NotFound01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!onSearch) return
    e.preventDefault()
    const query = new FormData(e.currentTarget).get('q')
    onSearch(typeof query === 'string' ? query.trim() : '')
  }

  return (
    <section
      data-slot="block-not-found-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container relative w-full overflow-hidden', className)}
      {...props}
    >
      <Pattern variant="grid" className="text-border" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center @3xl:py-28">
        <p
          aria-hidden="true"
          className="font-bold font-mono text-[clamp(5rem,22cqi,9rem)] text-primary leading-none tracking-tighter"
        >
          <ScrambleText text={code} trigger="mount" characters="0123456789" />
        </p>
        <h1 id={`${id}-title`} className="mt-6 text-balance text-title">
          <span className="sr-only">{code}. </span>
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
        )}

        {searchAction !== null && (
          <search className="mt-8 w-full max-w-md">
            <form action={searchAction} method="get" onSubmit={submit} className="flex gap-2">
              <label htmlFor={`${id}-q`} className="sr-only">
                {labels.search}
              </label>
              <div className="relative flex-1">
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id={`${id}-q`}
                  name="q"
                  type="search"
                  placeholder={labels.searchPlaceholder}
                  className="pl-9"
                />
              </div>
              <Button type="submit">{labels.submit}</Button>
            </form>
          </search>
        )}

        {links.length > 0 && (
          <nav aria-labelledby={`${id}-popular`} className="mt-12 w-full text-left">
            <h2
              id={`${id}-popular`}
              className="mb-3 text-center text-eyebrow text-muted-foreground uppercase"
            >
              {labels.popular}
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {links.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent"
                  >
                    <span>
                      <span className="block font-medium">{link.label}</span>
                      {link.description && (
                        <span className="block text-muted-foreground text-sm">
                          {link.description}
                        </span>
                      )}
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {home && (
          <Button asChild variant="ghost" className="mt-8">
            <a href={home.href}>
              <ArrowLeftIcon />
              {home.label}
            </a>
          </Button>
        )}
      </div>
    </section>
  )
}

export { NotFound01 }
