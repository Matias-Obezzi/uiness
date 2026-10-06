import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  closest,
  createCatalog,
  MAX_CHARS,
  markdownSection,
  truncate,
} from '../api/_lib/catalog.js'
import { handleMcpRequest, httpLoader, TOOLS } from '../api/_lib/server.js'
import { docsMarkdownFiles } from '../scripts/docs-markdown'

const ui = new URL('../../../packages/ui/', import.meta.url)
const registry = JSON.parse(readFileSync(new URL('registry.json', ui), 'utf8')) as {
  items: { name: string; files?: { path: string }[] }[]
}
const docs = docsMarkdownFiles()

/** What the deployment serves, built the way `shadcn build` and the docs build write it. */
async function load(path: string): Promise<string> {
  if (path === '/r/registry.json') return JSON.stringify(registry)
  const item = path.match(/^\/r\/(.+)\.json$/)?.[1]
  if (item) {
    const found = registry.items.find((i) => i.name === item)
    if (!found) throw new Error(`${path} answered 404`)
    return JSON.stringify({
      ...found,
      files: found.files?.map((f) => ({
        ...f,
        content: readFileSync(new URL(f.path, ui), 'utf8'),
      })),
    })
  }
  const file = docs.get(path.slice(1))
  if (file === undefined) throw new Error(`${path} answered 404`)
  return file
}

let catalog = createCatalog(load)
beforeEach(() => {
  catalog = createCatalog(load)
})

let nextId = 1
function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://uiness.test/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Protocol-Version': '2025-06-18',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

async function rpc(method: string, params?: unknown) {
  const response = await handleMcpRequest(
    post({ jsonrpc: '2.0', id: nextId++, method, params }),
    catalog,
  )
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  return (await response.json()) as {
    result?: Record<string, unknown>
    error?: { code: number; message: string }
  }
}

async function call(name: string, args: Record<string, unknown> = {}) {
  const { result, error } = await rpc('tools/call', { name, arguments: args })
  expect(error).toBeUndefined()
  const content = result?.content as { type: string; text: string }[]
  return { text: content[0]?.text ?? '', isError: result?.isError === true }
}

describe('the MCP endpoint', () => {
  it('initializes without a session, in JSON', async () => {
    const response = await handleMcpRequest(
      post(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'test', version: '0' },
          },
        },
        { 'Mcp-Protocol-Version': '' },
      ),
      catalog,
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('mcp-session-id')).toBeNull()
    const body = await response.json()
    expect(body.result.protocolVersion).toBe('2025-06-18')
    expect(body.result.serverInfo).toMatchObject({ name: 'uiness', version: '1.0.0' })
    expect(body.result.capabilities.tools).toBeDefined()
    expect(body.result.instructions).toContain('search_items')
  })

  it('accepts the initialized notification and pings', async () => {
    const response = await handleMcpRequest(
      post({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      catalog,
    )
    expect(response.status).toBe(202)
    expect((await rpc('ping')).result).toEqual({})
  })

  it('lists the tools with their schemas', async () => {
    const { result } = await rpc('tools/list')
    const tools = result?.tools as { name: string; inputSchema: { type: string } }[]
    expect(tools.map((t) => t.name)).toEqual([
      'search_items',
      'list_items',
      'get_item',
      'get_docs',
      'get_setup',
    ])
    for (const tool of tools) expect(tool.inputSchema.type).toBe('object')
    expect(TOOLS.find((t) => t.name === 'get_item')?.inputSchema.required).toEqual(['name'])
  })

  it('answers a CORS preflight', async () => {
    const response = await handleMcpRequest(
      new Request('https://uiness.test/api/mcp', { method: 'OPTIONS' }),
      catalog,
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-methods')).toContain('POST')
    expect(response.headers.get('access-control-allow-headers')).toContain('Mcp-Protocol-Version')
  })

  it('opens no SSE stream, and describes itself to a browser', async () => {
    const sse = await handleMcpRequest(
      new Request('https://uiness.test/api/mcp', { headers: { Accept: 'text/event-stream' } }),
      catalog,
    )
    expect(sse.status).toBe(405)
    const page = await handleMcpRequest(new Request('https://uiness.test/api/mcp'), catalog)
    expect(page.status).toBe(200)
    expect((await page.json()).name).toBe('uiness')
  })

  it('answers an unknown tool with a JSON-RPC error', async () => {
    const { error } = await rpc('tools/call', { name: 'nope', arguments: {} })
    expect(error?.code).toBe(-32602)
    expect(error?.message).toContain('Unknown tool')
  })

  it('answers an unknown method with a JSON-RPC error', async () => {
    const { error } = await rpc('prompts/list')
    expect(error?.code).toBe(-32601)
  })
})

describe('search_items', () => {
  it('ranks the exact name first', async () => {
    const { text, isError } = await call('search_items', { query: 'button' })
    expect(isError).toBe(false)
    expect(text).toMatch(/^1 result|^\d+ results/)
    expect(text).toContain('1. button (ui) Button:')
    expect(text).toContain('install: npx shadcn@latest add @uiness/button')
    expect(text).toContain('https://uiness.vercel.app/docs/components/button.md')
  })

  it('finds by description and filters by type', async () => {
    const { text } = await call('search_items', { query: 'pricing', type: 'block' })
    expect(text).toContain('pricing-01 (block)')
    expect(text).not.toContain('(ui)')
  })

  it('finds docs pages and aliases', async () => {
    expect((await call('search_items', { query: 'theming', type: 'docs' })).text).toContain(
      'Theming (docs page, Getting started)',
    )
    expect((await call('search_items', { query: 'modal' })).text).toContain('dialog (ui)')
  })

  it('says so when nothing matches, and rejects bad arguments', async () => {
    expect((await call('search_items', { query: 'zzqqxx' })).text).toContain('Nothing matches')
    expect((await call('search_items', {})).isError).toBe(true)
    expect((await call('search_items', { query: 'x', type: 'widget' })).isError).toBe(true)
  })
})

describe('list_items', () => {
  it('groups every item by type', async () => {
    const { text } = await call('list_items')
    expect(text).toContain('## ui (')
    expect(text).toContain('## block (')
    expect(text).toContain('- hero-01: ')
    expect(text.match(/^- /gm)).toHaveLength(registry.items.length)
  })

  it('filters by type', async () => {
    const { text } = await call('list_items', { type: 'hook' })
    expect(text).toContain('## hook (3)')
    expect(text).not.toContain('## ui')
    expect((await call('list_items', { type: 'nope' })).isError).toBe(true)
  })
})

describe('get_item', () => {
  it('returns the install command, dependencies, sources and docs', async () => {
    const { text, isError } = await call('get_item', { name: '@uiness/button' })
    expect(isError).toBe(false)
    expect(text).toContain('# Button (`button`, ui)')
    expect(text).toContain('- Install: `npx shadcn@latest add @uiness/button`')
    expect(text).toContain('@uiness/spinner')
    expect(text).toContain('### registry/ui/button.tsx → components/ui/button.tsx')
    expect(text).toContain('function Button(')
    expect(text).toContain("from '@/components/ui/spinner'")
    expect(text).toContain('## Props')
  })

  it('leaves the docs out on request, and handles items with no files', async () => {
    expect((await call('get_item', { name: 'button', docs: false })).text).not.toContain('## Props')
    const theme = await call('get_item', { name: 'theme' })
    expect(theme.text).toContain('## CSS variables')
  })

  it('suggests the closest names for an unknown one', async () => {
    const { text, isError } = await call('get_item', { name: 'buton' })
    expect(isError).toBe(true)
    expect(text).toContain('Closest: button')
    expect((await call('get_item', {})).isError).toBe(true)
  })

  it('keeps big items under the limit', async () => {
    const { text } = await call('get_item', { name: 'rich-text-editor' })
    expect(text.length).toBeLessThanOrEqual(MAX_CHARS + 200)
  })
})

describe('get_docs', () => {
  it('returns a page by slug, URL or item name', async () => {
    expect((await call('get_docs', { slug: 'installation' })).text).toContain('# Installation')
    expect(
      (await call('get_docs', { slug: 'https://uiness.vercel.app/docs/components/button.md' }))
        .text,
    ).toContain('# Button')
    expect((await call('get_docs', { slug: 'hero-01' })).text).toContain('# Hero')
    expect((await call('get_docs', { slug: '' })).text).toContain('# Introduction')
    expect((await call('get_docs', { slug: 'motion/marquee' })).text).toContain('# Marquee')
  })

  it('suggests slugs for an unknown page', async () => {
    const { text, isError } = await call('get_docs', { slug: 'theming-guide' })
    expect(isError).toBe(true)
    expect(text).toContain('theming')
  })
})

describe('get_setup', () => {
  it('has the registry entry, the theme, cn() and localization', async () => {
    const { text } = await call('get_setup')
    expect(text).toContain('"@uiness": "https://uiness.vercel.app/r/{name}.json"')
    expect(text).toContain('npx shadcn@latest add @uiness/theme')
    expect(text).toContain('export function cn(')
    expect(text).toContain('## LabelsProvider')
    expect(text).toContain("import { es } from '@/lib/labels-es'")
    expect(text).toContain('--background')
  })
})

describe('failures', () => {
  it('reports a registry it cannot read as a tool error', async () => {
    catalog = createCatalog(() => Promise.reject(new Error('/r/registry.json answered 500')))
    const { text, isError } = await call('list_items')
    expect(isError).toBe(true)
    expect(text).toContain('answered 500')
  })

  it('caches what it loads, but not failures', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValue(new Response('ok'))
    const read = httpLoader('https://uiness.test', { fetcher })
    await expect(read('/llms.txt')).rejects.toThrow('answered 500')
    expect(await read('/llms.txt')).toBe('ok')
    expect(await read('/llms.txt')).toBe('ok')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher).toHaveBeenLastCalledWith('https://uiness.test/llms.txt', { headers: {} })
  })

  it('reads from the fallback when its own deployment is protected', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('login', { status: 401 }))
      .mockResolvedValue(new Response('from production'))
    const read = httpLoader('https://preview.test', {
      fetcher,
      headers: { 'x-vercel-protection-bypass': 'secret' },
      fallback: 'https://uiness.test',
    })
    expect(await read('/llms.txt')).toBe('from production')
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://preview.test/llms.txt', {
      headers: { 'x-vercel-protection-bypass': 'secret' },
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://uiness.test/llms.txt', {
      headers: { 'x-vercel-protection-bypass': 'secret' },
    })
  })

  it('does not fall back on other errors', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('boom', { status: 500 }))
    const read = httpLoader('https://preview.test', { fetcher, fallback: 'https://uiness.test' })
    await expect(read('/llms.txt')).rejects.toThrow('answered 500')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('helpers', () => {
  it('truncates with a note', () => {
    const long = 'x\n'.repeat(MAX_CHARS)
    const out = truncate(long, 'Read it there.')
    expect(out.length).toBeLessThan(MAX_CHARS + 100)
    expect(out).toContain('Read it there.')
    expect(truncate('short', 'x')).toBe('short')
  })

  it('finds close names and Markdown sections', () => {
    expect(closest('date picker', ['date-picker', 'button', 'calendar'])[0]).toBe('date-picker')
    expect(markdownSection('# A\n\n## B\n\nb\n\n```\n## not\n```\n\n## C\n\nc', 'B')).toBe(
      '## B\n\nb\n\n```\n## not\n```',
    )
  })
})
