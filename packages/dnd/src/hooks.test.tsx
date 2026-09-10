import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Rect } from './core'
import { useDraggable, useReducedMotion, useSortable, useSortableGroups } from './hooks'

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * jsdom lays nothing out, so every box is measured from this table instead. Keys are the
 * `data-dnd-id` / `data-dnd-container` the hooks put on the elements.
 */
function layout(boxes: Record<string, Rect>) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const key = this.dataset.dndId ?? this.dataset.dndContainer ?? ''
    const box = boxes[key] ?? { x: 0, y: 0, width: 0, height: 0 }
    return {
      left: box.x,
      top: box.y,
      right: box.x + box.width,
      bottom: box.y + box.height,
      width: box.width,
      height: box.height,
    } as DOMRect
  })
}

/** The press lands on the handle; the rest of the drag is followed on the window. */
const drag = (el: HTMLElement, from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: from[0], clientY: from[1] })
  fireEvent.pointerMove(window, { pointerId: 1, clientX: to[0], clientY: to[1] })
  fireEvent.pointerUp(window, { pointerId: 1, clientX: to[0], clientY: to[1] })
}

const status = () => screen.getByRole('status').textContent ?? ''
const order = (testId: string) =>
  Array.from(screen.getByTestId(testId).children).map((child) => child.textContent)

// -- useSortable ------------------------------------------------------------------------------

function List({
  onReorder,
  axis = 'y' as const,
  columns,
}: {
  onReorder: (items: string[]) => void
  axis?: 'x' | 'y' | 'both'
  columns?: number
}) {
  const [items, setItems] = useState(['a', 'b', 'c'])
  const sortable = useSortable({
    items,
    axis,
    columns,
    onReorder: (next) => {
      setItems(next)
      onReorder(next)
    },
  })
  return (
    <div>
      <ul {...sortable.getListProps()} data-testid="list">
        {sortable.items.map((id) => (
          <li key={id} {...sortable.getItemProps(id)} {...sortable.getHandleProps(id)}>
            {id}
          </li>
        ))}
      </ul>
      <div {...sortable.getLiveRegionProps()}>{sortable.announcement}</div>
    </div>
  )
}

const column = {
  list: { x: 0, y: 0, width: 100, height: 300 },
  a: { x: 0, y: 0, width: 100, height: 100 },
  b: { x: 0, y: 100, width: 100, height: 100 },
  c: { x: 0, y: 200, width: 100, height: 100 },
}

describe('useSortable with a pointer', () => {
  it('reorders once the pointer passes the next item and reports the move', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    const a = screen.getByText('a')

    fireEvent.pointerDown(a, { button: 0, pointerId: 1, clientX: 50, clientY: 50 })
    // Under the activation distance: still nothing.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 52 })
    expect(order('list')).toEqual(['a', 'b', 'c'])

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 160 })
    expect(order('list')).toEqual(['b', 'a', 'c'])
    expect(status()).toBe('a moved to position 2 of 3.')

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 160 })
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
    expect(status()).toBe('a dropped at position 2 of 3.')
  })

  it('says nothing happened when the item is dropped where it started', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    drag(screen.getByText('a'), [50, 50], [50, 70])
    expect(onReorder).not.toHaveBeenCalled()
    expect(order('list')).toEqual(['a', 'b', 'c'])
  })

  it('takes the item to the end of the list', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    drag(screen.getByText('a'), [50, 50], [50, 290])
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a'])
  })

  it('captures the pointer so the drag survives leaving the element', () => {
    layout(column)
    const capture = vi.spyOn(Element.prototype, 'setPointerCapture')
    render(<List onReorder={vi.fn()} />)
    fireEvent.pointerDown(screen.getByText('a'), {
      button: 0,
      pointerId: 7,
      clientX: 50,
      clientY: 50,
    })
    expect(capture).toHaveBeenCalledWith(7)
  })

  it('leaves the scroll axis to the browser and takes the drag axis', () => {
    layout(column)
    const { rerender } = render(<List onReorder={vi.fn()} />)
    expect(screen.getByText('a').style.touchAction).toBe('pan-x')
    rerender(<List onReorder={vi.fn()} axis="x" />)
    expect(screen.getByText('a').style.touchAction).toBe('pan-y')
    rerender(<List onReorder={vi.fn()} axis="both" />)
    expect(screen.getByText('a').style.touchAction).toBe('none')
  })
})

describe('useSortable with the keyboard', () => {
  it('picks up with space, moves with the arrows and drops with enter', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    const a = screen.getByText('a')
    a.focus()

    fireEvent.keyDown(a, { key: ' ' })
    expect(status()).toContain('Picked up a, position 1 of 3')
    expect(status()).toContain('escape to cancel')
    expect(a.getAttribute('aria-pressed')).toBe('true')

    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(order('list')).toEqual(['b', 'a', 'c'])
    expect(status()).toBe('a moved to position 2 of 3.')

    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(order('list')).toEqual(['b', 'c', 'a'])
    // The end of the list holds.
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(order('list')).toEqual(['b', 'c', 'a'])

    fireEvent.keyDown(a, { key: 'Enter' })
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a'])
    expect(status()).toBe('a dropped at position 3 of 3.')
  })

  it('puts everything back on escape', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    const a = screen.getByText('a')
    a.focus()

    fireEvent.keyDown(a, { key: ' ' })
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(order('list')).toEqual(['b', 'a', 'c'])

    fireEvent.keyDown(a, { key: 'Escape' })
    expect(order('list')).toEqual(['a', 'b', 'c'])
    expect(onReorder).not.toHaveBeenCalled()
    expect(status()).toBe('Dragging a cancelled, back at position 1 of 3.')
    expect(a.getAttribute('aria-pressed')).toBe('false')
  })

  it('cancels a pointer drag with escape too, wherever the focus is', () => {
    layout(column)
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} />)
    const a = screen.getByText('a')
    fireEvent.pointerDown(a, { button: 0, pointerId: 1, clientX: 50, clientY: 50 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 160 })
    expect(order('list')).toEqual(['b', 'a', 'c'])

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(order('list')).toEqual(['a', 'b', 'c'])
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 160 })
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('cancels a keyboard drag when the focus really leaves the item', async () => {
    layout(column)
    render(<List onReorder={vi.fn()} />)
    const a = screen.getByText('a')
    a.focus()
    fireEvent.keyDown(a, { key: ' ' })
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(order('list')).toEqual(['b', 'a', 'c'])

    a.blur()
    fireEvent.blur(a)
    await act(async () => {})
    expect(order('list')).toEqual(['a', 'b', 'c'])
    expect(status()).toContain('cancelled')
  })

  it('walks a grid in two dimensions', () => {
    layout({
      list: { x: 0, y: 0, width: 300, height: 100 },
      a: { x: 0, y: 0, width: 100, height: 50 },
      b: { x: 100, y: 0, width: 100, height: 50 },
      c: { x: 200, y: 0, width: 100, height: 50 },
    })
    const onReorder = vi.fn()
    render(<List onReorder={onReorder} axis="both" columns={2} />)
    const a = screen.getByText('a')

    fireEvent.keyDown(a, { key: ' ' })
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    // Two columns, so down is two slots along.
    expect(order('list')).toEqual(['b', 'c', 'a'])
    fireEvent.keyDown(a, { key: 'ArrowLeft' })
    expect(order('list')).toEqual(['b', 'a', 'c'])
    fireEvent.keyDown(a, { key: 'Enter' })
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
  })
})

// -- useSortableGroups ------------------------------------------------------------------------

function Board({ onChange }: { onChange: (groups: Record<string, string[]>) => void }) {
  const [groups, setGroups] = useState<Record<string, string[]>>({
    todo: ['t1', 't2'],
    doing: ['d1'],
    done: [],
  })
  const board = useSortableGroups({
    groups,
    order: ['todo', 'doing', 'done'],
    onChange: (next) => {
      setGroups(next)
      onChange(next)
    },
  })
  return (
    <div>
      {['todo', 'doing', 'done'].map((groupId) => (
        <ul key={groupId} {...board.getGroupProps(groupId)} data-testid={groupId}>
          {(board.groups[groupId] ?? []).map((id) => (
            <li key={id} {...board.getItemProps(id)} {...board.getHandleProps(id)}>
              {id}
            </li>
          ))}
        </ul>
      ))}
      <div {...board.getLiveRegionProps()}>{board.announcement}</div>
    </div>
  )
}

const board = {
  todo: { x: 0, y: 0, width: 100, height: 300 },
  doing: { x: 100, y: 0, width: 100, height: 300 },
  done: { x: 200, y: 0, width: 100, height: 300 },
  t1: { x: 0, y: 0, width: 100, height: 50 },
  t2: { x: 0, y: 50, width: 100, height: 50 },
  d1: { x: 100, y: 0, width: 100, height: 50 },
}

describe('useSortableGroups', () => {
  it('drags an item into another container', () => {
    layout(board)
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)
    drag(screen.getByText('t1'), [50, 25], [150, 10])

    expect(onChange).toHaveBeenCalledWith({ todo: ['t2'], doing: ['t1', 'd1'], done: [] })
  })

  it('drops into an empty container', () => {
    layout(board)
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)
    drag(screen.getByText('d1'), [150, 25], [250, 25])
    expect(onChange).toHaveBeenCalledWith({ todo: ['t1', 't2'], doing: [], done: ['d1'] })
  })

  it('crosses containers with left and right, and names the new one out loud', () => {
    layout(board)
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)
    const t1 = screen.getByText('t1')

    t1.focus()
    fireEvent.keyDown(t1, { key: ' ' })
    fireEvent.keyDown(t1, { key: 'ArrowRight' })
    expect(order('todo')).toEqual(['t2'])
    expect(order('doing')).toEqual(['t1', 'd1'])
    expect(status()).toBe('t1 moved to position 1 of 2 in doing.')

    // The item was re-rendered into the other list, and the focus followed it there.
    const moved = screen.getByText('t1')
    expect(document.activeElement).toBe(moved)

    fireEvent.keyDown(moved, { key: 'ArrowDown' })
    expect(order('doing')).toEqual(['d1', 't1'])

    fireEvent.keyDown(screen.getByText('t1'), { key: ' ' })
    expect(onChange).toHaveBeenCalledWith({ todo: ['t2'], doing: ['d1', 't1'], done: [] })
  })

  it('puts the item back in its own container on escape', () => {
    layout(board)
    const onChange = vi.fn()
    render(<Board onChange={onChange} />)
    const t1 = screen.getByText('t1')

    fireEvent.keyDown(t1, { key: ' ' })
    fireEvent.keyDown(t1, { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByText('t1'), { key: 'Escape' })

    expect(order('todo')).toEqual(['t1', 't2'])
    expect(order('doing')).toEqual(['d1'])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marks the container the drag is over', () => {
    layout(board)
    render(<Board onChange={vi.fn()} />)
    const t1 = screen.getByText('t1')
    fireEvent.pointerDown(t1, { button: 0, pointerId: 1, clientX: 50, clientY: 25 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 40 })
    expect(screen.getByTestId('doing').hasAttribute('data-over')).toBe(true)
    expect(screen.getByTestId('todo').hasAttribute('data-over')).toBe(false)
  })
})

// -- useDraggable -----------------------------------------------------------------------------

function Panel({
  onDragEnd,
  bounds,
}: {
  onDragEnd?: (position: { x: number; y: number }) => void
  bounds?: Rect
}) {
  const draggable = useDraggable({ id: 'panel', onDragEnd, bounds, keyboardStep: 20 })
  return (
    <div>
      <div {...draggable.getElementProps()} data-testid="panel">
        <button type="button" {...draggable.getHandleProps()}>
          grab
        </button>
      </div>
      <div {...draggable.getLiveRegionProps()}>{draggable.announcement}</div>
    </div>
  )
}

describe('useDraggable', () => {
  const at = () => screen.getByRole('status').textContent ?? ''

  it('follows the pointer anywhere', () => {
    const onDragEnd = vi.fn()
    render(<Panel onDragEnd={onDragEnd} />)
    const handle = screen.getByText('grab')
    drag(handle, [0, 0], [30, 40])
    expect(screen.getByTestId('panel').style.transform).toBe('translate3d(30px, 40px, 0)')
    expect(onDragEnd).toHaveBeenCalledWith({ x: 30, y: 40 })
  })

  it('moves with the arrow keys and reports pixels', () => {
    render(<Panel />)
    const handle = screen.getByText('grab')
    fireEvent.keyDown(handle, { key: ' ' })
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(screen.getByTestId('panel').style.transform).toBe('translate3d(40px, 20px, 0)')
    expect(at()).toBe('panel moved to 40, 20 pixels from the start.')
  })

  it('goes back where it was on escape', () => {
    const onDragEnd = vi.fn()
    render(<Panel onDragEnd={onDragEnd} />)
    const handle = screen.getByText('grab')
    fireEvent.keyDown(handle, { key: ' ' })
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(screen.getByTestId('panel').style.transform).toBe('translate3d(20px, 0px, 0)')
    fireEvent.keyDown(handle, { key: 'Escape' })
    expect(screen.getByTestId('panel').style.transform).toBe('translate3d(0px, 0px, 0)')
    expect(onDragEnd).not.toHaveBeenCalled()
    expect(at()).toContain('cancelled')
  })

  it('stays inside its bounds', () => {
    render(<Panel bounds={{ x: 0, y: 0, width: 50, height: 50 }} />)
    const handle = screen.getByText('grab')
    drag(handle, [0, 0], [500, 500])
    // The element measures 0 by 0 here, so it can reach the far corner but no further.
    expect(screen.getByTestId('panel').style.transform).toBe('translate3d(50px, 50px, 0)')
  })
})

describe('useReducedMotion', () => {
  function Motion() {
    return <output>{String(useReducedMotion())}</output>
  }

  it('reads the media query after mounting, never during render', () => {
    const listeners: Array<() => void> = []
    const query = {
      matches: true,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: () => {},
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(query as unknown as MediaQueryList)
    render(<Motion />)
    expect(screen.getByRole('status').textContent).toBe('true')

    query.matches = false
    act(() => {
      for (const fn of listeners) fn()
    })
    expect(screen.getByRole('status').textContent).toBe('false')
  })
})
