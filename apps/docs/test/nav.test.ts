import { describe, expect, it } from 'vitest'
import { isNew, type NavPage, pages } from '../src/lib/nav'

const day = 24 * 60 * 60 * 1000
const added = [...new Set(pages.map((p) => p.added).filter((d): d is string => !!d))].sort()
const page = (date: string): NavPage => ({
  slug: 'x',
  title: 'X',
  description: '',
  file: 'x.mdx',
  added: date,
})

describe('isNew', () => {
  it('marks pages from the latest two releases for a week', () => {
    const latest = added.at(-1) as string
    const previous = added.at(-2) as string
    const now = Date.parse(latest) + day
    expect(isNew(page(latest), now)).toBe(true)
    expect(isNew(page(previous), Math.max(now, Date.parse(previous) + day))).toBe(true)
  })

  it('stops after seven days', () => {
    const latest = added.at(-1) as string
    expect(isNew(page(latest), Date.parse(latest) + 8 * day)).toBe(false)
  })

  it('never marks older releases, however recent', () => {
    const older = added.at(-3) as string
    expect(isNew(page(older), Date.parse(older) + day)).toBe(false)
  })

  it('leaves pages without a release alone', () => {
    expect(isNew({ ...page('2026-01-01'), added: undefined })).toBe(false)
  })
})
