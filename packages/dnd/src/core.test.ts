import { describe, expect, it, vi } from 'vitest'
import {
  arrayInsert,
  arrayMove,
  arrayRemove,
  autoScrollSpeed,
  clampIndex,
  clampToBounds,
  closestCenter,
  closestContainer,
  closestCorners,
  columnsFromRects,
  defaultAnnouncements,
  distance,
  dragReducer,
  gridNeighbor,
  idleDragState,
  insertionIndex,
  lockAxis,
  moveItem,
  pointerWithin,
  pointInRect,
  prefersReducedMotion,
  type Rect,
  rectCenter,
  rectFrom,
  rectIntersection,
  scrollableAncestors,
} from './core'

const rect = (x: number, y: number, width = 100, height = 50): Rect => ({ x, y, width, height })

describe('geometry', () => {
  it('measures centers, hits and distances', () => {
    expect(rectCenter(rect(10, 20))).toEqual({ x: 60, y: 45 })
    expect(pointInRect({ x: 60, y: 45 }, rect(10, 20))).toBe(true)
    expect(pointInRect({ x: 10, y: 20 }, rect(10, 20))).toBe(true) // the edge counts
    expect(pointInRect({ x: 9, y: 45 }, rect(10, 20))).toBe(false)
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('reads a box off an element', () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 12,
      top: 34,
      width: 56,
      height: 78,
    } as DOMRect)
    expect(rectFrom(el)).toEqual({ x: 12, y: 34, width: 56, height: 78 })
  })

  it('measures the area two boxes share', () => {
    expect(rectIntersection(rect(0, 0, 100, 100), rect(50, 50, 100, 100))).toBe(50 * 50)
    expect(rectIntersection(rect(0, 0, 100, 100), rect(200, 0, 100, 100))).toBe(0)
    // Touching along an edge is not overlapping.
    expect(rectIntersection(rect(0, 0, 100, 100), rect(100, 0, 100, 100))).toBe(0)
  })

  it('drops the movement the axis does not allow', () => {
    const delta = { x: 10, y: -20 }
    expect(lockAxis(delta, 'x')).toEqual({ x: 10, y: 0 })
    expect(lockAxis(delta, 'y')).toEqual({ x: 0, y: -20 })
    expect(lockAxis(delta, 'both')).toBe(delta)
  })

  it('keeps a box inside its bounds', () => {
    const bounds = rect(0, 0, 200, 200)
    expect(clampToBounds(rect(10, 10, 50, 50), bounds)).toEqual({ x: 10, y: 10 })
    expect(clampToBounds(rect(180, -30, 50, 50), bounds)).toEqual({ x: 150, y: 0 })
    // A box wider than the bounds is pinned to the corner rather than left to jitter.
    expect(clampToBounds(rect(40, 40, 400, 400), bounds)).toEqual({ x: 0, y: 0 })
  })
})

describe('collision detectors', () => {
  const candidates = [
    { id: 'a', rect: rect(0, 0, 100, 100) },
    { id: 'b', rect: rect(100, 0, 100, 100) },
    { id: 'small', rect: rect(20, 20, 20, 20) },
  ]

  it('pointerWithin takes the smallest box under the pointer, or nothing', () => {
    expect(pointerWithin({ point: { x: 30, y: 30 }, candidates })).toBe('small')
    expect(pointerWithin({ point: { x: 80, y: 80 }, candidates })).toBe('a')
    expect(pointerWithin({ point: { x: 500, y: 500 }, candidates })).toBe(null)
  })

  it('closestCenter falls back to the pointer when there is no dragged box', () => {
    expect(closestCenter({ point: { x: 190, y: 50 }, candidates })).toBe('b')
    expect(
      closestCenter({ point: { x: 190, y: 50 }, activeRect: rect(0, 0, 10, 10), candidates }),
    ).toBe('small')
  })

  it('closestCorners compares the four corners', () => {
    const two = [
      { id: 'left', rect: rect(0, 0, 10, 10) },
      { id: 'right', rect: rect(100, 0, 10, 10) },
    ]
    expect(
      closestCorners({ point: { x: 5, y: 5 }, activeRect: rect(4, 0, 10, 10), candidates: two }),
    ).toBe('left')
    expect(closestCorners({ point: { x: 98, y: 5 }, candidates: two })).toBe('right')
  })

  it('closestContainer only falls back when the pointer is outside everything', () => {
    expect(closestContainer({ point: { x: 30, y: 30 }, candidates })).toBe('small')
    expect(closestContainer({ point: { x: 300, y: 50 }, candidates })).toBe('b')
  })

  it('returns null with nothing to choose from', () => {
    expect(closestCenter({ point: { x: 0, y: 0 }, candidates: [] })).toBe(null)
    expect(closestCorners({ point: { x: 0, y: 0 }, candidates: [] })).toBe(null)
  })
})

describe('array helpers', () => {
  it('moves an item and counts the target against the shortened list', () => {
    expect(arrayMove(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(arrayMove(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(arrayMove(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(arrayMove(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('leaves the list alone when the index is not in it, and never mutates', () => {
    const items = ['a', 'b']
    expect(arrayMove(items, 5, 0)).toEqual(['a', 'b'])
    expect(arrayMove(items, -1, 0)).toEqual(['a', 'b'])
    expect(items).toEqual(['a', 'b'])
  })

  it('inserts and removes', () => {
    expect(arrayInsert(['a', 'c'], 1, 'b')).toEqual(['a', 'b', 'c'])
    expect(arrayInsert(['a'], 9, 'z')).toEqual(['a', 'z'])
    expect(arrayRemove(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  it('clamps indices', () => {
    expect(clampIndex(-4, 3)).toBe(0)
    expect(clampIndex(9, 3)).toBe(2)
    expect(clampIndex(1, 0)).toBe(0)
  })
})

describe('moveItem', () => {
  const groups = () => ({ todo: ['t1', 't2'], doing: ['d1'], done: [] as string[] })

  it('reorders inside one container', () => {
    const next = moveItem(
      groups(),
      { containerId: 'todo', index: 0 },
      { containerId: 'todo', index: 1 },
    )
    expect(next.todo).toEqual(['t2', 't1'])
  })

  it('moves across containers, including into an empty one', () => {
    const next = moveItem(
      groups(),
      { containerId: 'todo', index: 0 },
      { containerId: 'doing', index: 1 },
    )
    expect(next.todo).toEqual(['t2'])
    expect(next.doing).toEqual(['d1', 't1'])

    const emptied = moveItem(
      groups(),
      { containerId: 'doing', index: 0 },
      { containerId: 'done', index: 0 },
    )
    expect(emptied.doing).toEqual([])
    expect(emptied.done).toEqual(['d1'])
  })

  it('keeps the untouched containers, and the whole object when nothing moves', () => {
    const before = groups()
    const next = moveItem(
      before,
      { containerId: 'todo', index: 0 },
      { containerId: 'doing', index: 0 },
    )
    expect(next.done).toBe(before.done)
    expect(
      moveItem(before, { containerId: 'todo', index: 1 }, { containerId: 'todo', index: 1 }),
    ).toBe(before)
    expect(
      moveItem(before, { containerId: 'nope', index: 0 }, { containerId: 'todo', index: 0 }),
    ).toBe(before)
    expect(
      moveItem(before, { containerId: 'todo', index: 7 }, { containerId: 'todo', index: 0 }),
    ).toBe(before)
    expect(
      moveItem(before, { containerId: 'todo', index: 0 }, { containerId: 'nope', index: 0 }),
    ).toBe(before)
  })
})

describe('gridNeighbor', () => {
  it('walks a vertical list with one column', () => {
    expect(gridNeighbor(0, 3, 1, 'down')).toBe(1)
    expect(gridNeighbor(2, 3, 1, 'down')).toBe(2)
    expect(gridNeighbor(0, 3, 1, 'up')).toBe(0)
  })

  it('walks a 3 by 3 grid and clamps at the ends', () => {
    expect(gridNeighbor(0, 9, 3, 'down')).toBe(3)
    expect(gridNeighbor(4, 9, 3, 'up')).toBe(1)
    expect(gridNeighbor(4, 9, 3, 'right')).toBe(5)
    // The right edge of a row runs on into the next one, the list end holds.
    expect(gridNeighbor(2, 9, 3, 'right')).toBe(3)
    expect(gridNeighbor(8, 9, 3, 'down')).toBe(8)
    expect(gridNeighbor(1, 9, 3, 'up')).toBe(0)
  })
})

describe('columnsFromRects', () => {
  it('counts how many boxes share the first row', () => {
    const grid = [rect(0, 0), rect(100, 0), rect(200, 0), rect(0, 50), rect(100, 50)]
    expect(columnsFromRects(grid)).toBe(3)
    expect(columnsFromRects([rect(0, 0), rect(0, 50), rect(0, 100)])).toBe(1)
    expect(columnsFromRects([])).toBe(1)
  })
})

describe('insertionIndex', () => {
  const column = [rect(0, 0, 100, 50), rect(0, 50, 100, 50), rect(0, 100, 100, 50)]

  it('counts the boxes a vertical pointer has passed', () => {
    expect(insertionIndex({ x: 50, y: 10 }, column)).toBe(0)
    expect(insertionIndex({ x: 50, y: 30 }, column)).toBe(1)
    expect(insertionIndex({ x: 50, y: 80 }, column)).toBe(2)
    expect(insertionIndex({ x: 50, y: 999 }, column)).toBe(3)
  })

  it('does the same along x', () => {
    const row = [rect(0, 0, 50, 100), rect(50, 0, 50, 100)]
    expect(insertionIndex({ x: 10, y: 50 }, row, 'x')).toBe(0)
    expect(insertionIndex({ x: 60, y: 50 }, row, 'x')).toBe(1)
    expect(insertionIndex({ x: 90, y: 50 }, row, 'x')).toBe(2)
  })

  it('reads a grid in reading order', () => {
    const grid = [
      rect(0, 0, 100, 50),
      rect(100, 0, 100, 50),
      rect(200, 0, 100, 50),
      rect(0, 50, 100, 50),
      rect(100, 50, 100, 50),
      rect(200, 50, 100, 50),
    ]
    expect(insertionIndex({ x: 250, y: 25 }, grid, 'both')).toBe(2)
    expect(insertionIndex({ x: 10, y: 25 }, grid, 'both')).toBe(0)
    expect(insertionIndex({ x: 150, y: 75 }, grid, 'both')).toBe(4)
    expect(insertionIndex({ x: 50, y: 200 }, grid, 'both')).toBe(6)
  })

  it('lands on 0 with nothing to compare against', () => {
    expect(insertionIndex({ x: 0, y: 0 }, [])).toBe(0)
  })
})

describe('autoScrollSpeed', () => {
  const box = rect(0, 0, 100, 100)
  const options = { threshold: 0.2, maxSpeed: 10 }

  it('is still away from the edges', () => {
    expect(autoScrollSpeed({ x: 50, y: 50 }, box, options)).toEqual({ x: 0, y: 0 })
  })

  it('ramps up towards whichever edge is close', () => {
    expect(autoScrollSpeed({ x: 50, y: 10 }, box, options).y).toBe(-5)
    expect(autoScrollSpeed({ x: 50, y: 0 }, box, options).y).toBe(-10)
    expect(autoScrollSpeed({ x: 50, y: 95 }, box, options).y).toBe(7.5)
    expect(autoScrollSpeed({ x: 5, y: 50 }, box, options).x).toBe(-7.5)
  })

  it('stays put outside the box, and on the axis it is not allowed', () => {
    expect(autoScrollSpeed({ x: 50, y: 150 }, box, options)).toEqual({ x: 0, y: 0 })
    expect(autoScrollSpeed({ x: 5, y: 5 }, box, { ...options, axis: 'y' }).x).toBe(0)
    expect(autoScrollSpeed({ x: 5, y: 5 }, box, { ...options, axis: 'x' }).y).toBe(0)
  })
})

describe('scrollableAncestors', () => {
  it('finds the ancestors that can actually scroll', () => {
    const outer = document.createElement('div')
    const scroller = document.createElement('div')
    const item = document.createElement('div')
    scroller.style.overflowY = 'auto'
    Object.defineProperty(scroller, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true })
    outer.appendChild(scroller)
    scroller.appendChild(item)
    document.body.appendChild(outer)

    expect(scrollableAncestors(item)).toEqual([scroller])
    // An ancestor with room to spare is not a scroller.
    Object.defineProperty(scroller, 'scrollHeight', { value: 100, configurable: true })
    expect(scrollableAncestors(item)).toEqual([])
    outer.remove()
  })
})

describe('dragReducer', () => {
  const from = { containerId: 'list', index: 1 }
  const started = dragReducer(idleDragState, {
    type: 'start',
    id: 'a',
    from,
    mode: 'pointer',
    point: { x: 10, y: 10 },
  })

  it('picks an item up', () => {
    expect(started.phase).toBe('dragging')
    expect(started.activeId).toBe('a')
    expect(started.mode).toBe('pointer')
    expect(started.from).toEqual(from)
    expect(started.to).toEqual(from)
    expect(started.origin).toEqual({ x: 10, y: 10 })
    expect(started.delta).toEqual({ x: 0, y: 0 })
  })

  it('ignores everything but a start while idle', () => {
    expect(dragReducer(idleDragState, { type: 'move', point: { x: 5, y: 5 } })).toBe(idleDragState)
    expect(dragReducer(idleDragState, { type: 'over', to: from })).toBe(idleDragState)
  })

  it('tracks the pointer and reports the delta', () => {
    const moved = dragReducer(started, { type: 'move', point: { x: 40, y: 0 } })
    expect(moved.delta).toEqual({ x: 30, y: -10 })
    expect(moved.pointer).toEqual({ x: 40, y: 0 })
  })

  it('returns the same state when nothing changed, so React can skip the render', () => {
    expect(dragReducer(started, { type: 'move', point: { x: 10, y: 10 } })).toBe(started)
    expect(dragReducer(started, { type: 'over', to: { containerId: 'list', index: 1 } })).toBe(
      started,
    )
  })

  it('moves the target slot without touching the delta', () => {
    const over = dragReducer(started, { type: 'over', to: { containerId: 'other', index: 0 } })
    expect(over.to).toEqual({ containerId: 'other', index: 0 })
    expect(over.from).toEqual(from)
    expect(over.delta).toEqual(started.delta)
  })

  it('goes back to idle on both a drop and a cancel', () => {
    expect(dragReducer(started, { type: 'drop' })).toBe(idleDragState)
    expect(dragReducer(started, { type: 'cancel' })).toBe(idleDragState)
  })
})

describe('defaultAnnouncements', () => {
  const context = {
    id: 'Design review',
    from: { containerId: 'todo', index: 0 },
    to: { containerId: 'todo', index: 2 },
    count: 4,
    delta: { x: 0, y: 120 },
  }

  it('says where the item is and how to drive it', () => {
    expect(defaultAnnouncements.start({ ...context, to: context.from })).toContain(
      'Picked up Design review, position 1 of 4',
    )
    expect(defaultAnnouncements.start({ ...context, to: context.from })).toContain(
      'escape to cancel',
    )
    expect(defaultAnnouncements.move(context)).toBe('Design review moved to position 3 of 4.')
    expect(defaultAnnouncements.drop(context)).toBe('Design review dropped at position 3 of 4.')
  })

  it('names the container once the item has left the one it started in', () => {
    const across = { ...context, to: { containerId: 'doing', index: 1 } }
    expect(defaultAnnouncements.move(across)).toBe(
      'Design review moved to position 2 of 4 in doing.',
    )
  })

  it('reports pixels for a drag with no list', () => {
    const free = { ...context, count: 0, delta: { x: 12.4, y: -7.6 } }
    expect(defaultAnnouncements.move(free)).toBe(
      'Design review moved to 12, -8 pixels from the start.',
    )
  })

  it('says nothing changed on a cancel', () => {
    const cancelled = { ...context, to: context.from }
    expect(defaultAnnouncements.cancel(cancelled)).toBe(
      'Dragging Design review cancelled, back at position 1 of 4.',
    )
  })
})

describe('prefersReducedMotion', () => {
  it('follows the media query', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia')
    matchMedia.mockReturnValue({ matches: true } as MediaQueryList)
    expect(prefersReducedMotion()).toBe(true)
    matchMedia.mockReturnValue({ matches: false } as MediaQueryList)
    expect(prefersReducedMotion()).toBe(false)
    matchMedia.mockRestore()
  })
})
