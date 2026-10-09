import meta from 'virtual:page-meta'
import { useActiveSection } from '@uiness/scroll'
import { CalendarIcon, DownloadIcon, PackageIcon } from 'lucide-react'
import { type RefObject, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { findPage } from '~/lib/nav'
import { site } from '~/lib/site'
import { GithubIcon } from './github-icon'

/** The page's own headings, not the ones inside a demo. */
const HEADINGS = '.prose :is(h2, h3)[id]:not(.not-prose *)'

interface Heading {
  id: string
  text: string
  sub: boolean
}

/** The headings under `main`, read again whenever the page's content swaps or loads. */
function useHeadings(main: RefObject<HTMLElement | null>) {
  const [headings, setHeadings] = useState<Heading[]>([])
  useEffect(() => {
    const root = main.current
    if (!root) return
    let key = ''
    let frame = 0
    const read = () => {
      frame = 0
      const next = Array.from(root.querySelectorAll<HTMLElement>(HEADINGS), (h) => ({
        id: h.id,
        text: h.textContent?.trim() ?? '',
        sub: h.localName === 'h3',
      }))
      // Demos change the DOM all the time: only a different list of headings re-renders.
      const nextKey = next.map((h) => h.id).join(' ')
      if (nextKey !== key) {
        key = nextKey
        setHeadings(next)
      }
    }
    read()
    const observer = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(read)
    })
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [main])
  return headings
}

const requests = new Map<string, Promise<unknown>>()

/** JSON from one of the site's functions, fetched once per visit. Null until then, or without it. */
function useJson<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let live = true
    if (!requests.has(url)) {
      requests.set(
        url,
        fetch(url)
          .then((res) => (res.ok ? res.json() : null))
          // Locally there are no functions, and the dev server answers with the page.
          .catch(() => null),
      )
    }
    requests.get(url)?.then((value) => {
      if (live) setData(value as T)
    })
    return () => {
      live = false
    }
  }, [url])
  return data
}

const count = (n: number) => n.toLocaleString('en')

/**
 * The right column of a docs page: its headings, the one being read marked, then a star link,
 * when the page last changed and how often what it documents is installed.
 */
export function PageAside({
  main,
  wide = false,
}: {
  main: RefObject<HTMLElement | null>
  /** Next to a full width page: only shown on screens with room for both. */
  wide?: boolean
}) {
  const { pathname } = useLocation()
  const page = findPage(pathname.replace(/^\/docs\/?/, '').replace(/\/$/, ''))
  const info = page ? meta[page.file] : undefined
  const headings = useHeadings(main)
  const active = useActiveSection(main, { selector: HEADINGS, anchor: 0.2, container: null })
  const installs = useJson<Record<string, number>>('/api/installs')
  const downloads = useJson<{ packages: Record<string, number> }>('/api/downloads')

  const installed = info?.items.reduce((sum, name) => sum + (installs?.[name] ?? 0), 0) ?? 0
  const npm = info?.npm ? downloads?.packages[info.npm] : undefined

  return (
    <aside
      className={cn(
        'sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 flex-col gap-6 overflow-y-auto overscroll-contain py-8 text-sm lg:py-10',
        wide ? '2xl:flex' : 'xl:flex',
      )}
    >
      {headings.length > 0 && (
        <nav aria-labelledby="on-this-page" className="space-y-2">
          <p id="on-this-page" className="font-medium">
            On this page
          </p>
          <ul className="space-y-1.5">
            {headings.map((heading, i) => (
              <li key={heading.id} className={cn(heading.sub && 'pl-3')}>
                <a
                  href={`#${heading.id}`}
                  aria-current={i === active ? 'location' : undefined}
                  className={cn(
                    'block text-muted-foreground transition-colors hover:text-foreground',
                    i === active && 'text-foreground',
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="space-y-3 border-t pt-4 text-muted-foreground text-xs">
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={site.github} target="_blank" rel="noreferrer">
            <GithubIcon /> Star on GitHub
          </a>
        </Button>
        {info?.updated && (
          <p className="flex items-center gap-2">
            <CalendarIcon className="size-3.5" aria-hidden />
            Updated{' '}
            <time dateTime={info.updated}>
              {new Date(info.updated).toLocaleDateString('en', { dateStyle: 'medium' })}
            </time>
          </p>
        )}
        {installed > 0 && (
          <p className="flex items-center gap-2 tabular-nums">
            <DownloadIcon className="size-3.5" aria-hidden />
            {count(installed)} {installed === 1 ? 'install' : 'installs'} with the CLI
          </p>
        )}
        {npm !== undefined && (
          <p className="flex items-center gap-2 tabular-nums">
            <PackageIcon className="size-3.5" aria-hidden />
            {count(npm)} npm downloads last week
          </p>
        )}
      </div>
    </aside>
  )
}
