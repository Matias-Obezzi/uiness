import { afterEach, describe, expect, it, vi } from 'vitest'
import { latestDates, pageMetaFrom } from '../scripts/page-meta'

// Both queries get these rows; the views one ignores rows without a week.
const rows: Record<string, unknown>[] = []
let failing = false
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async () => {
    if (failing) throw new Error('relation "events" does not exist')
    return rows
  },
}))

const log = [
  '\x002026-10-08T10:00:00Z',
  '',
  'packages/ui/registry/blocks/hero-02.tsx',
  'packages/dnd/src/hooks.ts',
  '\x002026-09-01T10:00:00Z',
  '',
  'apps/docs/src/content/components/button.mdx',
  'packages/ui/registry/ui/button-group.tsx',
  'packages/dnd/src/hooks.ts',
  '\x002026-08-01T10:00:00Z',
  '',
  'packages/ui/registry/ui/button.tsx',
  'apps/docs/src/content/blocks/hero.mdx',
].join('\n')

const items = [
  { name: 'button', files: [{ path: 'registry/ui/button.tsx' }] },
  { name: 'button-group', files: [{ path: 'registry/ui/button-group.tsx' }] },
  { name: 'hero-01', files: [{ path: 'registry/blocks/hero-01.tsx' }] },
  { name: 'hero-02', files: [{ path: 'registry/blocks/hero-02.tsx' }] },
]

describe('page meta', () => {
  it('keeps the newest date of each file', () => {
    expect(latestDates(log).get('packages/dnd/src/hooks.ts')).toBe('2026-10-08T10:00:00Z')
  })

  it('dates a page by its MDX and the code it documents, and lists its items', () => {
    const meta = pageMetaFrom(
      latestDates(log),
      ['components/button.mdx', 'blocks/hero.mdx', 'dnd.mdx'],
      items,
      ['dnd'],
    )
    // Not button-group: only its own item when it has one.
    expect(meta['components/button.mdx']).toEqual({
      updated: '2026-09-01T10:00:00Z',
      items: ['button'],
      npm: undefined,
    })
    // A block page shows the numbered blocks, and changes with any of them.
    expect(meta['blocks/hero.mdx']).toMatchObject({
      updated: '2026-10-08T10:00:00Z',
      items: ['hero-01', 'hero-02'],
    })
    expect(meta['dnd.mdx']).toMatchObject({ updated: '2026-10-08T10:00:00Z', npm: 'dnd' })
  })

  it('gives no dates without the history', () => {
    const meta = pageMetaFrom(null, ['components/button.mdx'], items, [])
    expect(meta['components/button.mdx']?.updated).toBeUndefined()
  })
})

describe('GET /api/usage', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    failing = false
  })

  it('counts installs per item and per page, all time and this month, for an hour', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    rows.splice(
      0,
      rows.length,
      { type: 'cli', path: '/r/button.json', total: 12, month: 4 },
      { type: 'install', path: '/docs/components/button', total: 3, month: 0 },
    )
    const { GET } = await import('../api/usage.js')
    const response = await GET()
    const usage = await response.json()
    expect(usage.installs).toEqual({
      items: { button: 12 },
      pages: { '/docs/components/button': 3 },
    })
    expect(usage.month).toEqual({ items: { button: 4 }, pages: {} })
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
  })

  it('answers empty, briefly, before the first event or with Neon down', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    failing = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { GET } = await import('../api/usage.js')
    const response = await GET()
    expect((await response.json()).installs).toEqual({ items: {}, pages: {} })
    expect(response.headers.get('cache-control')).toContain('s-maxage=300')
  })
})
