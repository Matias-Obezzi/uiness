import { MDXProvider } from '@mdx-js/react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { type ComponentType, lazy, Suspense, useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { Badge } from '@/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/breadcrumb'
import { Button } from '@/ui/button'
import { findPage, isNew, nav, pageHref, pages } from '~/lib/nav'
import { site } from '~/lib/site'
import { mdxComponents } from './mdx-components'
import { NewBadge } from './new-badge'

const loaders = import.meta.glob('../content/**/*.mdx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>

// Lazy components are created once here. Creating them during render would give
// every suspended retry a fresh promise, and a transition would never settle.
const content = Object.fromEntries(
  Object.entries(loaders).map(([path, loader]) => [path, lazy(loader)]),
) as Record<string, ComponentType>

export function DocPage() {
  const { pathname, hash } = useLocation()
  const slug = pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '')
  const page = findPage(slug)

  const Content = page ? content[`../content/${page.file}`] : null

  useEffect(() => {
    document.title = page ? `${page.title} · ${site.name}` : site.name
  }, [page])

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const target = document.getElementById(hash.slice(1))
    target?.scrollIntoView()
  }, [hash])

  // A section's own address, like /docs/blocks, opens its first page, alphabetically, the
  // same one the header links to.
  const firstInSection =
    !page && slug ? pages.find((p) => p.slug.startsWith(`${slug}/`)) : undefined
  if (firstInSection) return <Navigate replace to={`${pageHref(firstInSection)}${hash}`} />

  if (!page || !Content) {
    return (
      <div className="prose">
        <h1>Not found</h1>
        <p>There is no page at this address.</p>
        <Button asChild variant="outline">
          <Link to="/docs">Back to the docs</Link>
        </Button>
      </div>
    )
  }

  const index = pages.indexOf(page)
  const prev = pages[index - 1]
  const next = pages[index + 1]
  const section = nav.find((s) => s.pages.some((p) => p.slug === page.slug))
  const sectionStart = section?.pages[0]

  return (
    <article>
      <div className="mb-8 space-y-2">
        <Breadcrumb>
          <BreadcrumbList className="gap-1.5 sm:gap-2">
            <BreadcrumbItem>
              {sectionStart && sectionStart !== page ? (
                <BreadcrumbLink asChild>
                  <Link to={pageHref(sectionStart)}>{section?.title}</Link>
                </BreadcrumbLink>
              ) : (
                <span>{section?.title ?? 'Docs'}</span>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="flex items-center gap-3 font-bold text-3xl tracking-tight">
          {page.title}
          {isNew(page) && <NewBadge className="text-xs" />}
        </h1>
        <p className="text-lg text-muted-foreground">{page.description}</p>
        {page.slug.startsWith('components/') && (
          <div className="flex gap-2 pt-1">
            <Badge variant="secondary">Registry</Badge>
          </div>
        )}
      </div>
      <div className="prose">
        <MDXProvider components={mdxComponents}>
          <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            <Content />
          </Suspense>
        </MDXProvider>
      </div>
      <nav className="mt-16 flex items-center justify-between border-t pt-6">
        {prev ? (
          <Button asChild variant="ghost">
            <Link to={pageHref(prev)}>
              <ChevronLeftIcon /> {prev.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild variant="ghost">
            <Link to={pageHref(next)}>
              {next.title} <ChevronRightIcon />
            </Link>
          </Button>
        )}
      </nav>
    </article>
  )
}
