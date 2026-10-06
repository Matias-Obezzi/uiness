// What the MCP tools know and say: the registry and the docs, read through `load` from the
// files the site serves (/r/registry.json, /r/<name>.json, /docs/pages.json, /docs/<slug>.md).
// No network or SDK in here, so it runs the same in the function, the tests and the smoke check.
//
// Plain JavaScript with JSDoc types: Vercel compiles TypeScript functions with the project's
// own `typescript` package, and TypeScript 7 no longer ships the compiler API it calls.

/**
 * @typedef {(path: string) => Promise<string>} Load
 *   Reads a file the site serves, by its absolute path, like `/r/button.json`. Rejects when
 *   it is not there.
 *
 * @typedef {{ path: string, type: string, target?: string, content?: string }} RegistryFile
 *
 * @typedef {{
 *   name: string,
 *   type: string,
 *   title?: string,
 *   description?: string,
 *   dependencies?: string[],
 *   devDependencies?: string[],
 *   registryDependencies?: string[],
 *   files?: RegistryFile[],
 *   cssVars?: Record<string, unknown>,
 *   css?: Record<string, unknown>,
 * }} RegistryItem
 *
 * @typedef {{ slug: string, title: string, description: string, url: string, markdown: string }} DocsPage
 *
 * @typedef {{
 *   site: string,
 *   sections: { title: string, pages: DocsPage[] }[],
 *   items: Record<string, string>,
 * }} DocsIndex
 *
 * @typedef {{
 *   kind: 'item' | 'docs',
 *   name: string,
 *   title: string,
 *   type: string,
 *   description: string,
 *   section?: string,
 *   page?: DocsPage,
 * }} Entry
 *
 * @typedef {{ text: string, isError?: boolean }} ToolOutput
 */

export const NAMESPACE = '@uiness'

/** Longest answer, in characters. Past it the text is cut with a note on where to read the rest. */
export const MAX_CHARS = 80_000

/** Item types as the tools name them. */
export const ITEM_TYPES = /** @type {const} */ (['ui', 'block', 'hook', 'lib', 'theme', 'file'])

/** `registry:ui` → `ui`. */
export const shortType = (/** @type {string} */ type) => type.replace(/^registry:/, '')

export const installCommand = (/** @type {string} */ name) =>
  `npx shadcn@latest add ${NAMESPACE}/${name}`

/** @type {Record<string, string>} */
const folders = {
  'registry:ui': 'components/ui',
  'registry:block': 'components',
  'registry:hook': 'hooks',
  'registry:lib': 'lib',
}

/** Where the shadcn CLI writes a file in a project with the default aliases. */
export function targetPath(/** @type {RegistryFile} */ file) {
  if (file.target) return file.target.replace(/^~\//, '')
  const base = file.path.split('/').pop() ?? file.path
  return `${folders[file.type] ?? 'components'}/${base}`
}

/** Older registry files imported components as `@/ui/x`; a project with default aliases has `@/components/ui/x`. */
export const toProjectImports = (/** @type {string} */ source) =>
  source.replace(/from '@\/ui\//g, "from '@/components/ui/")

/** Cut a long answer, saying where the whole thing is. */
export function truncate(/** @type {string} */ text, /** @type {string} */ rest) {
  if (text.length <= MAX_CHARS) return text
  const cut = text.lastIndexOf('\n', MAX_CHARS)
  return `${text.slice(0, cut > MAX_CHARS / 2 ? cut : MAX_CHARS)}\n\n[Truncated at ${MAX_CHARS} characters. ${rest}]`
}

/** Edit distance, for "did you mean". */
function distance(/** @type {string} */ a, /** @type {string} */ b) {
  /** @type {number[]} */
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    /** @type {number[]} */
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost)
    }
    prev = row
  }
  return prev[b.length] ?? 0
}

/**
 * The closest names to a misspelled one: names that contain it or share a word first, then by
 * edit distance. Far-off names are left out unless nothing is close.
 */
export function closest(/** @type {string} */ wanted, /** @type {string[]} */ names, count = 5) {
  const w = wanted.toLowerCase()
  const near = Math.max(2, Math.ceil(w.length * 0.4))
  const ranked = names
    .map((name) => {
      const n = name.toLowerCase()
      const contains = n.includes(w) || w.includes(n)
      const sharesWord = w
        .split(/[^a-z0-9]+/)
        .some((part) => part && n.split(/[-/]/).includes(part))
      const d = distance(w, n)
      return {
        name,
        close: contains || sharesWord || d <= near,
        score: d - (contains ? 10 : 0) - (sharesWord ? 3 : 0),
      }
    })
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
  const close = ranked.filter((c) => c.close)
  return (close.length ? close : ranked.slice(0, 3)).slice(0, count).map((c) => c.name)
}

/** One `## Heading` section of a Markdown page, without the ones after it. Skips code fences. */
export function markdownSection(/** @type {string} */ md, /** @type {string} */ heading) {
  const lines = md.split('\n')
  /** @type {string[]} */
  const out = []
  let inside = false
  let fenced = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (!fenced && /^##\s/.test(line)) {
      if (inside) break
      inside =
        line
          .replace(/^##\s+/, '')
          .trim()
          .toLowerCase() === heading.toLowerCase()
    }
    if (inside) out.push(line)
  }
  return out.join('\n').trim()
}

/** Words people use for things the registry names differently. */
/** @type {Record<string, string[]>} */
const aliases = {
  modal: ['dialog'],
  popup: ['popover', 'dialog'],
  dropdown: ['dropdown-menu', 'select'],
  menu: ['dropdown-menu', 'context-menu'],
  notification: ['toast', 'notification-center'],
  snackbar: ['toast'],
  i18n: ['labels', 'localization'],
  translation: ['labels', 'localization'],
  translate: ['labels', 'localization'],
  language: ['labels', 'localization'],
  dark: ['theme-switch', 'theme'],
  drag: ['sortable', 'draggable', 'kanban', 'dnd'],
  dnd: ['sortable', 'draggable', 'kanban'],
  upload: ['dropzone', 'file-upload-01'],
  date: ['calendar', 'date-picker', 'date-range-picker'],
  graph: ['chart', 'bar-chart', 'line-chart'],
  loader: ['spinner', 'skeleton'],
  loading: ['spinner', 'skeleton'],
  table: ['data-table'],
  login: ['auth-01', 'sign-in-01'],
  signin: ['auth-01', 'sign-in-01'],
  header: ['navbar', 'navbar-01', 'page-header-01'],
  landing: ['hero-01', 'features-01', 'pricing-01', 'cta-01'],
  animation: ['reveal', 'choreo'],
}

/** Words that say nothing about what is wanted. */
const stopwords = new Set(
  'a an and are as at be by component components for from i in into is it me my of on or that the this to ui uiness use want with'.split(
    ' ',
  ),
)

/** @param {string} text */
const words = (text) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/**
 * How well an entry matches a query: the name counts most, then the title, then the
 * description. At least half the meaningful words have to match somewhere, and the more of
 * them match, the higher the entry goes.
 * @param {Entry} entry
 * @param {string} query
 */
export function score(entry, query) {
  const q = query.trim().toLowerCase()
  const dashed = q.replace(/\s+/g, '-')
  const name = entry.name.toLowerCase()
  const title = entry.title.toLowerCase()
  const description = entry.description.toLowerCase()
  const nameWords = name.split(/[-/]/)
  let total = 0
  if (name === q || name === dashed || title === q) total += 100
  else if (name.startsWith(dashed)) total += 50
  else if (name.includes(dashed) || title.includes(q)) total += 30

  const wanted = words(q).filter((w) => !stopwords.has(w))
  let matched = 0
  for (const word of wanted) {
    let best = 0
    if (nameWords.includes(word)) best = 20
    else if (name.includes(word)) best = 12
    if (words(title).includes(word)) best = Math.max(best, 15)
    else if (title.includes(word)) best = Math.max(best, 8)
    if (words(description).includes(word)) best = Math.max(best, 6)
    else if (description.includes(word) && word.length > 3) best = Math.max(best, 3)
    const alias = aliases[word]?.some((a) => name === a || name.startsWith(`${a}-`)) ? 10 : 0
    best = Math.max(best, alias)
    if (best > 0) matched++
    total += best
  }
  if (wanted.length > 0) {
    if (matched < Math.ceil(wanted.length / 2)) return total >= 100 ? total : 0
    total = Math.round((total * matched) / wanted.length)
  }
  if (total === 0) return 0
  // Items before docs pages on a tie, since they are what gets installed.
  return total + (entry.kind === 'item' ? 1 : 0)
}

/**
 * The registry and the docs, read once per instance through `load`.
 * @param {Load} load
 */
export function createCatalog(load) {
  /** @type {Promise<{ items: RegistryItem[], docs: DocsIndex, entries: Entry[] }> | null} */
  let indexPromise = null

  const index = () => {
    indexPromise ??= Promise.all([load('/r/registry.json'), load('/docs/pages.json')]).then(
      ([registryText, docsText]) => {
        const items = /** @type {{ items: RegistryItem[] }} */ (JSON.parse(registryText)).items
        const docs = /** @type {DocsIndex} */ (JSON.parse(docsText))
        const named = new Set(items.map((i) => i.name))
        // A few basics have no description in the registry: their docs page has one.
        for (const item of items) {
          item.description ||= pageOfItem(docs, item.name)?.description ?? ''
        }
        /** @type {Entry[]} */
        const entries = items.map((item) => ({
          kind: 'item',
          name: item.name,
          title: item.title ?? item.name,
          type: shortType(item.type),
          description: item.description ?? '',
        }))
        // Pages that are not the page of one item: getting started, packages, block families.
        for (const section of docs.sections) {
          for (const page of section.pages) {
            const last = page.slug.split('/').pop() ?? ''
            if (named.has(last)) continue
            entries.push({
              kind: 'docs',
              name: page.slug || 'introduction',
              title: page.title,
              type: 'docs',
              description: page.description,
              section: section.title,
              page,
            })
          }
        }
        return { items, docs, entries }
      },
    )
    indexPromise.catch(() => {
      indexPromise = null
    })
    return indexPromise
  }

  /** @param {DocsIndex} docs @param {string} slug */
  const findPage = (docs, slug) =>
    docs.sections.flatMap((s) => s.pages).find((p) => p.slug === slug)

  /** @param {DocsIndex} docs @param {string} name */
  const pageOfItem = (docs, name) => {
    const slug = docs.items[name]
    return slug === undefined ? undefined : findPage(docs, slug)
  }

  /** The Markdown of a page; its HTML version is the same address without `.md`. */
  const links = (/** @type {DocsIndex} */ docs, /** @type {DocsPage | undefined} */ page) =>
    page ? `${docs.site}${page.markdown}` : 'no docs page'

  /** @param {{ query?: unknown, type?: unknown, limit?: unknown }} args @returns {Promise<ToolOutput>} */
  async function searchItems(args) {
    const query = typeof args.query === 'string' ? args.query.trim() : ''
    if (!query)
      return { text: '`query` is required: words describing what you need.', isError: true }
    const type = args.type
    if (
      type !== undefined &&
      (typeof type !== 'string' || ![...ITEM_TYPES, 'docs'].includes(type))
    ) {
      return {
        text: `Unknown type "${String(type)}". Use one of: ${[...ITEM_TYPES, 'docs'].join(', ')}.`,
        isError: true,
      }
    }
    const limit =
      typeof args.limit === 'number' && args.limit > 0 ? Math.min(Math.floor(args.limit), 50) : 10
    const { docs, entries } = await index()
    const ranked = entries
      .filter((e) => type === undefined || e.type === type)
      .map((e) => ({ e, s: score(e, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
      .slice(0, limit)

    if (ranked.length === 0) {
      const names = entries.filter((e) => e.kind === 'item').map((e) => e.name)
      return {
        text: `Nothing matches "${query}"${type ? ` among ${type} items` : ''}. Closest names: ${closest(query, names).join(', ')}. Try fewer or other words, or list_items to browse.`,
      }
    }

    const lines = ranked.map(({ e }, i) => {
      if (e.kind === 'docs') {
        return `${i + 1}. ${e.title} (docs page, ${e.section}): ${e.description}\n   get_docs slug: "${e.page?.slug || 'introduction'}" · ${links(docs, e.page)}`
      }
      return `${i + 1}. ${e.name} (${e.type}) ${e.title}: ${e.description}\n   install: ${installCommand(e.name)} · docs: ${links(docs, pageOfItem(docs, e.name))}`
    })
    return {
      text: `${ranked.length} result${ranked.length === 1 ? '' : 's'} for "${query}":\n\n${lines.join('\n')}\n\nget_item returns an item's source and docs; get_docs returns a page by slug.`,
    }
  }

  /** @param {{ type?: unknown }} args @returns {Promise<ToolOutput>} */
  async function listItems(args) {
    const type = args.type
    if (
      type !== undefined &&
      (typeof type !== 'string' || !ITEM_TYPES.includes(/** @type {never} */ (type)))
    ) {
      return {
        text: `Unknown type "${String(type)}". Use one of: ${ITEM_TYPES.join(', ')}.`,
        isError: true,
      }
    }
    const { items } = await index()
    const groups = ITEM_TYPES.filter((t) => type === undefined || t === type)
      .map((t) => {
        const list = items
          .filter((i) => shortType(i.type) === t)
          .sort((a, b) => a.name.localeCompare(b.name))
        if (list.length === 0) return ''
        const rows = list.map((i) => `- ${i.name}: ${i.description || i.title || ''}`)
        return `## ${t} (${list.length})\n\n${rows.join('\n')}`
      })
      .filter(Boolean)
    return {
      text: `${groups.join('\n\n')}\n\nInstall any of them with \`${installCommand('<name>')}\`. get_item returns the source.`,
    }
  }

  /** @param {{ name?: unknown, docs?: unknown }} args @returns {Promise<ToolOutput>} */
  async function getItem(args) {
    const raw = typeof args.name === 'string' ? args.name.trim() : ''
    if (!raw) return { text: '`name` is required, like "button" or "hero-01".', isError: true }
    const name = raw
      .replace(/^@uiness\//, '')
      .replace(/\.json$/, '')
      .toLowerCase()
    const { items, docs } = await index()
    if (!items.some((i) => i.name === name)) {
      const suggestions = closest(
        name,
        items.map((i) => i.name),
      )
      return {
        text: `No registry item is called "${raw}". Closest: ${suggestions.join(', ')}. search_items finds items by what they do.`,
        isError: true,
      }
    }

    const item = /** @type {RegistryItem} */ (JSON.parse(await load(`/r/${name}.json`)))
    const page = pageOfItem(docs, name)
    const json = `${docs.site}/r/${name}.json`
    const parts = [
      `# ${item.title ?? name} (\`${name}\`, ${shortType(item.type)})`,
      '',
      item.description ?? '',
      '',
      `- Install: \`${installCommand(name)}\``,
      `- Docs: ${page ? `${page.url} (Markdown: ${links(docs, page)})` : 'no docs page; the source below is the reference'}`,
      `- npm dependencies: ${item.dependencies?.length ? item.dependencies.join(', ') : 'none'}`,
      `- Registry dependencies (installed along with it): ${item.registryDependencies?.length ? item.registryDependencies.join(', ') : 'none'}`,
      `- JSON: ${json}`,
    ]
    if (item.devDependencies?.length)
      parts.push(`- npm dev dependencies: ${item.devDependencies.join(', ')}`)
    if (item.cssVars) {
      parts.push(
        '',
        '## CSS variables',
        '',
        '```json',
        JSON.stringify(item.cssVars, null, 2),
        '```',
      )
    }
    if (item.css) parts.push('', '## CSS', '', '```json', JSON.stringify(item.css, null, 2), '```')

    const files = item.files ?? []
    if (files.length) {
      parts.push(
        '',
        '## Files',
        '',
        'Paths after the arrow are where the CLI writes each file with the default aliases. Imports are shown as they land in such a project.',
      )
      for (const file of files) {
        const lang = file.path.split('.').pop() ?? ''
        parts.push(
          '',
          `### ${file.path} → ${targetPath(file)}`,
          '',
          `\`\`\`${lang}`,
          toProjectImports(file.content ?? '').replace(/\n+$/, ''),
          '```',
        )
      }
    }

    let text = parts.join('\n')
    if (args.docs !== false && page) {
      try {
        const md = await load(page.markdown)
        text =
          text.length + md.length + 40 <= MAX_CHARS
            ? `${text}\n\n---\n\n${md}`
            : `${text}\n\n---\n\nThe docs page is long; read it with get_docs({ slug: "${page.slug}" }).`
      } catch {
        text = `${text}\n\n---\n\nDocs page: ${page.url}`
      }
    }
    return { text: truncate(text, `The whole item is at ${json}.`) }
  }

  /** @param {{ slug?: unknown }} args @returns {Promise<ToolOutput>} */
  async function getDocs(args) {
    const raw = typeof args.slug === 'string' ? args.slug.trim() : ''
    const { docs } = await index()
    const pages = docs.sections.flatMap((s) => s.pages)
    const slug = raw
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/^\/?docs\/?/, '')
      .replace(/^\//, '')
      .replace(/\.md$/, '')
      .replace(/\/$/, '')
      .toLowerCase()
    const page = ['', 'introduction', 'index', 'intro'].includes(slug)
      ? findPage(docs, '')
      : (findPage(docs, slug) ??
        pageOfItem(docs, slug) ??
        pages.find((p) => p.title.toLowerCase() === slug.replace(/-/g, ' ')))
    if (!page) {
      const suggestions = closest(slug, pages.map((p) => p.slug).filter(Boolean))
      return {
        text: `No docs page at "${raw}". Closest: ${suggestions.join(', ')}. Slugs look like "installation", "theming", "components/button", "blocks/hero" or "motion/marquee"; llms.txt lists them all.`,
        isError: true,
      }
    }
    const md = await load(page.markdown)
    return { text: truncate(md, `The whole page is at ${docs.site}${page.markdown}.`) }
  }

  /** @returns {Promise<ToolOutput>} */
  async function getSetup() {
    const { docs } = await index()
    const [installation, localization, theming, utils] = await Promise.all([
      load('/docs/installation.md'),
      load('/docs/localization.md'),
      load('/docs/theming.md'),
      load('/r/utils.json'),
    ])
    const utilsSource =
      /** @type {RegistryItem} */ (JSON.parse(utils)).files?.[0]?.content?.replace(/\n+$/, '') ?? ''
    const text = [
      '# Setting up uiness in a project',
      '',
      'uiness items are installed as source with the shadcn CLI, into a React project with Tailwind CSS v4. In order:',
      '',
      `1. Add the registry to \`components.json\` (run \`npx shadcn@latest init\` first if there is none): \`"registries": { "${NAMESPACE}": "${docs.site}/r/{name}.json" }\`.`,
      `2. Install the theme: \`${installCommand('theme')}\`, and make sure the global CSS imports \`tailwindcss\` and \`tw-animate-css\`.`,
      `3. Add items: \`${installCommand('<name>')}\`. Their npm dependencies, the \`cn()\` helper (\`lib/utils.ts\`) and the items they build on come along.`,
      '4. Every word a component shows can be changed with its `labels` prop or, app-wide, with `LabelsProvider` from `lib/labels.tsx` and a ready-made pack (`labels-es`, `labels-pt`, `labels-fr`, `labels-it`, `labels-zh`, `labels-en`).',
      '',
      '---',
      '',
      installation.trim(),
      '',
      '---',
      '',
      '## The cn() helper (lib/utils.ts, item `utils`)',
      '',
      'Every component merges its classes with it. It is installed with the first component; to add it alone:',
      '',
      '```bash',
      installCommand('utils'),
      '```',
      '',
      '```ts',
      utilsSource,
      '```',
      '',
      '---',
      '',
      '# Theme tokens (from Theming)',
      '',
      markdownSection(theming, 'Variables'),
      '',
      `More on dark mode, layers, motion and type: ${docs.site}/docs/theming.md`,
      '',
      '---',
      '',
      '# Localization (from Localization)',
      '',
      markdownSection(localization, 'The labels prop'),
      '',
      markdownSection(localization, 'LabelsProvider'),
      '',
      markdownSection(localization, 'Ready-made packs'),
      '',
      `Locale, your own packs and your own components: ${docs.site}/docs/localization.md`,
    ].join('\n')
    return { text: truncate(text, `Read ${docs.site}/docs/installation.md instead.`) }
  }

  return { index, searchItems, listItems, getItem, getDocs, getSetup }
}
