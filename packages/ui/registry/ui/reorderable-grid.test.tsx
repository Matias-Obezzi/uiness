import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReorderableGrid, ReorderableGridItem, type SortableChange } from './reorderable-grid'

const ICONS = ['mail', 'maps', 'notes', 'photos', 'music', 'clock']

afterEach(() => {
  vi.restoreAllMocks()
})

const order = () =>
  Array.from(document.querySelectorAll('[data-slot=reorderable-grid-item][data-dnd-id]')).map(
    (node) => node.getAttribute('data-dnd-id'),
  )

/**
 * jsdom lays nothing out, so every box a pointer drag needs is measured from this table instead:
 * three columns of 100x100 tiles in two rows. Keys are the `data-dnd-id` / `data-dnd-container`
 * the package stamps on the elements; the floating copy carries neither and stays 0x0.
 */
const LAYOUT: Record<string, { x: number; y: number; width: number; height: number }> = {
  list: { x: 0, y: 0, width: 300, height: 200 },
  mail: { x: 0, y: 0, width: 100, height: 100 },
  maps: { x: 100, y: 0, width: 100, height: 100 },
  notes: { x: 200, y: 0, width: 100, height: 100 },
  photos: { x: 0, y: 100, width: 100, height: 100 },
  music: { x: 100, y: 100, width: 100, height: 100 },
  clock: { x: 200, y: 100, width: 100, height: 100 },
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

/** The press lands on the tile; the rest of the drag is followed on the window. */
const dragTo = (el: HTMLElement, from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: from[0], clientY: from[1] })
  fireEvent.pointerMove(window, { pointerId: 1, clientX: to[0], clientY: to[1] })
}

const overlayNode = () =>
  document.querySelector('[data-slot=reorderable-grid-overlay]') as HTMLElement

function Grid({
  columns = 3,
  disabled,
  onReorder,
  overlay,
}: {
  columns?: number
  disabled?: boolean
  onReorder?: (items: string[], change: SortableChange) => void
  overlay?: (id: string) => ReactNode
}) {
  const [items, setItems] = useState(ICONS)
  return (
    <ReorderableGrid
      items={items}
      columns={columns}
      disabled={disabled}
      overlay={overlay}
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

  it('reorders with the pointer once it lands on the next cell', () => {
    layout()
    const onReorder = vi.fn()
    render(<Grid onReorder={onReorder} />)

    dragTo(screen.getByRole('button', { name: 'mail' }), [50, 50], [160, 50])
    expect(order()).toEqual(['maps', 'mail', 'notes', 'photos', 'music', 'clock'])

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 160, clientY: 50 })
    expect(onReorder).toHaveBeenCalledWith(['maps', 'mail', 'notes', 'photos', 'music', 'clock'], {
      id: 'mail',
      from: 0,
      to: 1,
    })
  })

  it('floats a copy of the dragged tile without being asked to', () => {
    layout()
    render(<Grid />)

    expect(overlayNode().textContent).toBe('')
    dragTo(screen.getByRole('button', { name: 'mail' }), [50, 50], [60, 50])

    const overlay = overlayNode()
    expect(overlay.textContent).toBe('mail')
    expect(overlay.style.display).not.toBe('none')
    expect(overlay.style.transform).toContain('translate3d')
    expect(overlay.style.width).toBe('100px')

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 60, clientY: 50 })
    expect(overlayNode().textContent).toBe('')
  })

  it('leaves the registration to the real tile and never to the copy', () => {
    layout()
    render(<Grid />)

    const tile = screen.getByRole('button', { name: 'mail' })
    dragTo(tile, [50, 50], [60, 50])

    const copy = overlayNode().querySelector('[data-slot=reorderable-grid-item]') as HTMLElement
    expect(copy).toBeTruthy()
    // A second `data-dnd-id=mail` would hand the copy's box to the hit testing.
    expect(copy.hasAttribute('data-dnd-id')).toBe(false)
    expect(document.querySelectorAll('[data-dnd-id=mail]')).toHaveLength(1)
    expect(tile.getAttribute('data-dnd-id')).toBe('mail')
    expect(order()).toEqual(ICONS)

    // Inert, and drawn as a plain tile rather than as the marked one it was copied from.
    expect(copy.hasAttribute('tabindex')).toBe(false)
    expect(copy.getAttribute('role')).toBe(null)
    expect(copy.hasAttribute('data-dragging')).toBe(false)
    expect(tile.hasAttribute('data-dragging')).toBe(true)
  })

  it('shows the overlay it is given instead of the default copy', () => {
    layout()
    render(<Grid overlay={(id) => <span>carrying {id}</span>} />)

    dragTo(screen.getByRole('button', { name: 'mail' }), [50, 50], [60, 50])

    const overlay = overlayNode()
    expect(overlay.textContent).toBe('carrying mail')
    expect(overlay.querySelector('[data-slot=reorderable-grid-item]')).toBe(null)
  })

  it('floats nothing during a keyboard drag, where there is no pointer to follow', async () => {
    const user = userEvent.setup()
    layout()
    render(<Grid />)

    const tile = screen.getByRole('button', { name: 'mail' })
    tile.focus()
    await user.keyboard(' ')
    expect(tile.getAttribute('aria-pressed')).toBe('true')

    expect(overlayNode().textContent).toBe('')
    expect(overlayNode().style.display).toBe('none')
  })
})
