/**
 * Drag and drop maths, framework agnostic.
 *
 * Nothing here runs on import and nothing reads `window` at the module scope, so the file is
 * safe to load on a server. Coordinates are viewport pixels, the same space
 * `getBoundingClientRect` reports, and indices are always zero based.
 */

/** Which way movement is allowed. `both` is a grid or a free drag. */
export type Axis = 'x' | 'y' | 'both'
/** An arrow key, resolved. */
export type Direction = 'up' | 'down' | 'left' | 'right'
/** What is driving the drag. */
export type DragMode = 'pointer' | 'keyboard'

export interface Point {
  x: number
  y: number
}

/** Top left corner plus a size, in viewport pixels. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A drop candidate: an id and the box it occupies. */
export interface Collidable {
  id: string
  rect: Rect
}

export interface CollisionArgs {
  /** Where the pointer is. */
  point: Point
  /** Box of the item being dragged, when there is one. */
  activeRect?: Rect | null
  /** Boxes the item could land on. */
  candidates: Collidable[]
}

/** Picks the candidate a drag is over, or null when it is over none of them. */
export type CollisionDetector = (args: CollisionArgs) => string | null

/** A slot: a container plus a position inside it. */
export interface DragLocation {
  containerId: string
  index: number
}

// -- geometry ---------------------------------------------------------------------------------

/** Read an element's box. Call it from an effect, never while rendering. */
export function rectFrom(element: Element): Rect {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { x: left, y: top, width, height }
}

export const rectCenter = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
})

export const pointInRect = (point: Point, rect: Rect): boolean =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/** Area the two boxes share, in square pixels. 0 when they do not touch. */
export function rectIntersection(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

/** Drop the part of a movement the axis does not allow. */
export function lockAxis(delta: Point, axis: Axis): Point {
  if (axis === 'x') return { x: delta.x, y: 0 }
  if (axis === 'y') return { x: 0, y: delta.y }
  return delta
}

/**
 * Move `rect` the shortest distance that puts it inside `bounds` and return its new top left.
 * A rect bigger than the bounds is pinned to the top left corner instead of jittering.
 */
export function clampToBounds(rect: Rect, bounds: Rect): Point {
  const maxX = bounds.x + bounds.width - rect.width
  const maxY = bounds.y + bounds.height - rect.height
  return {
    x: maxX <= bounds.x ? bounds.x : Math.min(Math.max(rect.x, bounds.x), maxX),
    y: maxY <= bounds.y ? bounds.y : Math.min(Math.max(rect.y, bounds.y), maxY),
  }
}

// -- collision --------------------------------------------------------------------------------

type Corners = [Point, Point, Point, Point]

const cornersOf = (r: Rect): Corners => [
  { x: r.x, y: r.y },
  { x: r.x + r.width, y: r.y },
  { x: r.x, y: r.y + r.height },
  { x: r.x + r.width, y: r.y + r.height },
]

function nearest(candidates: Collidable[], score: (rect: Rect) => number): string | null {
  let best: string | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const value = score(candidate.rect)
    if (value < bestScore) {
      bestScore = value
      best = candidate.id
    }
  }
  return best
}

/** The smallest candidate under the pointer, or null when the pointer is over none. */
export const pointerWithin: CollisionDetector = ({ point, candidates }) => {
  let best: string | null = null
  let bestArea = Number.POSITIVE_INFINITY
  for (const { id, rect } of candidates) {
    if (!pointInRect(point, rect)) continue
    const area = rect.width * rect.height
    if (area < bestArea) {
      bestArea = area
      best = id
    }
  }
  return best
}

/** The candidate whose center is nearest the center of the dragged item, or the pointer. */
export const closestCenter: CollisionDetector = ({ point, activeRect, candidates }) => {
  const from = activeRect ? rectCenter(activeRect) : point
  return nearest(candidates, (rect) => distance(from, rectCenter(rect)))
}

/** Like `closestCenter` but comparing corners, which is steadier with boxes of uneven size. */
export const closestCorners: CollisionDetector = ({ point, activeRect, candidates }) => {
  const [a0, a1, a2, a3] = cornersOf(activeRect ?? { x: point.x, y: point.y, width: 0, height: 0 })
  return nearest(candidates, (rect) => {
    const [b0, b1, b2, b3] = cornersOf(rect)
    return distance(a0, b0) + distance(a1, b1) + distance(a2, b2) + distance(a3, b3)
  })
}

/**
 * `pointerWithin` first, falling back to `closestCenter` when the pointer is over nothing.
 * This is the default for deciding which container a drag is over.
 */
export const closestContainer: CollisionDetector = (args) =>
  pointerWithin(args) ?? closestCenter(args)

// -- reordering -------------------------------------------------------------------------------

/** Keep an index inside `[0, length - 1]`. Returns 0 for an empty list. */
export const clampIndex = (index: number, length: number): number =>
  length <= 0 ? 0 : Math.min(Math.max(index, 0), length - 1)

/**
 * A copy of `array` with the item at `from` taken out and put back at `to`. `to` counts against
 * the list with the item already removed, so the last valid position is `length - 1`.
 */
export function arrayMove<T>(array: readonly T[], from: number, to: number): T[] {
  const next = array.slice()
  if (from < 0 || from >= array.length) return next
  const removed = next.splice(from, 1)
  if (removed.length === 0) return next
  next.splice(Math.min(Math.max(to, 0), next.length), 0, ...removed)
  return next
}

/** A copy of `array` with `item` inserted at `index`. An index of `length` appends. */
export function arrayInsert<T>(array: readonly T[], index: number, item: T): T[] {
  const next = array.slice()
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item)
  return next
}

/** A copy of `array` without the item at `index`. */
export function arrayRemove<T>(array: readonly T[], index: number): T[] {
  const next = array.slice()
  next.splice(index, 1)
  return next
}

/**
 * Take the item at `from` out of its list and put it back at `to`, in the same list or another
 * one. Lists that are not touched keep their identity, so React can skip them.
 */
export function moveItem<T>(
  groups: Record<string, T[]>,
  from: DragLocation,
  to: DragLocation,
): Record<string, T[]> {
  const source = groups[from.containerId]
  if (!source || from.index < 0 || from.index >= source.length) return groups
  if (from.containerId === to.containerId) {
    if (from.index === to.index) return groups
    return { ...groups, [from.containerId]: arrayMove(source, from.index, to.index) }
  }
  const target = groups[to.containerId]
  if (!target) return groups
  const item = source[from.index] as T
  return {
    ...groups,
    [from.containerId]: arrayRemove(source, from.index),
    [to.containerId]: arrayInsert(target, to.index, item),
  }
}

/**
 * Index reached by stepping one cell in `direction` on a grid `columns` wide. Use 1 column for
 * a vertical list and the list length for a horizontal one. The result is clamped to the list.
 */
export function gridNeighbor(
  index: number,
  length: number,
  columns: number,
  direction: Direction,
): number {
  const span = Math.max(columns, 1)
  const step =
    direction === 'left' ? -1 : direction === 'right' ? 1 : direction === 'up' ? -span : span
  return clampIndex(index + step, length)
}

/** How many boxes share the first one's row. Reads a grid's column count off its layout. */
export function columnsFromRects(rects: Rect[]): number {
  const first = rects[0]
  if (!first) return 1
  let columns = 0
  for (const rect of rects) {
    if (rect.y >= first.y + first.height) break
    columns++
  }
  return Math.max(columns, 1)
}

/**
 * Where a dragged item lands if it is dropped now: how many of `rects` come before `point`.
 * Pass the boxes of the *other* items in the list, in order, so the answer is a position in the
 * list with the dragged item already taken out. On `both` the comparison is reading order.
 */
export function insertionIndex(point: Point, rects: Rect[], axis: Axis = 'y'): number {
  let index = 0
  for (const rect of rects) {
    const center = rectCenter(rect)
    let before: boolean
    if (axis === 'x') before = center.x < point.x
    else if (axis === 'y') before = center.y < point.y
    else if (point.y > rect.y + rect.height) before = true
    else if (point.y < rect.y) before = false
    else before = center.x < point.x
    if (before) index++
  }
  return index
}

// -- auto scroll ------------------------------------------------------------------------------

export interface AutoScrollOptions {
  /** How deep the sensitive band is at each edge, as a fraction of the box. Default 0.15. */
  threshold?: number
  /** Pixels scrolled per frame right at the edge. Default 12. */
  maxSpeed?: number
  /** Which way the box may scroll. Default `both`. */
  axis?: Axis
}

/**
 * Pixels to scroll this frame while the pointer sits near the edges of `rect`. Zero once the
 * pointer is away from the edges, and zero while it is outside the box altogether.
 */
export function autoScrollSpeed(point: Point, rect: Rect, options: AutoScrollOptions = {}): Point {
  const { threshold = 0.15, maxSpeed = 12, axis = 'both' } = options
  if (!pointInRect(point, rect)) return { x: 0, y: 0 }
  const speed = (fromStart: number, fromEnd: number, size: number) => {
    const band = size * threshold
    if (band <= 0) return 0
    if (fromStart < band) return -maxSpeed * (1 - fromStart / band)
    if (fromEnd < band) return maxSpeed * (1 - fromEnd / band)
    return 0
  }
  return {
    x: axis === 'y' ? 0 : speed(point.x - rect.x, rect.x + rect.width - point.x, rect.width),
    y: axis === 'x' ? 0 : speed(point.y - rect.y, rect.y + rect.height - point.y, rect.height),
  }
}

const scrollableOverflow = /(auto|scroll|overlay)/

/**
 * Ancestors of `element` that can actually scroll right now, nearest first, with the page last
 * when the page itself scrolls.
 */
export function scrollableAncestors(element: Element): HTMLElement[] {
  const view = element.ownerDocument.defaultView
  if (!view) return []
  const found: HTMLElement[] = []
  let node = element.parentElement
  while (node) {
    const { overflowX, overflowY } = view.getComputedStyle(node)
    if (
      (scrollableOverflow.test(overflowY) && node.scrollHeight > node.clientHeight) ||
      (scrollableOverflow.test(overflowX) && node.scrollWidth > node.clientWidth)
    ) {
      found.push(node)
    }
    node = node.parentElement
  }
  const page = element.ownerDocument.scrollingElement
  if (
    page instanceof view.HTMLElement &&
    !found.includes(page) &&
    (page.scrollHeight > page.clientHeight || page.scrollWidth > page.clientWidth)
  ) {
    found.push(page)
  }
  return found
}

// -- state machine ----------------------------------------------------------------------------

export interface DragState {
  /** `idle` until a drag is actually running. */
  phase: 'idle' | 'dragging'
  mode: DragMode | null
  /** Item being dragged. */
  activeId: string | null
  /** Slot the item started in. */
  from: DragLocation | null
  /** Slot it would land in if it were dropped now. Equal to `from` until it moves. */
  to: DragLocation | null
  /** Pointer position when the drag started. Zero for a keyboard drag. */
  origin: Point
  /** Latest pointer position. */
  pointer: Point
  /** `pointer` minus `origin`. */
  delta: Point
}

export type DragAction =
  | { type: 'start'; id: string; from: DragLocation; mode: DragMode; point: Point }
  | { type: 'move'; point: Point }
  | { type: 'over'; to: DragLocation }
  | { type: 'drop' }
  | { type: 'cancel' }

const zero: Point = { x: 0, y: 0 }

/** The state before anything is picked up, and the state a drop or a cancel returns to. */
export const idleDragState: DragState = {
  phase: 'idle',
  mode: null,
  activeId: null,
  from: null,
  to: null,
  origin: zero,
  pointer: zero,
  delta: zero,
}

/**
 * The whole drag lifecycle as a pure function. Actions that change nothing return the same
 * object, so React skips the render. `drop` and `cancel` both land back on `idleDragState`:
 * cancelling only differs in that the caller does not apply the move.
 */
export function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'start':
      return {
        phase: 'dragging',
        mode: action.mode,
        activeId: action.id,
        from: action.from,
        to: action.from,
        origin: action.point,
        pointer: action.point,
        delta: zero,
      }
    case 'move': {
      if (state.phase === 'idle') return state
      const delta = { x: action.point.x - state.origin.x, y: action.point.y - state.origin.y }
      if (delta.x === state.delta.x && delta.y === state.delta.y) return state
      return { ...state, pointer: action.point, delta }
    }
    case 'over': {
      if (state.phase === 'idle') return state
      const { to } = state
      if (to && to.containerId === action.to.containerId && to.index === action.to.index) {
        return state
      }
      return { ...state, to: action.to }
    }
    case 'drop':
    case 'cancel':
      return idleDragState
  }
}

// -- announcements ----------------------------------------------------------------------------

export interface AnnouncementContext {
  /** Item being dragged. */
  id: string
  /** Slot the drag started in. */
  from: DragLocation
  /** Slot it is over now. On a cancel this is `from` again. */
  to: DragLocation
  /** Items in the container it is over, counting the dragged one. 0 for a free drag. */
  count: number
  /** Offset from where the drag started, in pixels. */
  delta: Point
}

/** Every message a screen reader hears. Leave one out to keep the default. */
export interface DragAnnouncements {
  /** The item was picked up. */
  start?: (context: AnnouncementContext) => string
  /** The item moved to another slot, or to another place on screen. */
  move?: (context: AnnouncementContext) => string
  /** The item was dropped. */
  drop?: (context: AnnouncementContext) => string
  /** The drag was cancelled and nothing changed. */
  cancel?: (context: AnnouncementContext) => string
}

const place = (context: AnnouncementContext): string => {
  const { to, count, delta } = context
  if (count <= 0) return `${Math.round(delta.x)}, ${Math.round(delta.y)} pixels from the start`
  const at = `position ${to.index + 1} of ${count}`
  return to.containerId && to.containerId !== context.from.containerId
    ? `${at} in ${to.containerId}`
    : at
}

/** Plain English, and the shape to copy when writing the messages in another language. */
export const defaultAnnouncements: Required<DragAnnouncements> = {
  start: (context) =>
    context.count > 0
      ? `Picked up ${context.id}, ${place(context)}. Use the arrow keys to move it, space or enter to drop it, escape to cancel.`
      : `Picked up ${context.id}. Use the arrow keys to move it, space or enter to drop it, escape to cancel.`,
  move: (context) => `${context.id} moved to ${place(context)}.`,
  drop: (context) => `${context.id} dropped at ${place(context)}.`,
  cancel: (context) => `Dragging ${context.id} cancelled, back at ${place(context)}.`,
}

/** True when the user asked for less motion. False on a server, where there is no one to ask. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
