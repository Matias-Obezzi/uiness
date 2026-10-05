import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Blog01 } from './blog-01'
import { Changelog01 } from './changelog-01'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

const entries = () => [...document.querySelectorAll<HTMLElement>('[data-slot=changelog-entry]')]
const titles = () => entries().map((e) => e.querySelector('h4')?.textContent)

describe('Changelog01', () => {
  it('groups entries by month, opens the newest and links to the feed', () => {
    render(<Changelog01 locale="en-US" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'September 2026',
      'August 2026',
      'July 2026',
    ])
    expect(entries()).toHaveLength(6)
    expect(entries()[0]?.dataset.state).toBe('open')
    expect(entries()[1]?.dataset.state).toBe('closed')
    expect(screen.getByText('v2.4.0')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Subscribe' }).getAttribute('href')).toBe('#')
    // An entry with nothing more to say has no button to open it.
    const last = entries()[5] as HTMLElement
    expect(within(last).queryByRole('button')).toBeNull()
  })

  it('filters by tag and opens one entry at a time', async () => {
    const user = userEvent.setup()
    render(<Changelog01 locale="en-US" />)
    const chips = screen.getByRole('group', { name: 'Filter by tag' })
    const fix = within(chips).getByRole('button', { name: /Fix/ })
    expect(fix.textContent).toContain('2')

    await user.click(fix)
    expect(fix.getAttribute('aria-pressed')).toBe('true')
    expect(titles()).toEqual(['Fixes for date pickers and exports', 'Notification fixes'])

    await user.click(within(chips).getByRole('button', { name: /All/ }))
    expect(entries()).toHaveLength(6)

    await user.click(
      within(entries()[1] as HTMLElement).getByRole('button', { name: 'Show details' }),
    )
    expect(entries()[1]?.dataset.state).toBe('open')
    expect(entries()[0]?.dataset.state).toBe('closed')
    await user.click(
      within(entries()[1] as HTMLElement).getByRole('button', { name: 'Hide details' }),
    )
    expect(entries()[1]?.dataset.state).toBe('closed')
  })

  it('takes entries, tags and words from props', async () => {
    const user = userEvent.setup()
    render(
      <Changelog01
        locale="en-US"
        eyebrow={null}
        title="Releases"
        subscribe={null}
        defaultOpen={null}
        tags={['Feature', 'Security']}
        labels={{ empty: 'Nothing here.', all: 'Everything' }}
        entries={[
          {
            version: '1.0.0',
            date: '2026-01-15',
            title: 'First',
            summary: 'Hello',
            tags: ['Feature'],
            details: 'More.',
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Releases')
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('January 2026')
    expect(screen.queryByRole('link', { name: 'Subscribe' })).toBeNull()
    expect(entries()[0]?.dataset.state).toBe('closed')
    await user.click(screen.getByRole('button', { name: /Security/ }))
    expect(screen.getByText('Nothing here.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Everything/ }))
    expect(titles()).toEqual(['First'])
  })
})

const cards = () =>
  screen
    .getAllByRole('listitem')
    .filter((li) => li.querySelector('article'))
    .map((li) => li.querySelector('h3')?.textContent)

describe('Blog01', () => {
  it('leads with the featured post and pages through the rest', async () => {
    const user = userEvent.setup()
    render(<Blog01 locale="en-US" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getByText('Featured')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Designing for the second visit' })).toBeTruthy()
    expect(cards()).toHaveLength(6)

    const pages = screen.getByRole('navigation', { name: 'Pages' })
    expect(within(pages).getByRole('button', { name: '1' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(
      within(pages)
        .getByRole('button', { name: /Previous/ })
        .hasAttribute('disabled'),
    ).toBe(true)
    await user.click(within(pages).getByRole('button', { name: /Next/ }))
    expect(cards()).toEqual([
      'A type scale that survives real content',
      'Rebuilding search, one shard at a time',
    ])
    expect(within(pages).getByText('Page 2 of 2')).toBeTruthy()
  })

  it('filters by category, hiding the featured post and the pages', async () => {
    const user = userEvent.setup()
    render(<Blog01 />)
    const chips = screen.getByRole('group', { name: 'Filter by category' })
    await user.click(within(chips).getByRole('button', { name: 'Engineering' }))
    expect(screen.queryByText('Featured')).toBeNull()
    expect(cards()).toEqual([
      'Taking Postgres to the edge, carefully',
      'An on-call rotation people do not dread',
      'Rebuilding search, one shard at a time',
    ])
    expect(screen.queryByRole('navigation', { name: 'Pages' })).toBeNull()
  })

  it('opens a post in the reader', async () => {
    const user = userEvent.setup()
    const onOpenPost = vi.fn()
    render(<Blog01 onOpenPost={onOpenPost} />)
    await user.click(screen.getByRole('button', { name: 'Taking Postgres to the edge, carefully' }))
    expect(onOpenPost).toHaveBeenCalledWith('postgres-to-the-edge')
    const reader = await screen.findByRole('dialog')
    expect(within(reader).getByRole('heading', { name: /Taking Postgres/ })).toBeTruthy()
    expect(within(reader).getByText(/Read replicas close to users/)).toBeTruthy()
    await user.click(within(reader).getByRole('button', { name: 'Close article' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows an empty list and the excerpt when a post has no body', async () => {
    const user = userEvent.setup()
    render(
      <Blog01
        perPage={1}
        posts={[
          {
            slug: 'a',
            title: 'Alpha',
            excerpt: 'Just the excerpt.',
            category: 'News',
            date: '2026-01-02',
            author: { name: 'Ada Lovelace' },
          },
          {
            slug: 'b',
            title: 'Beta',
            excerpt: 'B.',
            category: 'News',
            date: '2026-01-01',
            author: { name: 'Grace Hopper' },
          },
        ]}
      />,
    )
    expect(cards()).toEqual(['Alpha'])
    expect(screen.getAllByText('AL').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Alpha' }))
    const reader = await screen.findByRole('dialog')
    expect(within(reader).getAllByText('Just the excerpt.').length).toBeGreaterThan(0)
  })
})
