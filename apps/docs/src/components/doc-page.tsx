import { MDXProvider } from '@mdx-js/react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { type ComponentType, lazy, Suspense, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { findPage, pageHref, pages } from '~/lib/nav'
import { site } from '~/lib/site'
import { mdxComponents } from './mdx-components'

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
  const slug = pathname.replace(/^\/docs\/?/, '')
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
  const section = page.slug.startsWith('components/') ? 'Components' : page.slug ? 'Docs' : 'Docs'

  return (
    <article>
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{section}</span>
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground">{page.title}</span>
        </div>
        <h1 className="font-bold text-3xl tracking-tight">{page.title}</h1>
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
