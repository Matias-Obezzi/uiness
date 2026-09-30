import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hero01 } from './hero-01'

describe('Hero01', () => {
  it('renders a labelled section with the default copy and actions', () => {
    render(<Hero01 />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Get started/ }).getAttribute('href')).toBe('#')
    expect(screen.getByRole('link', { name: 'Browse blocks' })).toBeTruthy()
  })

  it('takes its words and links from props, and hides what is not given', () => {
    render(
      <Hero01
        announcement={null}
        title="Plan the week in"
        highlight="five minutes"
        description="One calendar for everything."
        primaryAction={{ label: 'Start free', href: '/signup' }}
        secondaryAction={null}
        note={null}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Plan the week in five minutes',
    )
    expect(screen.getByRole('link', { name: /Start free/ }).getAttribute('href')).toBe('/signup')
    expect(screen.queryByRole('link', { name: 'Browse blocks' })).toBeNull()
    expect(screen.queryByText(/open source/)).toBeNull()
  })
})
