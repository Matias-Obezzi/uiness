import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { docsMarkdownFiles } from '../scripts/docs-markdown'
import {
  itemsOnPage,
  llmsTxt,
  type MarkdownContext,
  markdownPath,
  mdxToMarkdown,
} from '../src/lib/markdown'
import { findPage } from '../src/lib/nav'

const ctx: MarkdownContext = {
  siteUrl: 'https://uiness.vercel.app',
  namespace: '@uiness',
  demoSource: (name) =>
    name === 'thing-demo'
      ? "import { Thing } from '@/components/ui/thing'\nimport { helper } from '~/lib/helper'\n\nexport default function ThingDemo() {\n  return <Thing />\n}\n"
      : undefined,
}

const page = { slug: 'components/thing', title: 'Thing', description: 'Does a thing.' }

function pageAt(slug: string) {
  const found = findPage(slug)
  if (!found) throw new Error(`No page at ${slug}`)
  return found
}

const content = (file: string) =>
  readFileSync(new URL(`../src/content/${file}`, import.meta.url), 'utf8')

/** Lines outside code fences, where no JSX may be left. */
function prose(md: string) {
  let fenced = false
  return md.split('\n').filter((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      return false
    }
    return !fenced
  })
}

describe('mdxToMarkdown', () => {
  it('starts with the title, the description and the page address', () => {
    const md = mdxToMarkdown('Hello.', page, ctx)
    expect(md.split('\n').slice(0, 5)).toEqual([
      '# Thing',
      '',
      '> Does a thing.',
      '',
      'Docs: https://uiness.vercel.app/docs/components/thing',
    ])
  })

  it('replaces a preview with the source of its demo, with project imports', () => {
    const md = mdxToMarkdown('<ComponentPreview name="thing-demo" align="start" />', page, ctx)
    expect(md).toContain("```tsx\nimport { Thing } from '@/components/ui/thing'\n")
    expect(md).not.toContain('~/lib/helper')
    expect(md).not.toContain('ComponentPreview')
    expect(mdxToMarkdown('<ComponentPreview name="nope" />', page, ctx)).toContain(
      '_Demo `nope` not found._',
    )
  })

  it('turns install blocks into the shadcn command and explains the registry once', () => {
    const md = mdxToMarkdown(
      '<Install name="thing" extra="Brings button along." />\n\n<Install name="other" />',
      page,
      ctx,
    )
    expect(md).toContain('```bash\nnpx shadcn@latest add @uiness/thing\n```')
    expect(md).toContain('```bash\nnpx shadcn@latest add @uiness/other\n```')
    expect(md).toContain('Brings button along.')
    expect(md.match(/registries/g)).toHaveLength(1)
  })

  it('leaves code fences alone, JSX and all', () => {
    const mdx = '```tsx\n<Install name="thing" />\n<Tab title="x">\n```'
    expect(mdxToMarkdown(mdx, page, ctx)).toContain(mdx)
  })

  it('reads tabs as headings and drops layout wrappers', () => {
    const md = mdxToMarkdown(
      '<Tabs>\n<Tab title="Cursor">\n\n```json\n{}\n```\n\n</Tab>\n</Tabs>',
      page,
      ctx,
    )
    expect(md).toContain('### Cursor\n\n```json\n{}\n```')
    expect(md).not.toMatch(/<\/?Tabs?\b/)
  })

  it('points site links at the Markdown pages', () => {
    const md = mdxToMarkdown(
      'See [Button](/docs/components/button#props), [the docs](/docs) and [Themes](/themes).',
      page,
      ctx,
    )
    expect(md).toContain('[Button](https://uiness.vercel.app/docs/components/button.md#props)')
    expect(md).toContain('[the docs](https://uiness.vercel.app/docs.md)')
    expect(md).toContain('[Themes](https://uiness.vercel.app/themes)')
  })

  it('converts the installation page', () => {
    const md = mdxToMarkdown(content('installation.mdx'), pageAt('installation'), ctx)
    expect(md).toContain(
      '`components.json`\n\n```json\n{\n  "registries": {\n    "@uiness": "https://uiness.vercel.app/r/{name}.json"\n  }\n}\n```',
    )
    expect(md).toContain('npx shadcn@latest add @uiness/theme')
    expect(md).toContain(
      'npx shadcn@latest add @uiness/dialog @uiness/dropdown-menu @uiness/island',
    )
    expect(md).toContain('npm install @uiness/image @uiness/island')
    expect(md).toContain(
      '[https://uiness.vercel.app/r/button.json](https://uiness.vercel.app/r/button.json)',
    )
    expect(prose(md).join('\n')).not.toMatch(/<[A-Z]/)
  })

  it('converts a component page with demos and props', () => {
    const real = {
      ...ctx,
      demoSource: (name: string) => (name.startsWith('button') ? 'x' : undefined),
    }
    const md = mdxToMarkdown(content('components/button.mdx'), pageAt('components/button'), real)
    expect(md).toContain('## Props')
    expect(md).toContain('| `variant` |')
    expect(md).toContain('npx shadcn@latest add @uiness/button')
    expect(md).not.toContain('not found')
  })

  it('converts a blocks page, pointing at each block source', () => {
    const md = mdxToMarkdown(content('blocks/hero.mdx'), pageAt('blocks/hero'), ctx)
    expect(md).toContain('https://uiness.vercel.app/r/hero-01.json')
    expect(md).toContain('npx shadcn@latest add @uiness/hero-02')
    expect(md).not.toContain('BlockPreview')
  })
})

describe('itemsOnPage', () => {
  it('lists what a page installs or previews, ignoring code', () => {
    expect(
      itemsOnPage(
        '<BlockPreview name="hero-01" />\n<Install name="hero-01" />\n```\n<Install name="no" />\n```\n<Install name="hero-02" />',
      ),
    ).toEqual(['hero-01', 'hero-02'])
  })
})

describe('the generated files', () => {
  const files = docsMarkdownFiles()

  it('has a Markdown page for every docs page and no JSX left in the prose', () => {
    expect(files.has('docs.md')).toBe(true)
    expect(files.has('docs/components/button.md')).toBe(true)
    for (const [path, md] of files) {
      if (!path.endsWith('.md')) continue
      const leftovers = prose(md).filter((line) => /^\s*<\/?[A-Z]/.test(line))
      expect(leftovers, path).toEqual([])
      expect(md, path).not.toContain('not found._')
    }
  })

  it('writes llms.txt in the llmstxt.org shape', () => {
    const txt = files.get('llms.txt') ?? ''
    expect(txt.startsWith('# uiness\n\n> ')).toBe(true)
    expect(txt).toContain('## Getting started')
    expect(txt).toContain(
      '- [Installation](https://uiness.vercel.app/docs/installation.md): Add the registry to your project and install your first component.',
    )
    expect(txt).toContain('(https://uiness.vercel.app/docs.md)')
    expect(files.get('llms-full.txt')).toContain('# Button\n\n> Triggers an action')
  })

  it('maps registry items to their pages', () => {
    const index = JSON.parse(files.get('docs/pages.json') ?? '{}')
    expect(index.items.button).toBe('components/button')
    expect(index.items['hero-02']).toBe('blocks/hero')
    expect(index.items['labels-es']).toBe('localization')
    expect(index.items.theme).toBe('theming')
  })

  it('names the Markdown of the introduction /docs.md', () => {
    expect(markdownPath('')).toBe('/docs.md')
    expect(
      llmsTxt([{ title: 'A', pages: [{ slug: 'x', title: 'X', description: 'D' }] }], ctx),
    ).toContain('- [X](https://uiness.vercel.app/docs/x.md): D')
  })
})
