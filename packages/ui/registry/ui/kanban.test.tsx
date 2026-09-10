import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { type GroupsChange, Kanban, KanbanCard, KanbanColumn, KanbanHandle } from './kanban'

const COLUMNS = ['todo', 'doing', 'done']
const TITLES: Record<string, string> = { todo: 'To do', doing: 'Doing', done: 'Done' }
const GROUPS: Record<string, string[]> = { todo: ['a', 'b'], doing: ['c'], done: [] }

/** The card ids each column holds right now, read off the DOM. */
const board = () =>
  Object.fromEntries(
    COLUMNS.map((columnId) => [
      columnId,
      Array.from(
        document.querySelectorAll(`[data-dnd-container="${columnId}"] [data-slot=kanban-card]`),
      ).map((node) => node.getAttribute('data-dnd-id')),
    ]),
  )

function Board({
  withHandle,
  disabled,
  onChange,
}: {
  withHandle?: boolean
  disabled?: boolean
  onChange?: (groups: Record<string, string[]>, change: GroupsChange) => void
}) {
  const [groups, setGroups] = useState(GROUPS)
  return (
    <Kanban
      groups={groups}
      order={COLUMNS}
      withHandle={withHandle}
      disabled={disabled}
      onChange={(next, change) => {
        setGroups(next)
        onChange?.(next, change)
      }}
    >
      {(columnId, cards) => (
        <KanbanColumn key={columnId} id={columnId} title={TITLES[columnId]}>
          {cards.map((cardId) => (
            <KanbanCard key={cardId} id={cardId}>
              {withHandle ? <KanbanHandle /> : null}
              <span>{cardId}</span>
            </KanbanCard>
          ))}
        </KanbanColumn>
      )}
    </Kanban>
  )
}

describe('Kanban', () => {
  it('renders every column, including the empty one, with the cards it holds', () => {
    render(<Board />)
    expect(board()).toEqual({ todo: ['a', 'b'], doing: ['c'], done: [] })
    for (const title of Object.values(TITLES)) expect(screen.getByText(title)).toBeTruthy()
    expect(document.querySelector('[data-dnd-container="done"]')).toBeTruthy()
  })

  it('names each column from its title', () => {
    render(<Board />)
    const column = document.querySelector('[data-dnd-container="doing"]')
    const labelledBy = column?.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('Doing')
  })

  it('reorders a card inside its column with the keyboard', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      { todo: ['b', 'a'], doing: ['c'], done: [] },
      {
        id: 'a',
        from: { containerId: 'todo', index: 0 },
        to: { containerId: 'todo', index: 1 },
      },
    )
    expect(board().todo).toEqual(['b', 'a'])
  })

  it('carries a card across to the next column with the right arrow', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(
      { todo: ['b'], doing: ['a', 'c'], done: [] },
      {
        id: 'a',
        from: { containerId: 'todo', index: 0 },
        to: { containerId: 'doing', index: 0 },
      },
    )
    expect(board()).toEqual({ todo: ['b'], doing: ['a', 'c'], done: [] })
  })

  it('drops a card into a column that had nothing in it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)

    const card = screen.getByRole('button', { name: 'c' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(
      { todo: ['a', 'b'], doing: [], done: ['c'] },
      expect.objectContaining({ to: { containerId: 'done', index: 0 } }),
    )
    expect(board().done).toEqual(['c'])
  })

  it('keeps the focus on the card while it crosses columns', async () => {
    const user = userEvent.setup()
    render(<Board />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')

    // The card is re-rendered into another parent mid drag; the arrow keys have to keep working.
    expect(document.activeElement?.getAttribute('data-dnd-id')).toBe('a')
    await user.keyboard('{ArrowRight}')
    expect(document.querySelector('[data-dnd-container="done"] [data-dnd-id="a"]')).toBeTruthy()
  })

  it('marks the column under the drag with data-over', async () => {
    const user = userEvent.setup()
    render(<Board />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    expect(document.querySelector('[data-dnd-container="todo"]')?.hasAttribute('data-over')).toBe(
      true,
    )

    await user.keyboard('{ArrowRight}')
    expect(document.querySelector('[data-dnd-container="doing"]')?.hasAttribute('data-over')).toBe(
      true,
    )
    expect(document.querySelector('[data-dnd-container="todo"]')?.hasAttribute('data-over')).toBe(
      false,
    )
  })

  it('puts the card back in its column when escape cancels the drag', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    expect(board().doing).toEqual(['a', 'c'])

    await user.keyboard('{Escape}')

    expect(onChange).not.toHaveBeenCalled()
    expect(board()).toEqual({ todo: ['a', 'b'], doing: ['c'], done: [] })
  })

  it('reads the drag out into a live region', async () => {
    const user = userEvent.setup()
    render(<Board />)

    const status = screen.getByRole('status')
    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    expect(status.textContent).toContain('Picked up a')

    await user.keyboard('{ArrowRight}')
    expect(status.textContent).toContain('a moved to')

    await user.keyboard(' ')
    expect(status.textContent).toContain('a dropped at')
  })

  it('leaves the press to the handle but keeps the keyboard on the card', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board withHandle onChange={onChange} />)

    const grip = document.querySelector('[data-slot=kanban-handle]')
    expect(grip?.getAttribute('aria-hidden')).toBe('true')

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ doing: ['a', 'c'] }),
      expect.anything(),
    )
  })

  it('ignores the keyboard entirely when it is disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Board disabled onChange={onChange} />)

    const card = screen.getByRole('button', { name: 'a' })
    expect(card.getAttribute('aria-disabled')).toBe('true')

    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onChange).not.toHaveBeenCalled()
    expect(board()).toEqual({ todo: ['a', 'b'], doing: ['c'], done: [] })
  })
})
