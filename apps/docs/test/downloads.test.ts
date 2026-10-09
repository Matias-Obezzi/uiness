import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, PACKAGES } from '../api/downloads.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/downloads', () => {
  it('adds up every package and lets the CDN keep it for hours', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Response.json({ downloads: url.endsWith('/toast') ? 300 : 100 }),
    )
    const response = await GET()
    const body = await response.json()
    expect(body.packages.toast).toBe(300)
    expect(Object.keys(body.packages)).toHaveLength(PACKAGES.length)
    expect(body.total).toBe(300 + 100 * (PACKAGES.length - 1))
    expect(response.headers.get('cache-control')).toContain('s-maxage=21600')
  })

  it('leaves out what npm did not answer, and keeps that only briefly', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/fx')) throw new Error('timeout')
      if (url.endsWith('/dnd')) return Response.json({ error: 'not found' }, { status: 404 })
      return Response.json({ downloads: 10 })
    })
    const response = await GET()
    const body = await response.json()
    expect(body.packages.fx).toBeUndefined()
    expect(body.packages.dnd).toBeUndefined()
    expect(body.total).toBe(10 * (PACKAGES.length - 2))
    expect(response.headers.get('cache-control')).toContain('s-maxage=300')
  })
})
