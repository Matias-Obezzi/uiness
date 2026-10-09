import { afterEach, describe, expect, it, vi } from 'vitest'
import { latestDates, pageMetaFrom } from '../scripts/page-meta'

const rows: { path: string; n: number }[] = []
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

describe('GET /api/installs', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    failing = false
  })

  it('counts installs per item and lets the CDN keep them for an hour', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    rows.splice(
      0,
      rows.length,
      { path: '/r/button.json', n: 12 },
      { path: '/r/hero-01.json', n: 3 },
    )
    const { GET } = await import('../api/installs.js')
    const response = await GET()
    expect(await response.json()).toEqual({ button: 12, 'hero-01': 3 })
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
  })

  it('answers empty, briefly, before the first install or with Neon down', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://test')
    failing = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { GET } = await import('../api/installs.js')
    const response = await GET()
    expect(await response.json()).toEqual({})
    expect(response.headers.get('cache-control')).toContain('s-maxage=300')
  })
})
