import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { matchesAccept, useDropZone } from './drop-zone'
import { useDraggable, useSortable } from './hooks'
import { useDropTarget } from './targets'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Boxes by `data-box`, since jsdom lays nothing out. */
function layout(boxes: Record<string, { x: number; y: number; width: number; height: number }>) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const box = boxes[
      this.dataset.box ?? this.dataset.dndId ?? this.dataset.dndContainer ?? ''
    ] ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
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

const press = (el: HTMLElement, x: number, y: number) =>
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: x, clientY: y })
const moveTo = (x: number, y: number) =>
  fireEvent.pointerMove(window, { pointerId: 1, clientX: x, clientY: y })
const lift = () => fireEvent.pointerUp(window, { pointerId: 1 })

function Card(props: Parameters<typeof useDraggable>[0]) {
  const drag = useDraggable(props)
  return (
    <div
      data-box="card"
      data-testid="card"
      data-over={drag.over ?? ''}
      {...drag.getElementProps()}
      {...drag.getHandleProps()}
    >
      {drag.position.x},{drag.position.y}
    </div>
  )
}

describe('activationDelay', () => {
  it('starts the drag after a long press, where the finger is by then', () => {
    vi.useFakeTimers()
    const onStart = vi.fn()
    layout({ card: { x: 0, y: 0, width: 50, height: 50 } })
    render(<Card activationDelay={300} onStart={onStart} />)
    const card = screen.getByTestId('card')
    press(card, 10, 10)
    moveTo(13, 12)
    act(() => vi.advanceTimersByTime(299))
    expect(onStart).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(card.textContent).toBe('3,2')
    moveTo(60, 40)
    expect(card.textContent).toBe('50,30')
    lift()
  })

  it('lets a quick swipe scroll instead of dragging', () => {
    vi.useFakeTimers()
    const onStart = vi.fn()
    render(<Card activationDelay={300} onStart={onStart} />)
    const card = screen.getByTestId('card')
    press(card, 10, 10)
    moveTo(10, 60)
    act(() => vi.advanceTimersByTime(1000))
    moveTo(10, 120)
    expect(onStart).not.toHaveBeenCalled()
    expect(card.textContent).toBe('0,0')
  })

  it('does not make a mouse wait', () => {
    const onStart = vi.fn()
    render(<Card activationDelay={300} onStart={onStart} />)
    fireEvent.pointerDown(screen.getByTestId('card'), {
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 0,
      clientY: 0,
    })
    moveTo(20, 0)
    expect(onStart).toHaveBeenCalledTimes(1)
    lift()
  })

  it('lets the page scroll by touch until the drag starts', () => {
    render(<Card activationDelay={300} />)
    expect(screen.getByTestId('card').style.touchAction).toBe('manipulation')
  })

  it('works for sortable lists too', () => {
    vi.useFakeTimers()
    const onDragStart = vi.fn()
    function List() {
      const [items, setItems] = useState(['a', 'b'])
      const sortable = useSortable({
        items,
        onReorder: setItems,
        activationDelay: 250,
        onDragStart,
      })
      return (
        <ul {...sortable.getListProps()}>
          {sortable.items.map((id) => (
            <li key={id} {...sortable.getItemProps(id)} {...sortable.getHandleProps(id)}>
              {id}
            </li>
          ))}
        </ul>
      )
    }
    render(<List />)
    press(screen.getByText('a'), 5, 5)
    act(() => vi.advanceTimersByTime(250))
    expect(onDragStart).toHaveBeenCalledWith('a', 0)
    lift()
  })
})

describe('haptics', () => {
  it('buzzes on pick up and on drop', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    render(<Card haptics />)
    const card = screen.getByTestId('card')
    press(card, 0, 0)
    moveTo(20, 0)
    lift()
    expect(vibrate.mock.calls).toEqual([[10], [15]])
  })
})

describe('grid', () => {
  it('snaps the position to the cells, and steps a cell with the arrows', () => {
    layout({ card: { x: 0, y: 0, width: 50, height: 50 } })
    render(<Card grid={[40, 20]} />)
    const card = screen.getByTestId('card')
    press(card, 0, 0)
    moveTo(58, 29)
    expect(card.textContent).toBe('40,20')
    moveTo(61, 31)
    expect(card.textContent).toBe('80,40')
    lift()
    card.focus()
    fireEvent.keyDown(card, { key: ' ' })
    fireEvent.keyDown(card, { key: 'ArrowRight' })
    fireEvent.keyDown(card, { key: ' ' })
    expect(card.textContent).toBe('120,40')
  })
})

describe('useDropTarget', () => {
  function Desk({
    onDrop,
    accepts,
  }: {
    onDrop: (id: string) => void
    accepts?: (id: string) => boolean
  }) {
    const trash = useDropTarget({ id: 'trash', onDrop, accepts })
    const [landed, setLanded] = useState('')
    return (
      <>
        <Card id="note" onDropOn={setLanded} />
        <div
          ref={trash.ref}
          data-box="trash"
          data-testid="trash"
          data-over={trash.isOver || undefined}
        />
        <output>{landed}</output>
      </>
    )
  }

  it('lights up under the dragged element and takes the drop', () => {
    layout({
      card: { x: 0, y: 0, width: 20, height: 20 },
      trash: { x: 200, y: 0, width: 100, height: 100 },
    })
    const onDrop = vi.fn()
    render(<Desk onDrop={onDrop} />)
    const card = screen.getByTestId('card')
    press(card, 10, 10)
    moveTo(100, 10)
    expect(screen.getByTestId('trash').dataset.over).toBeUndefined()
    // The card's center, not the pointer, decides: x 0 + 230 + 10 = 240 is inside.
    moveTo(240, 40)
    expect(screen.getByTestId('trash').dataset.over).toBe('true')
    expect(card.dataset.over).toBe('trash')
    lift()
    expect(onDrop).toHaveBeenCalledWith('note')
    expect(screen.getByRole('status').textContent).toBe('trash')
    expect(screen.getByTestId('trash').dataset.over).toBeUndefined()
  })

  it('ignores draggables it does not accept', () => {
    layout({
      card: { x: 0, y: 0, width: 20, height: 20 },
      trash: { x: 200, y: 0, width: 100, height: 100 },
    })
    const onDrop = vi.fn()
    render(<Desk onDrop={onDrop} accepts={(id) => id !== 'note'} />)
    press(screen.getByTestId('card'), 10, 10)
    moveTo(240, 40)
    expect(screen.getByTestId('trash').dataset.over).toBeUndefined()
    lift()
    expect(onDrop).not.toHaveBeenCalled()
  })
})

describe('useDropZone', () => {
  it('matches files the way a file input does', () => {
    const png = { name: 'cat.PNG', type: 'image/png' }
    const pdf = { name: 'cv.pdf', type: 'application/pdf' }
    expect(matchesAccept(png, 'image/*')).toBe(true)
    expect(matchesAccept(pdf, 'image/*')).toBe(false)
    expect(matchesAccept(pdf, ['.pdf', 'text/plain'])).toBe(true)
    expect(matchesAccept(png, '.png, .jpg')).toBe(true)
    expect(matchesAccept(pdf, undefined)).toBe(true)
  })

  function Zone(props: Partial<Parameters<typeof useDropZone>[0]>) {
    const zone = useDropZone({ onDrop: () => {}, ...props })
    return (
      <div data-testid="zone" {...zone.getZoneProps()}>
        <input data-testid="input" {...zone.getInputProps()} />
        <span>inner</span>
        <button type="button" onClick={zone.open}>
          Browse
        </button>
      </div>
    )
  }

  const files = (...list: File[]) => ({ types: ['Files'], files: list, dropEffect: 'none' })

  it('stays over while moving across children, and hands out matching files', () => {
    const onDrop = vi.fn()
    const onReject = vi.fn()
    render(<Zone accept="image/*" onDrop={onDrop} onReject={onReject} />)
    const zone = screen.getByTestId('zone')
    const cat = new File(['x'], 'cat.png', { type: 'image/png' })
    const cv = new File(['x'], 'cv.pdf', { type: 'application/pdf' })
    fireEvent.dragEnter(zone, { dataTransfer: files(cat) })
    fireEvent.dragEnter(screen.getByText('inner'), { dataTransfer: files(cat) })
    fireEvent.dragLeave(zone, { dataTransfer: files(cat) })
    expect(zone.dataset.over).toBe('')
    fireEvent.drop(zone, { dataTransfer: files(cat, cv) })
    expect(zone.dataset.over).toBeUndefined()
    expect(onDrop).toHaveBeenCalledWith([cat])
    expect(onReject).toHaveBeenCalledWith([cv])
  })

  it('takes one file without multiple, and opens the picker', () => {
    const onDrop = vi.fn()
    render(<Zone multiple={false} onDrop={onDrop} />)
    const a = new File(['a'], 'a.txt', { type: 'text/plain' })
    const b = new File(['b'], 'b.txt', { type: 'text/plain' })
    fireEvent.drop(screen.getByTestId('zone'), { dataTransfer: files(a, b) })
    expect(onDrop).toHaveBeenCalledWith([a])
    const click = vi.spyOn(screen.getByTestId('input'), 'click')
    fireEvent.click(screen.getByText('Browse'))
    expect(click).toHaveBeenCalled()
  })
})
