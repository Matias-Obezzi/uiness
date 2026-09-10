import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sortable, type SortableChange, SortableHandle, SortableItem } from './sortable'

const ITEMS = ['write', 'review', 'ship']

afterEach(() => {
  vi.restoreAllMocks()
})

/** The rendered order, read off the ids the package stamps on every item. */
const order = () =>
  Array.from(document.querySelectorAll('[data-slot=sortable-item][data-dnd-id]')).map((node) =>
    node.getAttribute('data-dnd-id'),
  )

/**
 * jsdom lays nothing out, so every box a pointer drag needs is measured from this table instead.
 * Keys are the `data-dnd-id` / `data-dnd-container` the package stamps on the elements; anything
 * it does not know about — the floating copy, for one — keeps the 0x0 box jsdom would give it.
 */
const LAYOUT: Record<string, { x: number; y: number; width: number; height: number }> = {
  list: { x: 0, y: 0, width: 100, height: 300 },
  write: { x: 0, y: 0, width: 100, height: 100 },
  review: { x: 0, y: 100, width: 100, height: 100 },
  ship: { x: 0, y: 200, width: 100, height: 100 },
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

/** The press lands on the row; the rest of the drag is followed on the window. */
const dragTo = (el: HTMLElement, from: number, to: number) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 50, clientY: from })
  fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: to })
}

const overlayNode = () => document.querySelector('[data-slot=sortable-overlay]') as HTMLElement

function List({
  axis,
  withHandle,
  disabled,
  onReorder,
  overlay,
}: {
  axis?: 'x' | 'y'
  withHandle?: boolean
  disabled?: boolean
  onReorder?: (items: string[], change: SortableChange) => void
  overlay?: (id: string) => ReactNode
}) {
  const [items, setItems] = useState(ITEMS)
  return (
    <Sortable
      items={items}
      axis={axis}
      withHandle={withHandle}
      disabled={disabled}
      overlay={overlay}
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

  it('reorders with the pointer once it passes the next row', () => {
    layout()
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)

    dragTo(screen.getByRole('button', { name: 'write' }), 50, 160)
    expect(order()).toEqual(['review', 'write', 'ship'])

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 160 })
    expect(onReorder).toHaveBeenCalledWith(['review', 'write', 'ship'], {
      id: 'write',
      from: 0,
      to: 1,
    })
  })

  it('floats a copy of the dragged row without being asked to', () => {
    layout()
    render(<List />)

    expect(overlayNode().textContent).toBe('')
    dragTo(screen.getByRole('button', { name: 'write' }), 50, 60)

    // The whole point of the drag: something the size of the row follows the pointer.
    const overlay = overlayNode()
    expect(overlay.textContent).toBe('write')
    expect(overlay.style.display).not.toBe('none')
    expect(overlay.style.transform).toContain('translate3d')
    expect(overlay.style.height).toBe('100px')

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 60 })
    expect(overlayNode().textContent).toBe('')
  })

  it('leaves the registration to the real row and never to the copy', () => {
    layout()
    render(<List />)

    const row = screen.getByRole('button', { name: 'write' })
    dragTo(row, 50, 60)

    const copy = overlayNode().querySelector('[data-slot=sortable-item]') as HTMLElement
    expect(copy).toBeTruthy()
    // A second `data-dnd-id=write` would hand the copy's box to the hit testing.
    expect(copy.hasAttribute('data-dnd-id')).toBe(false)
    expect(document.querySelectorAll('[data-dnd-id=write]')).toHaveLength(1)
    expect(row.getAttribute('data-dnd-id')).toBe('write')
    expect(order()).toEqual(ITEMS)

    // Inert, and drawn as a plain row rather than as the marked one it was copied from.
    expect(copy.hasAttribute('tabindex')).toBe(false)
    expect(copy.getAttribute('role')).toBe(null)
    expect(copy.hasAttribute('data-dragging')).toBe(false)
    expect(row.hasAttribute('data-dragging')).toBe(true)
  })

  it('shows the overlay it is given instead of the default copy', () => {
    layout()
    render(<List overlay={(id) => <span>carrying {id}</span>} />)

    dragTo(screen.getByRole('button', { name: 'write' }), 50, 60)

    const overlay = overlayNode()
    expect(overlay.textContent).toBe('carrying write')
    expect(overlay.querySelector('[data-slot=sortable-item]')).toBe(null)
  })

  it('floats nothing during a keyboard drag, where there is no pointer to follow', async () => {
    const user = userEvent.setup()
    layout()
    render(<List />)

    const row = screen.getByRole('button', { name: 'write' })
    row.focus()
    await user.keyboard(' ')
    expect(row.getAttribute('aria-pressed')).toBe('true')

    expect(overlayNode().textContent).toBe('')
    expect(overlayNode().style.display).toBe('none')
  })
})
