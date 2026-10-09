import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { BattlePass01 } from './battle-pass-01'
import { Hero04 } from './hero-04'
import { Leaderboard01 } from './leaderboard-01'
import { PatchNotes01 } from './patch-notes-01'
import { Player01 } from './player-01'
import { Shop01 } from './shop-01'

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

afterEach(() => {
  vi.useRealTimers()
})

describe('Hero04', () => {
  it('names the section by the game and offers both actions', () => {
    render(<Hero04 />)
    expect(screen.getByRole('region', { name: 'Neon Drift' })).toBeTruthy()
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Play free',
      'Watch trailer',
    ])
    expect(screen.getByText('Players online')).toBeTruthy()
  })

  it('leaves out what is set to null or empty', () => {
    render(<Hero04 eyebrow={null} secondaryAction={null} platforms={[]} stats={[]} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByText('Players online')).toBeNull()
    expect(screen.queryByText('PC')).toBeNull()
  })
})

describe('Leaderboard01', () => {
  const players = (prefix: string) =>
    ['A', 'B', 'C', 'D'].map((n, i) => ({
      id: `${prefix}${n}`.toLowerCase(),
      name: `${prefix}${n}`,
      level: 50 - i,
      score: 1000 - i * 100,
      winRate: 0.6,
      change: i === 1 ? -2 : 1,
    }))
  const boards = [
    { id: 'global', label: 'Global', players: players('G') },
    { id: 'friends', label: 'Friends', players: players('F') },
  ]

  it('reads the podium in rank order and marks the reader', () => {
    render(<Leaderboard01 boards={boards} you="gb" />)
    const podium = screen.getAllByRole('list')[0] as HTMLElement
    expect(
      within(podium)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      expect.stringContaining('GA'),
      expect.stringContaining('GB'),
      expect.stringContaining('GC'),
    ])
    const mine = screen.getAllByRole('row').find((r) => r.getAttribute('aria-current'))
    expect(mine?.textContent).toContain('GB')
    expect(mine?.textContent).toContain('You')
    expect(within(mine as HTMLElement).getByText('Down 2')).toBeTruthy()
    expect(within(podium).getByText('Rank 1')).toBeTruthy()
  })

  it('switches boards', async () => {
    render(<Leaderboard01 boards={boards} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Friends' }))
    expect(screen.getAllByRole('row')[1]?.textContent).toContain('FA')
  })
})

describe('Player01', () => {
  it('shows experience, career and how many achievements are unlocked', () => {
    render(<Player01 />)
    expect(screen.getByRole('region', { name: /Hexa/ })).toBeTruthy()
    const xp = screen.getByRole('progressbar', { name: 'Experience' })
    expect(xp.getAttribute('aria-valuenow')).toBe('6400')
    expect(xp.getAttribute('aria-valuemax')).toBe('9000')
    expect(screen.getByText('3/6')).toBeTruthy()
    expect(screen.getAllByText('Win')).toHaveLength(3)
    expect(screen.getByText('Diamond II')).toBeTruthy()
  })
})

describe('PatchNotes01', () => {
  it('shows changes from old value to new, and keeps one kind with the filter', async () => {
    render(<PatchNotes01 />)
    expect(screen.getByText('24').tagName).toBe('DEL')
    expect(screen.getByText('28').tagName).toBe('INS')
    await userEvent.click(screen.getByRole('radio', { name: /Nerf/ }))
    expect(screen.getByText('Kairo')).toBeTruthy()
    expect(screen.queryByText('Vex')).toBeNull()
    expect(screen.queryByText('Neon Docks')).toBeNull()
  })

  it('disables kinds the patch has none of', () => {
    render(
      <PatchNotes01
        sections={[
          { id: 's', title: 'S', entries: [{ target: 'T', kind: 'fix', changes: ['x'] }] },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: /Buff/ }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('radio', { name: /Fix/ }).hasAttribute('disabled')).toBe(false)
  })
})

describe('BattlePass01', () => {
  it('counts down to the end of the season', () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-08T12:00:00Z').getTime()
    vi.setSystemTime(now)
    render(<BattlePass01 endsAt={now + 2 * 86400000 + 3 * 3600000 + 61000} />)
    expect(screen.getByText('2d 03h 01m')).toBeTruthy()
    act(() => vi.advanceTimersByTime(60000))
    expect(screen.getByText('2d 03h 00m')).toBeTruthy()
  })

  it('keeps premium rewards locked until the pass is owned', async () => {
    const onUnlock = vi.fn()
    const { rerender } = render(<BattlePass01 tier={3} onUnlock={onUnlock} />)
    expect(screen.getByText(/Tier 2, Free: .* claimed/)).toBeTruthy()
    expect(screen.getByText(/Tier 2, Premium: .* locked/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Unlock premium/ }))
    expect(onUnlock).toHaveBeenCalledTimes(1)

    rerender(<BattlePass01 tier={3} premium />)
    expect(screen.queryByRole('button', { name: /Unlock premium/ })).toBeNull()
    expect(screen.getByText('Premium unlocked')).toBeTruthy()
    expect(screen.getByText(/Tier 2, Premium: .* claimed/)).toBeTruthy()
  })
})

describe('Shop01', () => {
  const items = [
    { id: 'a', name: 'Alpha', type: 'Outfit', rarity: 'rare' as const, price: 300 },
    { id: 'b', name: 'Beta', type: 'Emote', rarity: 'epic' as const, price: 800 },
  ]

  it('takes the price off, marks the item owned and stops what is now too dear', async () => {
    const onBuy = vi.fn()
    render(<Shop01 featured={null} items={items} owned={[]} balance={1000} onBuy={onBuy} />)
    await userEvent.click(screen.getByRole('button', { name: 'Buy Alpha' }))
    expect(onBuy).toHaveBeenCalledWith(items[0])
    expect(screen.getByText('Balance: 700 credits')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Owned/ })).toHaveProperty('disabled', true)
    const beta = screen.getByRole('button', { name: 'Buy Beta' })
    expect(beta).toHaveProperty('disabled', true)
    expect(beta.getAttribute('title')).toBe('Not enough credits')
  })

  it('counts down to the next rotation', () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-08T12:00:00Z').getTime()
    vi.setSystemTime(now)
    render(<Shop01 resetsAt={now + 3723000} />)
    expect(screen.getByRole('timer').textContent).toBe('01:02:03')
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByRole('timer').textContent).toBe('01:02:00')
  })
})
