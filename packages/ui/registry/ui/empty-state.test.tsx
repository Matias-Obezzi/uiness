import { render, screen } from '@testing-library/react'
import { InboxIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('shows a built-in drawing, title, description and actions', () => {
    const { container } = render(
      <EmptyState
        illustration="no-results"
        title="No results"
        description="Try another word."
        actions={<button type="button">Clear search</button>}
      />,
    )
    const drawing = container.querySelector('[data-slot=empty-state-illustration]')
    expect(drawing?.getAttribute('data-name')).toBe('no-results')
    // Decoration only: the title says what it means.
    expect(drawing?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('heading', { level: 3, name: 'No results' })).toBeTruthy()
    expect(screen.getByText('Try another word.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeTruthy()
  })

  it('takes an icon, a heading level and a size', () => {
    const { container } = render(
      <EmptyState icon={<InboxIcon />} title="Inbox" titleAs="h2" size="sm" variant="dashed" />,
    )
    expect(container.querySelector('[data-slot=empty-state-icon] svg')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
    expect(container.firstElementChild?.className).toContain('border-dashed')
  })

  it('draws every built-in illustration', () => {
    for (const name of ['no-results', 'no-files', 'inbox-zero', 'error'] as const) {
      const { container, unmount } = render(<EmptyState illustration={name} />)
      expect(container.querySelector('svg')?.childElementCount).toBeGreaterThan(2)
      unmount()
    }
  })
})
