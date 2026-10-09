import meta from 'virtual:page-meta'
import { useEffect, useState } from 'react'
import { type NavPage, pageHref, pages } from './nav'

interface Counts {
  /** CLI fetches per registry item. */
  items: Record<string, number>
  /** Install commands copied per page path. */
  pages: Record<string, number>
}

export interface Usage {
  installs: Counts
  /** The same over the last 30 days. */
  month: Counts
  /** Pages whose views grew most this week, with this week's and last week's views. */
  trending: { path: string; week: number; before: number }[]
}

const requests = new Map<string, Promise<unknown>>()

/** JSON from one of the site's functions, fetched once per visit. Null until then, or without it. */
export function useJson<T>(url: string) {
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

export const useUsage = () => useJson<Usage>('/api/usage')

/**
 * How often what a page documents was installed: its registry items fetched by the CLI, plus
 * its install command copied on the page.
 */
export function installsOf(page: NavPage, counts: Counts | undefined) {
  if (!counts) return 0
  const items = meta[page.file]?.items ?? []
  const fetched = items.reduce((sum, name) => sum + (counts.items[name] ?? 0), 0)
  return fetched + (counts.pages[pageHref(page)] ?? 0)
}

/** The pages installed most over the last 30 days, at least `min` times, best first. */
export function mostInstalled(usage: Usage | null, limit = 5, min = 3) {
  if (!usage) return []
  return pages
    .map((page) => ({ page, installs: installsOf(page, usage.month) }))
    .filter(({ installs }) => installs >= min)
    .sort((a, b) => b.installs - a.installs)
    .slice(0, limit)
}
