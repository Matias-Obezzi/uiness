import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseEvent } from '../api/_lib/track.js'

const queries: string[] = []
const pending: Promise<unknown>[] = []

vi.mock('@neondatabase/serverless', () => ({
  // A database that never answers.
  neon: () => (strings: TemplateStringsArray) => {
    queries.push(strings.join('?'))
    return new Promise(() => {})
  },
}))
vi.mock('@vercel/functions', () => ({
  waitUntil: (promise: Promise<unknown>) => pending.push(promise),
}))

const beacon = (body: unknown) =>
  new Request('https://uiness.test/api/track', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('parseEvent', () => {
  it('keeps known kinds on plain paths', () => {
    expect(parseEvent('{"type":"view","path":"/docs/components/button"}')).toEqual({
      type: 'view',
      path: '/docs/components/button',
    })
    expect(parseEvent('{"type":"install","path":"/"}')).toMatchObject({ type: 'install' })
  })

  it('keeps a short plain value, like the words searched or a preset', () => {
    expect(parseEvent('{"type":"search-empty","path":"/docs","value":"  date range  "}')).toEqual({
      type: 'search-empty',
      path: '/docs',
      value: 'date range',
    })
    const long = parseEvent(JSON.stringify({ type: 'search', path: '/', value: 'x'.repeat(300) }))
    expect(long?.value).toHaveLength(100)
  })

  it.each([
    // Escaped in the JSON, so it gets past the parser and has to be caught by the check.
    [
      'a value with a control character',
      String.raw`{"type":"theme","path":"/","value":"Ne\u0000on"}`,
    ],
    ['a value that is not text', '{"type":"theme","path":"/","value":42}'],
    ['a kind only the server writes', '{"type":"mcp","path":"/mcp/get_item"}'],
    ['not json', 'nope'],
    ['an unknown kind', '{"type":"drop","path":"/"}'],
    ['a full URL', '{"type":"view","path":"https://evil.test/"}'],
    ['a query string', '{"type":"view","path":"/docs?x=<script>"}'],
    ['a long path', JSON.stringify({ type: 'view', path: `/${'a'.repeat(300)}` })],
    ['no path', '{"type":"view"}'],
  ])('drops %s', (_, body) => {
    expect(parseEvent(body)).toBeNull()
  })
})

describe('POST /api/track', () => {
  beforeEach(() => {
    queries.length = 0
    pending.length = 0
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    vi.stubEnv('VERCEL_ENV', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('answers right away and writes after, even with a database that never answers', async () => {
    const { POST } = await import('../api/track.js')
    const response = await POST(beacon({ type: 'view', path: '/docs/dnd' }))
    expect(response.status).toBe(204)
    expect(pending).toHaveLength(1)
    expect(queries[0]).toContain('create table if not exists events')
  })

  it('records nothing outside production, or for a bad event', async () => {
    const { POST } = await import('../api/track.js')
    expect((await POST(beacon('junk'))).status).toBe(204)
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect((await POST(beacon({ type: 'view', path: '/' }))).status).toBe(204)
    expect(pending).toHaveLength(0)
  })
})

describe('middleware: installs from the CLI', () => {
  beforeEach(() => {
    queries.length = 0
    pending.length = 0
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    vi.stubEnv('VERCEL_ENV', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const get = (path: string, headers: Record<string, string> = {}) =>
    new Request(`https://uiness.test${path}`, { headers: { 'user-agent': 'node', ...headers } })

  it('counts a tool fetching an item and lets the file through untouched', async () => {
    const { default: middleware } = await import('../middleware.js')
    const later: Promise<unknown>[] = []
    const response = middleware(get('/r/button.json'), { waitUntil: (p) => later.push(p) })
    expect(response.headers.get('x-middleware-next')).toBe('1')
    // Handed to the middleware's own waitUntil, not awaited.
    expect(later).toHaveLength(1)
    expect(pending).toHaveLength(0)
  })

  it.each([
    ['a browser', get('/r/button.json', { 'user-agent': 'Mozilla/5.0 Chrome' })],
    ['the index a search reads', get('/r/registry.json')],
    ['the site’s own MCP server', get('/r/button.json', { 'x-uiness-internal': '1' })],
    ['anything that is not an item', get('/r/styles/theme.css')],
  ])('leaves out %s', async (_, request) => {
    const { isInstall } = await import('../middleware.js')
    expect(isInstall(request)).toBe(false)
  })
})
