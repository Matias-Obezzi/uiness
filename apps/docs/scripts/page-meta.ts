// `virtual:page-meta`: for each docs page, when it last changed and which registry items it
// shows, worked out from git and registry.json at build time.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { PACKAGES } from '../api/downloads.js'
import { pages } from '../src/lib/nav.ts'
import { site } from '../src/lib/site.ts'

export interface PageMeta {
  /** ISO date of the last commit to the page or to the code it documents. */
  updated?: string
  /** Registry items the page installs: its own name, or a block page's `hero-01`, `hero-02`... */
  items: string[]
  /** The npm package the page documents. */
  npm?: string
}

const repo = fileURLToPath(new URL('../../..', import.meta.url))
const VIRTUAL = 'virtual:page-meta'

/** Latest commit date per path, from `git log --format=%x00%cI --name-only`, newest first. */
export function latestDates(log: string) {
  const latest = new Map<string, string>()
  let date = ''
  for (const line of log.split('\n')) {
    if (line.startsWith('\0')) date = line.slice(1)
    else if (line && !latest.has(line)) latest.set(line, date)
  }
  return latest
}

/** What each page file (`components/button.mdx`) is about, and when any of it last changed. */
export function pageMetaFrom(
  latest: Map<string, string> | null,
  files: string[],
  items: { name: string; files?: { path: string }[] }[],
  packages: readonly string[],
): Record<string, PageMeta> {
  const meta: Record<string, PageMeta> = {}
  for (const file of files) {
    const name = file.replace(/^.*\//, '').replace(/\.mdx$/, '')
    // Its own item, or for a block page the numbered ones (`hero-01`): never `button-group` for `button`.
    const own = items.filter((item) => item.name === name)
    const shown = own.length ? own : items.filter((item) => item.name.startsWith(`${name}-`))
    const npm = packages.includes(name) ? name : undefined
    const sources = [
      `apps/docs/src/content/${file}`,
      ...shown.flatMap((item) => (item.files ?? []).map((f) => `packages/ui/${f.path}`)),
    ]
    let updated: string | undefined
    if (latest) {
      for (const [path, date] of latest) {
        const related =
          sources.includes(path) || (npm !== undefined && path.startsWith(`packages/${npm}/src/`))
        if (related && (!updated || date > updated)) updated = date
      }
    }
    meta[file] = { updated, items: shown.map((item) => item.name), npm }
  }
  return meta
}

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()

/**
 * The repository's history, or null without all of it. Vercel clones only the last commits, and
 * there every older file would look changed on the oldest commit it has: better no date than a
 * wrong one.
 */
function history() {
  try {
    if (git('rev-parse', '--is-shallow-repository') === 'true') {
      git('fetch', '--unshallow', '--quiet', `${site.github}.git`)
      if (git('rev-parse', '--is-shallow-repository') === 'true') return null
    }
    return latestDates(
      git('log', '--format=%x00%cI', '--name-only', '--', 'apps/docs/src/content', 'packages'),
    )
  } catch (error) {
    console.warn('page-meta: no dates,', (error as Error).message)
    return null
  }
}

export function pageMeta(): Plugin {
  return {
    name: 'page-meta',
    resolveId: (id) => (id === VIRTUAL ? `\0${VIRTUAL}` : null),
    load(id) {
      if (id !== `\0${VIRTUAL}`) return null
      const registry = join(repo, 'packages/ui/registry.json')
      const items = existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf8')).items : []
      const meta = pageMetaFrom(
        history(),
        pages.map((page) => page.file),
        items,
        PACKAGES,
      )
      return `export default ${JSON.stringify(meta)}`
    },
  }
}
