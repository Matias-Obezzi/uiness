/**
 * Turns the MDX pages into plain Markdown for agents and LLMs: `/docs/<slug>.md` for every page,
 * `/llms.txt` and `/llms-full.txt`. Pure functions with no file system or browser access, so the
 * build, the dev server and the tests share them.
 */

export interface MarkdownPage {
  /** Route slug after /docs/. Empty for the introduction. */
  slug: string
  title: string
  description: string
}

export interface MarkdownSection {
  title: string
  pages: MarkdownPage[]
}

export interface MarkdownContext {
  /** Where the docs live, without a trailing slash. */
  siteUrl: string
  /** Registry namespace, like `@uiness`. */
  namespace: string
  /** The source of a demo in src/demos, by file name without extension. */
  demoSource: (name: string) => string | undefined
}

/** The page on the site. The introduction is /docs. */
export const pageUrl = (siteUrl: string, slug: string) =>
  slug ? `${siteUrl}/docs/${slug}` : `${siteUrl}/docs`

/** Where the Markdown of a page is served: its address with `.md` on the end. */
export const markdownPath = (slug: string) => (slug ? `/docs/${slug}.md` : '/docs.md')

/** Turn the docs import paths into the ones a project gets after installing. */
export function forDisplay(source: string) {
  return source
    .replace(/from '@\/ui\//g, "from '@/components/ui/")
    .replace(/^import [^\n]* from '~\/[^']+'\n/gm, '')
}

/** `name="x" extra="y"` → `{ name: 'x', extra: 'y' }`. Only string attributes are used. */
function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of tag.matchAll(/([A-Za-z]+)="([^"]*)"/g)) {
    const [, key, value] = match
    if (key && value !== undefined) out[key] = value
  }
  return out
}

const fence = (lang: string, code: string, title?: string) =>
  `${title ? `\`${title}\`\n\n` : ''}\`\`\`${lang}\n${code.replace(/\n+$/, '')}\n\`\`\``

/** Code fences open with three or more backticks or tildes; the same run closes them. */
const FENCE = /^\s*(`{3,}|~{3,})/

/** Registry items a page installs or previews, in the order they appear. */
export function itemsOnPage(mdx: string): string[] {
  const names: string[] = []
  let open: string | null = null
  for (const line of mdx.split('\n')) {
    const marker = line.match(FENCE)?.[1]
    if (marker) {
      if (open === null) open = marker
      else if (marker.startsWith(open)) open = null
      continue
    }
    if (open !== null) continue
    const tag = line.match(/^\s*<(Install|BlockPreview)\s[^>]*\/>/)
    const name = tag && attributes(tag[0]).name
    if (name && !names.includes(name)) names.push(name)
  }
  return names
}

/** Replace inline JSX outside code spans, leaving `<Like this />` in backticks alone. */
function inline(line: string, ctx: MarkdownContext): string {
  return line
    .split(/(`[^`]*`)/)
    .map((part, i) => {
      if (i % 2 === 1) return part
      return part.replace(/<RegistryLink\s+name="([^"]+)"\s*\/>/g, (_, name: string) => {
        const url = `${ctx.siteUrl}/r/${name}.json`
        return `[${url}](${url})`
      })
    })
    .join('')
}

/** Site links point at the Markdown pages, so an agent following them stays in Markdown. */
function absoluteLinks(line: string, siteUrl: string): string {
  return line.replace(/\]\((\/[^)\s]*)\)/g, (_, href: string) => {
    const [path = '', hash] = href.split('#')
    const anchor = hash ? `#${hash}` : ''
    if (path === '/docs' || path === '/docs/') return `](${siteUrl}/docs.md${anchor})`
    if (path.startsWith('/docs/')) {
      return `](${siteUrl}${path.replace(/\/$/, '')}.md${anchor})`
    }
    return `](${siteUrl}${path}${anchor})`
  })
}

/**
 * One MDX page as Markdown: the title, description and address first, then the prose, tables
 * and code as written. Previews become the demo's source, install blocks the shadcn command.
 * Components that only draw something on the page are dropped.
 */
export function mdxToMarkdown(mdx: string, page: MarkdownPage, ctx: MarkdownContext): string {
  const out: string[] = [
    `# ${page.title}`,
    '',
    `> ${page.description}`,
    '',
    `Docs: ${pageUrl(ctx.siteUrl, page.slug)}`,
    '',
  ]
  const registrySetup = `${ctx.siteUrl}/docs/installation.md`
  // The installation page is where the registry setup is explained, so it needs no note.
  let explainedRegistry = page.slug === 'installation'
  let open: string | null = null

  for (const line of mdx.split('\n')) {
    const marker = line.match(FENCE)?.[1]
    if (marker) {
      if (open === null) open = marker
      else if (marker.startsWith(open) && line.trim() === marker) open = null
      out.push(line)
      continue
    }
    if (open !== null) {
      out.push(line)
      continue
    }

    const trimmed = line.trim()
    // MDX comments.
    if (/^\{\/\*.*\*\/\}$/.test(trimmed)) continue

    const tag = trimmed.match(/^<\/?([A-Z][A-Za-z]*)\b[^>]*?(\/?)>$/)
    if (!tag) {
      out.push(absoluteLinks(inline(line, ctx), ctx.siteUrl))
      continue
    }

    const [, component] = tag
    const closing = trimmed.startsWith('</')
    const attrs = attributes(trimmed)

    switch (closing ? '' : component) {
      case 'ComponentPreview': {
        const name = attrs.name ?? ''
        const source = ctx.demoSource(name)
        out.push(
          source === undefined ? `_Demo \`${name}\` not found._` : fence('tsx', forDisplay(source)),
        )
        break
      }
      case 'BlockPreview': {
        const name = attrs.name ?? ''
        out.push(
          `_Live preview of the \`${name}\` block on the docs page. Its full source is in the registry item: ${ctx.siteUrl}/r/${name}.json_`,
        )
        break
      }
      case 'Install': {
        const name = attrs.name ?? ''
        out.push(fence('bash', `npx shadcn@latest add ${ctx.namespace}/${name}`))
        if (attrs.extra) out.push('', attrs.extra)
        if (!explainedRegistry) {
          explainedRegistry = true
          out.push(
            '',
            `The \`${ctx.namespace}\` registry must be in the \`registries\` of \`components.json\` first: \`"${ctx.namespace}": "${ctx.siteUrl}/r/{name}.json"\`. See ${registrySetup}. Every item is also a JSON file with its source inline: ${ctx.siteUrl}/r/${name}.json`,
          )
        }
        break
      }
      case 'InstallPackage':
        out.push(fence('bash', `npm install ${attrs.name ?? ''}`))
        break
      case 'ShadcnCommand':
        out.push(fence('bash', `npx shadcn@latest ${attrs.args ?? ''}`))
        break
      case 'RegistryConfig':
        out.push(
          fence(
            'json',
            JSON.stringify(
              { registries: { [ctx.namespace]: `${ctx.siteUrl}/r/{name}.json` } },
              null,
              2,
            ),
            'components.json',
          ),
        )
        break
      case 'Tab':
        // Tabs read top to bottom in Markdown, one heading each.
        out.push(`### ${attrs.title ?? ''}`)
        break
      case 'Callout':
        if (attrs.title) out.push(`**${attrs.title}**`)
        break
      default:
        // A wrapper that only lays things out, like <Tabs> or <Steps>: keep what is inside.
        break
    }
  }

  return `${out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
}

/** The llms.txt index: what uiness is, then every page by section with its Markdown address. */
export function llmsTxt(
  sections: MarkdownSection[],
  ctx: Pick<MarkdownContext, 'siteUrl' | 'namespace'>,
): string {
  const lines = [
    '# uiness',
    '',
    '> React UI primitives with a bit of magic: a shadcn-compatible registry of Radix and Tailwind CSS v4 components, page blocks, drag and drop and motion pieces, installed as source with the shadcn CLI, plus small zero-dependency npm packages (image, island, fx, toast, scroll, dnd, choreo).',
    '',
    `Add the registry once to \`components.json\` (\`"registries": { "${ctx.namespace}": "${ctx.siteUrl}/r/{name}.json" }\`), then install any item with \`npx shadcn@latest add ${ctx.namespace}/<name>\`. Every registry item is also served as JSON with its source inline at \`${ctx.siteUrl}/r/<name>.json\`, and the whole index at \`${ctx.siteUrl}/r/registry.json\`.`,
    '',
    `Every docs page is available as Markdown by adding \`.md\` to its address, as listed below. All of them in one file: ${ctx.siteUrl}/llms-full.txt. An MCP server to search the registry, read the docs and fetch source: ${ctx.siteUrl}/api/mcp (Streamable HTTP, no key).`,
  ]
  for (const section of sections) {
    lines.push('', `## ${section.title}`, '')
    for (const page of section.pages) {
      lines.push(`- [${page.title}](${ctx.siteUrl}${markdownPath(page.slug)}): ${page.description}`)
    }
  }
  return `${lines.join('\n')}\n`
}

/** Every page's Markdown in one file, in the order of the sidebar. */
export function llmsFullTxt(pages: string[]): string {
  return `${pages.map((md) => md.trim()).join('\n\n---\n\n')}\n`
}
