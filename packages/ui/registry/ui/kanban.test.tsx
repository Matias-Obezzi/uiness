import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type GroupsChange, Kanban, KanbanCard, KanbanColumn, KanbanHandle } from './kanban'

const COLUMNS = ['todo', 'doing', 'done']
const TITLES: Record<string, string> = { todo: 'To do', doing: 'Doing', done: 'Done' }
const GROUPS: Record<string, string[]> = { todo: ['a', 'b'], doing: ['c'], done: [] }

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * jsdom lays nothing out, so every box a pointer drag needs is measured from this table instead:
 * three 200 wide columns, cards stacked inside them. Keys are the `data-dnd-id` /
 * `data-dnd-container` the package stamps on the elements; the floating copy carries neither and
 * stays 0x0, which is exactly what it should be worth to the hit testing.
 */
const LAYOUT: Record<string, { x: number; y: number; width: number; height: number }> = {
  todo: { x: 0, y: 0, width: 200, height: 400 },
  doing: { x: 220, y: 0, width: 200, height: 400 },
  done: { x: 440, y: 0, width: 200, height: 400 },
  a: { x: 10, y: 40, width: 180, height: 80 },
  b: { x: 10, y: 130, width: 180, height: 80 },
  c: { x: 230, y: 40, width: 180, height: 80 },
}

const layout = () =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const box = LAYOUT[this.dataset.dndId ?? this.dataset.dndContainer ?? ''] ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
    return {
      x: box.x,
      y: box.y,
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height,
      width: box.width,
      height: box.height,
    } as DOMRect
  })

/** The press lands on the card; the rest of the drag is followed on the window. */
const dragTo = (el: HTMLElement, from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: from[0], clientY: from[1] })
  fireEvent.pointerMove(window, { pointerId: 1, clientX: to[0], clientY: to[1] })
}

const overlayNode = () => document.querySelector('[data-slot=kanban-overlay]') as HTMLElement

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
  overlay,
}: {
  withHandle?: boolean
  disabled?: boolean
  onChange?: (groups: Record<string, string[]>, change: GroupsChange) => void
  overlay?: (id: string) => ReactNode
}) {
  const [groups, setGroups] = useState(GROUPS)
  return (
    <Kanban
      groups={groups}
      order={COLUMNS}
      withHandle={withHandle}
      disabled={disabled}
      overlay={overlay}
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

  it('carries a card to another column with the pointer', () => {
    layout()
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)

    dragTo(screen.getByRole('button', { name: 'a' }), [100, 80], [330, 80])
    expect(board()).toEqual({ todo: ['b'], doing: ['a', 'c'], done: [] })

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 330, clientY: 80 })
    expect(onChange).toHaveBeenCalledWith(
      { todo: ['b'], doing: ['a', 'c'], done: [] },
      expect.objectContaining({ id: 'a', to: { containerId: 'doing', index: 0 } }),
    )
  })

  it('floats a copy of the dragged card without being asked to', () => {
    layout()
    render(<Board />)

    expect(overlayNode().textContent).toBe('')
    dragTo(screen.getByRole('button', { name: 'a' }), [100, 80], [110, 80])

    const overlay = overlayNode()
    expect(overlay.textContent).toBe('a')
    expect(overlay.style.display).not.toBe('none')
    expect(overlay.style.transform).toContain('translate3d')
    expect(overlay.style.width).toBe('180px')

    // One card, not the column it came out of: the column chrome has no business following.
    expect(overlay.querySelectorAll('[data-slot=kanban-card]')).toHaveLength(1)
    expect(overlay.querySelector('[data-slot=kanban-column]')).toBe(null)

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 110, clientY: 80 })
    expect(overlayNode().textContent).toBe('')
  })

  it('leaves the registration to the real card and never to the copy', () => {
    layout()
    render(<Board />)

    const card = screen.getByRole('button', { name: 'a' })
    dragTo(card, [100, 80], [110, 80])

    const copy = overlayNode().querySelector('[data-slot=kanban-card]') as HTMLElement
    expect(copy).toBeTruthy()
    // A second `data-dnd-id=a` would hand the copy's box to the hit testing.
    expect(copy.hasAttribute('data-dnd-id')).toBe(false)
    expect(document.querySelectorAll('[data-dnd-id=a]')).toHaveLength(1)
    expect(card.getAttribute('data-dnd-id')).toBe('a')
    expect(board()).toEqual({ todo: ['a', 'b'], doing: ['c'], done: [] })
    // And no second drop target either, which is what a copied column would have been.
    expect(document.querySelectorAll('[data-dnd-container="todo"]')).toHaveLength(1)

    // Inert, and drawn as a plain card rather than as the marked one it was copied from.
    expect(copy.hasAttribute('tabindex')).toBe(false)
    expect(copy.getAttribute('role')).toBe(null)
    expect(copy.hasAttribute('data-dragging')).toBe(false)
    expect(card.hasAttribute('data-dragging')).toBe(true)
  })

  it('follows the card across columns, drawing it from the column it is over', () => {
    layout()
    render(<Board />)

    dragTo(screen.getByRole('button', { name: 'a' }), [100, 80], [330, 80])

    expect(board().doing).toEqual(['a', 'c'])
    expect(overlayNode().textContent).toBe('a')
  })

  it('shows the overlay it is given instead of the default copy', () => {
    layout()
    render(<Board overlay={(id) => <span>carrying {id}</span>} />)

    dragTo(screen.getByRole('button', { name: 'a' }), [100, 80], [110, 80])

    const overlay = overlayNode()
    expect(overlay.textContent).toBe('carrying a')
    expect(overlay.querySelector('[data-slot=kanban-card]')).toBe(null)
  })

  it('floats nothing during a keyboard drag, where there is no pointer to follow', async () => {
    const user = userEvent.setup()
    layout()
    render(<Board />)

    const card = screen.getByRole('button', { name: 'a' })
    card.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    expect(card.getAttribute('aria-pressed')).toBe('true')

    expect(overlayNode().textContent).toBe('')
    expect(overlayNode().style.display).toBe('none')
  })
})
