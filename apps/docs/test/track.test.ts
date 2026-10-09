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

  it.each([
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
