import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Sortable, type SortableChange, SortableHandle, SortableItem } from './sortable'

const ITEMS = ['write', 'review', 'ship']

/** The rendered order, read off the ids the package stamps on every item. */
const order = () =>
  Array.from(document.querySelectorAll('[data-slot=sortable-item]')).map((node) =>
    node.getAttribute('data-dnd-id'),
  )

function List({
  axis,
  withHandle,
  disabled,
  onReorder,
}: {
  axis?: 'x' | 'y'
  withHandle?: boolean
  disabled?: boolean
  onReorder?: (items: string[], change: SortableChange) => void
}) {
  const [items, setItems] = useState(ITEMS)
  return (
    <Sortable
      items={items}
      axis={axis}
      withHandle={withHandle}
      disabled={disabled}
      onReorder={(next, change) => {
        setItems(next)
        onReorder?.(next, change)
      }}
    >
      {(id) => (
        <SortableItem key={id} id={id}>
          {withHandle ? <SortableHandle /> : null}
          <span>{id}</span>
        </SortableItem>
      )}
    </Sortable>
  )
}

describe('Sortable', () => {
  it('renders the items it is given, in order', () => {
    render(<List />)
    expect(order()).toEqual(ITEMS)
    for (const id of ITEMS) expect(screen.getByText(id)).toBeTruthy()
  })

  it('describes every row as a sortable item a screen reader can pick up', () => {
    render(<List />)
    const row = screen.getByRole('button', { name: 'write' })
    expect(row.getAttribute('aria-roledescription')).toBe('sortable item')
    expect(row.getAttribute('tabindex')).toBe('0')
    expect(row.getAttribute('aria-pressed')).toBe('false')
  })

  it('moves a row down the list with the keyboard and reports the new order', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    expect(row.getAttribute('aria-pressed')).toBe('true')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['review', 'write', 'ship'], {
      id: 'write',
      from: 0,
      to: 1,
    })
    expect(order()).toEqual(['review', 'write', 'ship'])
  })

  it('moves a row up as well, and counts the moves that happened before the drop', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'ship' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    await user.keyboard('{Enter}')

    expect(onReorder).toHaveBeenCalledWith(['ship', 'write', 'review'], {
      id: 'ship',
      from: 2,
      to: 0,
    })
  })

  it('follows the left and right arrows on a horizontal list', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List axis="x" onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onReorder).toHaveBeenCalledWith(['review', 'write', 'ship'], expect.anything())
  })

  it('puts everything back when escape cancels the drag', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    expect(order()).toEqual(['review', 'write', 'ship'])

    await user.keyboard('{Escape}')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ITEMS)
    expect(row.getAttribute('aria-pressed')).toBe('false')
  })

  it('never fires the callback when the row lands where it started', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}{ArrowUp}')
    await user.keyboard(' ')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ITEMS)
  })

  it('reads the drag out into a live region', async () => {
    const user = userEvent.setup()
    render(<List />)

    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-live')).toBe('assertive')

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    expect(status.textContent).toContain('Picked up write')

    await user.keyboard('{ArrowDown}')
    expect(status.textContent).toContain('write moved to')

    await user.keyboard(' ')
    expect(status.textContent).toContain('write dropped at')
  })

  it('says so when a drag is cancelled', async () => {
    const user = userEvent.setup()
    render(<List />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{Escape}')

    expect(screen.getByRole('status').textContent).toContain('cancelled')
  })

  it('leaves the press to the handle but keeps the keyboard on the row', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List withHandle onReorder={onReorder} />)

    // One focus stop per row, not two: the grip is decoration for the pointer.
    const grip = document.querySelector('[data-slot=sortable-handle]')
    expect(grip?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getAllByRole('button')).toHaveLength(ITEMS.length)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    expect(onReorder).toHaveBeenCalledWith(['review', 'write', 'ship'], expect.anything())
  })

  it('starts a pointer drag from the grip and not from the rest of the row', () => {
    render(<List withHandle />)
    const row = screen.getByRole('button', { name: 'write' })
    const grip = document.querySelector('[data-slot=sortable-handle]') as HTMLElement

    // Pressing the row body does nothing: that press belongs to the page, not to the drag.
    fireEvent.pointerDown(row, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 0, clientY: 40 })
    expect(row.hasAttribute('data-dragging')).toBe(false)

    fireEvent.pointerDown(grip, { pointerId: 2, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 0, clientY: 40 })
    expect(row.hasAttribute('data-dragging')).toBe(true)

    fireEvent.pointerUp(window, { pointerId: 2, clientX: 0, clientY: 40 })
    expect(row.hasAttribute('data-dragging')).toBe(false)
  })

  it('ignores the keyboard entirely when it is disabled', async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn()
    render(<List disabled onReorder={onReorder} />)

    const row = screen.getByRole('button', { name: 'write' })
    expect(row.getAttribute('aria-disabled')).toBe('true')
    expect(row.getAttribute('tabindex')).toBe('-1')

    row.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    expect(onReorder).not.toHaveBeenCalled()
    expect(order()).toEqual(ITEMS)
  })

  it('lays a horizontal list out along the other axis', () => {
    render(<List axis="x" />)
    const list = document.querySelector('[data-slot=sortable]')
    expect(list?.getAttribute('data-axis')).toBe('x')
    expect(list?.className).toContain('flex-row')
  })
})
