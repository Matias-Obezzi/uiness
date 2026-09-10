import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ReorderableGrid, ReorderableGridItem, type SortableChange } from './reorderable-grid'

const ICONS = ['mail', 'maps', 'notes', 'photos', 'music', 'clock']

const order = () =>
  Array.from(document.querySelectorAll('[data-slot=reorderable-grid-item]')).map((node) =>
    node.getAttribute('data-dnd-id'),
  )

function Grid({
  columns = 3,
  disabled,
  onReorder,
}: {
  columns?: number
  disabled?: boolean
  onReorder?: (items: string[], change: SortableChange) => void
}) {
  const [items, setItems] = useState(ICONS)
  return (
    <ReorderableGrid
      items={items}
      columns={columns}
      disabled={disabled}
      onReorder={(next, change) => {
        setItems(next)
        onReorder?.(next, change)
      }}
    >
      {(id) => (
        <ReorderableGridItem key={id} id={id}>
          {id}
        </ReorderableGridItem>
      )}
    </ReorderableGrid>
  )
}

describe('ReorderableGrid', () => {
  it('renders every tile it is given, in order', () => {
    render(<Grid />)
    expect(order()).toEqual(ICONS)
    for (const id of ICONS) expect(screen.getByText(id)).toBeTruthy()
  })

  it('lays the tiles out in the number of columns it was asked for', () => {
    render(<Grid columns={3} />)
    const grid = document.querySelector('[data-slot=reorderable-grid]') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
  })

  it('describes every tile as a grid item a screen reader can pick up', () => {
    render(<Grid />)
    const tile = screen.getByRole('button', { name: 'mail' })
    expect(tile.getAttribute('aria-roledescription')).toBe('grid item')
    expect(tile.getAttribute('tabindex')).toBe('0')
  })

  it('moves a tile one cell sideways with the keyboard', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onReorder).toHaveBeenCalledWith(['maps', 'mail', 'notes', 'photos', 'music', 'clock'], {
      id: 'mail',
      from: 0,
      to: 1,
    })
  })

  it('moves a tile a whole row down with the down arrow', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid columns={3} onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    // Three columns, so one press down is three places along the list.
    expect(onReorder).toHaveBeenCalledWith(expect.anything(), { id: 'mail', from: 0, to: 3 })
    expect(order()).toEqual(['maps', 'notes', 'photos', 'mail', 'music', 'clock'])
  })

  it('moves a tile a row back up again', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid columns={3} onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'clock' })
    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{Enter}')

    expect(onReorder).toHaveBeenCalledWith(expect.anything(), { id: 'clock', from: 5, to: 2 })
    expect(order()).toEqual(['mail', 'maps', 'clock', 'notes', 'photos', 'music'])
  })

  it('stops at the ends instead of wrapping around', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid columns={3} onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowUp}{ArrowLeft}')
    await user.keyboard(' ')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ICONS)
  })

  it('puts everything back when escape cancels the drag', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid columns={3} onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    expect(order()).toEqual(['maps', 'notes', 'photos', 'mail', 'music', 'clock'])

    await user.keyboard('{Escape}')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ICONS)
  })

  it('reads the drag out into a live region', async () => {
    const user = userEvent.setup()
    render(<Grid />)

    const status = screen.getByRole('status')
    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    expect(status.textContent).toContain('Picked up mail')

    await user.keyboard('{ArrowRight}')
    expect(status.textContent).toContain('mail moved to')

    await user.keyboard('{Escape}')
    expect(status.textContent).toContain('cancelled')
  })

  it('ignores the keyboard entirely when it is disabled', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<Grid disabled onReorder={onReorder} />)

    const tile = screen.getByRole('button', { name: 'mail' })
    expect(tile.getAttribute('aria-disabled')).toBe('true')

    tile.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ICONS)
  })
})
