import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { Global01 } from './global-01'
import { Hero03 } from './hero-03'
import { Team01 } from './team-01'
import { Testimonials02 } from './testimonials-02'

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

describe('Hero03', () => {
  it('names the section by its headline and shows both devices', () => {
    render(<Hero03 />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Start free',
      'Get the app',
    ])
    expect(screen.getByText('app.example.com/week')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Today on the phone' })).toBeTruthy()
  })

  it('leaves the phone out when asked', () => {
    render(<Hero03 mobile={null} secondaryAction={null} />)
    expect(screen.queryByRole('img', { name: 'Today on the phone' })).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})

describe('Testimonials02', () => {
  it('folds after six posts and opens to all of them', async () => {
    const user = userEvent.setup()
    render(<Testimonials02 />)
    const button = screen.getByRole('button', { name: 'Show more' })
    const wall = document.getElementById(button.getAttribute('aria-controls') ?? '')
    expect(wall && within(wall).getAllByRole('listitem')).toHaveLength(6)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    await user.click(button)
    expect(wall && within(wall).getAllByRole('listitem')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
  })

  it('shows everything without a button when it all fits', () => {
    render(<Testimonials02 initial={0} />)
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull()
  })
})

describe('Team01', () => {
  it('lists the people with named links and a hiring card', () => {
    render(<Team01 />)
    const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(names).toContain('Ana Ruiz')
    expect(names.at(-1)).toBe('We are hiring')
    expect(screen.getByRole('link', { name: 'Email Ana' }).getAttribute('href')).toBe(
      'mailto:ana@example.com',
    )
  })

  it('shows initials for someone without a photo', () => {
    render(<Team01 members={[{ name: 'Mia Larsen', role: 'Ops' }]} hiring={null} />)
    expect(screen.getByText('ML')).toBeTruthy()
    expect(screen.queryByText('We are hiring')).toBeNull()
  })
})

describe('Global01', () => {
  it('pairs region figures with a labelled globe', () => {
    render(<Global01 />)
    const regions = screen.getAllByRole('term').map((dt) => dt.textContent)
    expect(regions).toEqual(['Americas', 'Europe', 'Asia Pacific', 'Regions served'])
    expect(
      screen.getByRole('img', { name: 'A globe marking the cities where teams use the product' }),
    ).toBeTruthy()
  })
})
