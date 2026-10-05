import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardDescription,
  ExpandableCardTitle,
  ExpandableCardTrigger,
} from './expandable-card'

function Example({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <ExpandableCard onOpenChange={onOpenChange}>
      <ExpandableCardTrigger>Northern lights</ExpandableCardTrigger>
      <ExpandableCardContent>
        <ExpandableCardTitle>Northern lights over Tromsø</ExpandableCardTitle>
        <ExpandableCardDescription>Shot in January.</ExpandableCardDescription>
        <button type="button">Download</button>
      </ExpandableCardContent>
    </ExpandableCard>
  )
}

describe('ExpandableCard', () => {
  // jsdom has no Web Animations, so this checks the behaviour the animation decorates: a named
  // dialog, focus moved in, and focus back on the card once it has folded back.
  it('opens a named dialog from the card and returns focus on Escape', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Example onOpenChange={onOpenChange} />)
    const card = screen.getByRole('button', { name: 'Northern lights' })
    expect(card.getAttribute('aria-haspopup')).toBe('dialog')

    await user.click(card)
    const dialog = screen.getByRole('dialog', { name: 'Northern lights over Tromsø' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(card.dataset.expanded).toBe('true')
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.activeElement).toBe(card)
    expect(card.dataset.expanded).toBeUndefined()
  })

  it('closes from its close button', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Northern lights' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
