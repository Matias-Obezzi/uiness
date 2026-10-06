// Markdown for agents, written next to the site: /docs/<slug>.md for every page (/docs.md for
// the introduction), /llms.txt, /llms-full.txt, /docs/pages.json (the index the MCP server
// reads) and the agent skill as a plain file at /skills/uiness/SKILL.md. Emitted by the build
// and served on the fly by the dev server.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import {
  itemsOnPage,
  llmsFullTxt,
  llmsTxt,
  type MarkdownContext,
  markdownPath,
  mdxToMarkdown,
  pageUrl,
} from '../src/lib/markdown.ts'
import { nav } from '../src/lib/nav.ts'
import { site } from '../src/lib/site.ts'

const docs = fileURLToPath(new URL('..', import.meta.url))
const ui = join(docs, '..', '..', 'packages', 'ui')
const registryJson = join(ui, 'registry.json')
const skill = join(ui, 'registry', 'skills', 'uiness', 'SKILL.md')

/** What /docs/pages.json holds. The MCP server reads it to find pages and the page of each item. */
export interface DocsIndex {
  site: string
  sections: {
    title: string
    pages: { slug: string; title: string; description: string; url: string; markdown: string }[]
  }[]
  /** Registry item name → slug of the page that documents it. */
  items: Record<string, string>
}

const read = (file: string) => readFileSync(file, 'utf8')

const context: MarkdownContext = {
  siteUrl: site.url,
  namespace: site.registryNamespace,
  demoSource: (name) => {
    const file = join(docs, 'src', 'demos', `${name}.tsx`)
    return existsSync(file) ? read(file) : undefined
  },
}

/** Items whose page none of the rules below would find. */
const pageOf: Record<string, string> = { theme: 'theming', utils: 'installation' }

/**
 * The page that documents each registry item: the one named after it, else the first that
 * installs or previews it outside Getting started, else any that does, else the first that
 * mentions it in code.
 */
function itemPages(sources: Map<string, string>): Record<string, string> {
  const registry = JSON.parse(read(registryJson)) as { items: { name: string }[] }
  const pages = nav.flatMap((section) => section.pages.map((p) => ({ ...p, section })))
  const installs = new Map(pages.map((p) => [p.slug, itemsOnPage(sources.get(p.slug) ?? '')]))
  const out: Record<string, string> = {}
  for (const { name } of registry.items) {
    const named = pages.find((p) => p.slug === name || p.slug.endsWith(`/${name}`))
    const installing = pages.filter((p) => installs.get(p.slug)?.includes(name))
    const page =
      pages.find((p) => p.slug === pageOf[name]) ??
      named ??
      installing.find((p) => p.section.title !== 'Getting started') ??
      installing[0] ??
      pages.find((p) => sources.get(p.slug)?.includes(`\`${name}\``))
    if (page) out[name] = page.slug
  }
  return out
}

/** Every file, by its path in the site, without the leading slash. */
export function docsMarkdownFiles(): Map<string, string> {
  const files = new Map<string, string>()
  const sources = new Map(
    nav.flatMap((s) => s.pages).map((p) => [p.slug, read(join(docs, 'src', 'content', p.file))]),
  )
  const full: string[] = []

  for (const section of nav) {
    for (const page of section.pages) {
      const md = mdxToMarkdown(sources.get(page.slug) ?? '', page, context)
      files.set(markdownPath(page.slug).slice(1), md)
      full.push(md)
    }
  }

  files.set('llms.txt', llmsTxt(nav, context))
  files.set('llms-full.txt', llmsFullTxt(full))

  const index: DocsIndex = {
    site: site.url,
    sections: nav.map((section) => ({
      title: section.title,
      pages: section.pages.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        url: pageUrl(site.url, p.slug),
        markdown: markdownPath(p.slug),
      })),
    })),
    items: itemPages(sources),
  }
  files.set('docs/pages.json', `${JSON.stringify(index, null, 2)}\n`)
  files.set('skills/uiness/SKILL.md', read(skill))
  return files
}

const types: Record<string, string> = {
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
}

export function docsMarkdown(): Plugin {
  return {
    name: 'docs-markdown',
    configureServer(server) {
      // Ahead of the single page app fallback, built fresh on each request so edits show up.
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]?.replace(/^\//, '') ?? ''
        if (!/^(docs(\/.*)?\.md|llms(-full)?\.txt|docs\/pages\.json|skills\/.+\.md)$/.test(path)) {
          return next()
        }
        const body = docsMarkdownFiles().get(decodeURIComponent(path))
        if (body === undefined) return next()
        res.setHeader('Content-Type', types[path.split('.').pop() ?? ''] ?? 'text/plain')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(body)
      })
    },
    generateBundle() {
      for (const [fileName, source] of docsMarkdownFiles()) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
