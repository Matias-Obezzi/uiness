# @uiness/dnd

Headless drag and drop primitives for React. Sortable lists, boards with several containers, grids you can reorder in two dimensions, and elements you can drop anywhere. Pointer Events, so mouse, touch and pen all work; full keyboard support, so it works without a pointer at all. Zero dependencies, ESM and CommonJS, typed.

```bash
pnpm add @uiness/dnd
```

Nothing here renders anything. Every hook hands back prop getters you spread on your own markup, plus the state you need to style it.

## The shape of it

Four hooks, one for each kind of drag:

| Hook | For |
| --- | --- |
| `useSortable` | one list, reordered along an axis or across a grid |
| `useSortableGroups` | several containers, items moving within and between them |
| `useDraggable` | one element, moved anywhere |
| `useDragGesture` | raw pointer and keyboard deltas, when none of the above fit |

Every drag can be driven two ways. With a pointer: press, move past the activation distance, release. With the keyboard: <kbd>Space</kbd> or <kbd>Enter</kbd> to pick up, the arrow keys to move, <kbd>Space</kbd> or <kbd>Enter</kbd> to drop, <kbd>Escape</kbd> to cancel. <kbd>Escape</kbd> works during a pointer drag too, wherever the focus happens to be, and always leaves things exactly as they were.

## Sortable list

`useSortable` owns one list. You pass the order in and render the order it gives back: `result.items` is your list with the in-flight move already applied, so the list reorders under the pointer. `onReorder` fires once, on drop, and only when the item actually landed somewhere new.

```tsx
import { useSortable } from '@uiness/dnd'

function TaskList() {
  const [ids, setIds] = useState(['write', 'review', 'ship'])
  const sortable = useSortable({ items: ids, onReorder: setIds })

  return (
    <>
      <ul {...sortable.getListProps()}>
        {sortable.items.map((id) => (
          <li key={id} {...sortable.getItemProps(id)} {...sortable.getHandleProps(id)}>
            {id}
          </li>
        ))}
      </ul>
      <div {...sortable.getLiveRegionProps()}>{sortable.announcement}</div>
    </>
  )
}
```

Spreading `getItemProps` and `getHandleProps` on the same element makes the whole row draggable. Put `getHandleProps` on a child instead and only that child starts a drag — which is what you want on touch, because the handle is the part that stops the browser scrolling the page.

For a horizontal list pass `axis: 'x'`. The arrow keys follow: on `y` it is up and down, on `x` it is left and right.

### `useSortable(options)`

```ts
function useSortable(options: SortableOptions): SortableResult

interface SortableOptions {
  /** Item ids, in their current order. Ids have to be unique and stable. */
  items: string[]
  /** Called once, when a drag is dropped somewhere other than where it started. */
  onReorder: (items: string[], change: SortableChange) => void
  /** 'y' for a vertical list (default), 'x' for a horizontal one, 'both' for a grid. */
  axis?: 'x' | 'y' | 'both'
  /** Columns per row on a 'both' axis. Measured from the layout when left out. */
  columns?: number
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Scroll the nearest scrollable ancestor near its edges. Default true. */
  autoScroll?: boolean | AutoScrollOptions
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls an item. Default 'sortable item'. */
  roleDescription?: string
  onDragStart?: (id: string, index: number) => void
  onDragCancel?: (id: string, index: number) => void
}

interface SortableChange {
  id: string
  from: number
  to: number
}

interface SortableResult {
  /** The order to render: the in-flight one while a drag runs, the prop otherwise. */
  items: string[]
  activeId: string | null
  /** Index the drag started from, or -1. */
  activeIndex: number
  /** Index it would land on if dropped now, or -1. */
  overIndex: number
  isDragging: boolean
  mode: 'pointer' | 'keyboard' | null
  /** Pointer movement since the drag started. Zero for a keyboard drag. */
  delta: Point
  /** Box of the dragged item as it was when the drag started, or null. */
  activeRect: Rect | null
  reducedMotion: boolean
  /** Latest message for the live region. */
  announcement: string
  /** Stop the drag and put everything back. */
  cancel: () => void
  getListProps: () => DragContainerProps
  getItemProps: (id: string) => DragItemProps
  getHandleProps: (id: string) => DragHandleProps
  getOverlayProps: () => DragOverlayProps
  getLiveRegionProps: () => LiveRegionProps
}
```

## Kanban board

`useSortableGroups` is the same thing keyed by container. `groups` maps a container id to the ids it holds; an empty array is a valid, droppable container. `onChange` gives you the whole map back, with the arrays you did not touch kept by reference.

With the keyboard, up and down move inside a column and left and right cross to the next one, in the `order` you give (or `Object.keys(groups)`).

```tsx
import { useSortableGroups } from '@uiness/dnd'

const COLUMNS = ['todo', 'doing', 'done']

function Board() {
  const [groups, setGroups] = useState({ todo: ['a', 'b'], doing: ['c'], done: [] })
  const board = useSortableGroups({ groups, order: COLUMNS, onChange: setGroups })

  return (
    <>
      <div style={{ display: 'flex', gap: 16 }}>
        {COLUMNS.map((column) => (
          <ul key={column} {...board.getGroupProps(column)}>
            {board.groups[column]?.map((id) => (
              <li key={id} {...board.getItemProps(id)} {...board.getHandleProps(id)}>
                {id}
              </li>
            ))}
          </ul>
        ))}
      </div>
      <div {...board.getLiveRegionProps()}>{board.announcement}</div>
    </>
  )
}
```

The container the drag is over carries `data-over`, so `[data-over] { background: … }` is all the highlight needs.

### `useSortableGroups(options)`

```ts
function useSortableGroups(options: SortableGroupsOptions): SortableGroupsResult

interface SortableGroupsOptions {
  /** Container id to the ids it holds, in order. Empty containers are valid drop targets. */
  groups: Record<string, string[]>
  /** Called once, when a drag is dropped somewhere other than where it started. */
  onChange: (groups: Record<string, string[]>, change: GroupsChange) => void
  /** Container order for keyboard moves across containers. Default Object.keys(groups). */
  order?: string[]
  /** Axis inside a container. 'y' (default) puts the containers side by side. */
  axis?: 'x' | 'y' | 'both'
  columns?: number
  disabled?: boolean
  activationDistance?: number
  /** Which container the pointer is over. Default closestContainer. */
  collisionDetection?: CollisionDetector
  autoScroll?: boolean | AutoScrollOptions
  announcements?: DragAnnouncements
  roleDescription?: string
  onDragStart?: (id: string, at: DragLocation) => void
  onDragCancel?: (id: string, at: DragLocation) => void
}

interface GroupsChange {
  id: string
  from: DragLocation
  to: DragLocation
}

interface SortableGroupsResult {
  /** The containers to render: the in-flight state while a drag runs. */
  groups: Record<string, string[]>
  activeId: string | null
  /** Slot the drag started in, or null. */
  from: DragLocation | null
  /** Slot it would land in if dropped now, or null. */
  over: DragLocation | null
  isDragging: boolean
  mode: 'pointer' | 'keyboard' | null
  delta: Point
  activeRect: Rect | null
  reducedMotion: boolean
  announcement: string
  cancel: () => void
  getGroupProps: (groupId: string) => DragContainerProps
  getItemProps: (id: string) => DragItemProps
  getHandleProps: (id: string) => DragHandleProps
  getOverlayProps: () => DragOverlayProps
  getLiveRegionProps: () => LiveRegionProps
}
```

## Reorderable grid

A grid is `useSortable` with `axis: 'both'`. Hit testing reads the boxes in reading order, so dropping between two icons on a row does what it looks like it does. The arrow keys move a whole row at a time up and down and one cell left and right; the column count is measured off the layout, or you can pass `columns` if you already know it.

```tsx
const grid = useSortable({ items: icons, onReorder: setIcons, axis: 'both', columns: 4 })

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }} {...grid.getListProps()}>
  {grid.items.map((id) => (
    <button key={id} type="button" {...grid.getItemProps(id)} {...grid.getHandleProps(id)}>
      {id}
    </button>
  ))}
</div>
<div {...grid.getLiveRegionProps()}>{grid.announcement}</div>
```

## Free dragging

`useDraggable` moves one element and nothing else: a dialog by its title bar, a floating panel, a pin on a map. The position is an offset from wherever the element already sits, written as a `translate3d`, so it composes with whatever CSS put it there.

```tsx
import { useDraggable } from '@uiness/dnd'

function Dialog({ children }) {
  const drag = useDraggable({ id: 'dialog', bounds: 'parent' })

  return (
    <div {...drag.getElementProps()} className="dialog">
      <header {...drag.getHandleProps()}>Drag me</header>
      {children}
      <div {...drag.getLiveRegionProps()}>{drag.announcement}</div>
    </div>
  )
}
```

Leave `position` out and the hook owns it. Pass `position` and it becomes controlled, and you update it from `onPositionChange`. Either way `setPosition` moves the element without a drag, and a cancelled drag returns it to where it was picked up.

### `useDraggable(options)`

```ts
function useDraggable(options?: DraggableOptions): DraggableResult

interface DraggableOptions extends DragGestureOptions {
  /** Name read out in the announcements. Default 'item'. */
  id?: string
  /** Controlled offset. Leave it out to let the hook own the position. */
  position?: Point
  /** Offset to start from when the hook owns the position. Default { x: 0, y: 0 }. */
  defaultPosition?: Point
  /** Every change, including the ones during a drag. */
  onPositionChange?: (position: Point) => void
  /** Once, when the drag is dropped. */
  onDragEnd?: (position: Point) => void
  /** Keep the element inside a box: a rect in viewport pixels, or its offset parent. */
  bounds?: Rect | 'parent' | null
  announcements?: DragAnnouncements
}

interface DraggableResult {
  /** Offset from where the element sits in the layout, in pixels. */
  position: Point
  isDragging: boolean
  mode: 'pointer' | 'keyboard' | null
  delta: Point
  reducedMotion: boolean
  announcement: string
  /** Move the element without a drag. */
  setPosition: (position: Point) => void
  cancel: () => void
  getElementProps: () => DragElementProps
  getHandleProps: () => DragHandleProps
  getLiveRegionProps: () => LiveRegionProps
}
```

## The raw gesture

`useDragGesture` is what the others are built on: pointer and keyboard handling for one element, no lists, no drop targets, no announcements. It reports deltas and you decide what they mean — a resize handle, a slider, a canvas pan.

```tsx
const gesture = useDragGesture({
  axis: 'x',
  onMove: ({ delta }) => setWidth(startWidth + delta.x),
})

<div {...gesture.getHandleProps()} />
```

```ts
function useDragGesture(options?: DragGestureOptions): DragGestureResult

interface DragGestureOptions {
  /** Which way the element may move. Default 'both'. */
  axis?: 'x' | 'y' | 'both'
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Pixels one arrow key press moves the element. Default 20. */
  keyboardStep?: number
  /** What a screen reader calls the handle. Default 'draggable'. */
  roleDescription?: string
  onStart?: (event: DragGestureEvent) => void
  onMove?: (event: DragGestureEvent) => void
  /** The drag was dropped. */
  onEnd?: (event: DragGestureEvent) => void
  /** Escape was pressed, focus was lost or the pointer was taken away. */
  onCancel?: (event: DragGestureEvent) => void
}

interface DragGestureEvent {
  mode: 'pointer' | 'keyboard'
  /** Pointer position when the drag started. Zero for a keyboard drag. */
  origin: Point
  /** Latest pointer position. */
  pointer: Point
  /** Movement since the drag started, with the axis lock applied. */
  delta: Point
}

interface DragGestureResult {
  isDragging: boolean
  mode: 'pointer' | 'keyboard' | null
  delta: Point
  cancel: () => void
  getHandleProps: () => DragHandleProps
}
```

## The prop getters

```ts
/** Spread on the element the user grabs. */
interface DragHandleProps {
  role: 'button'
  tabIndex: number
  'aria-roledescription': string
  'aria-pressed': boolean
  'aria-disabled'?: true
  'data-dragging'?: ''
  style: React.CSSProperties
  onPointerDown: React.PointerEventHandler<HTMLElement>
  onKeyDown: React.KeyboardEventHandler<HTMLElement>
  onBlur: React.FocusEventHandler<HTMLElement>
}

/** Spread on the element that moves, so its box can be measured. */
interface DragItemProps {
  ref: (node: HTMLElement | null) => void
  'data-dnd-id': string
  'data-dragging'?: ''
}

/** Spread on a list or a board column. */
interface DragContainerProps {
  ref: (node: HTMLElement | null) => void
  'data-dnd-container': string
  'data-over'?: ''
}

/** Spread on the element a `useDraggable` moves. */
interface DragElementProps {
  ref: (node: HTMLElement | null) => void
  'data-dragging'?: ''
  style: React.CSSProperties
}

/** Spread on an element rendered once, anywhere. It is visually hidden already. */
interface LiveRegionProps {
  role: 'status'
  'aria-live': 'assertive'
  'aria-atomic': true
  style: React.CSSProperties
}

/** Spread on a copy of the item that follows the pointer. See below. */
interface DragOverlayProps {
  'aria-hidden': true
  style: React.CSSProperties
}
```

Each getter returns a `style`. Merge yours into it rather than replacing it: `touch-action` and `user-select` on the handle are what make touch drags work at all.

The press is the only thing handled on the element itself. Everything after it is followed on the window, so a drag survives the item being re-rendered into another container halfway through.

## A drag overlay

`getOverlayProps()` positions a copy of the item under the pointer, at `activeRect + delta`, `position: fixed` and `pointer-events: none`. It hides itself while nothing is being dragged and during keyboard drags, where there is no pointer to follow. Render it, and style the real item at `[data-dragging]` as an empty slot:

```tsx
<div {...sortable.getOverlayProps()}>
  {sortable.activeId ? <Card id={sortable.activeId} /> : null}
</div>
```

It is optional. Without it the list still reorders under the pointer, the dragged item just stays in the flow.

## Screen readers

Every drag is narrated: picked up, moved to position N of M, dropped, cancelled. The messages come out of the hook as `announcement`, and you render them into the element `getLiveRegionProps()` describes. Render that element or none of this is heard.

Pass `announcements` to replace any of the four. Anything you leave out keeps the English default.

```ts
interface AnnouncementContext {
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

interface DragAnnouncements {
  start?: (context: AnnouncementContext) => string
  move?: (context: AnnouncementContext) => string
  drop?: (context: AnnouncementContext) => string
  cancel?: (context: AnnouncementContext) => string
}
```

```tsx
useSortable({
  items,
  onReorder,
  announcements: {
    start: ({ id, to, count }) => `${id} levantado, posición ${to.index + 1} de ${count}.`,
    move: ({ id, to, count }) => `${id} en la posición ${to.index + 1} de ${count}.`,
    drop: ({ id, to, count }) => `${id} soltado en la posición ${to.index + 1} de ${count}.`,
    cancel: ({ id }) => `Arrastre de ${id} cancelado.`,
  },
})
```

`defaultAnnouncements` is exported if you want to wrap one instead of replacing it.

## Auto scroll

While a pointer drag is running, the nearest scrollable ancestor scrolls when the pointer gets near one of its edges, ramping up towards the edge. It is on by default; `autoScroll: false` turns it off, or pass settings:

```ts
useSortable({ items, onReorder, autoScroll: { threshold: 0.2, maxSpeed: 20 } })

interface AutoScrollOptions {
  /** How deep the sensitive band is at each edge, as a fraction of the box. Default 0.15. */
  threshold?: number
  /** Pixels scrolled per frame right at the edge. Default 12. */
  maxSpeed?: number
  /** Which way the box may scroll. Default 'both'. */
  axis?: 'x' | 'y' | 'both'
}
```

## Reduced motion

Every hook returns `reducedMotion`, and the overlay and the free-dragged element already set `transition: none` when it is true. Use it for your own animations:

```tsx
<li style={{ transition: sortable.reducedMotion ? 'none' : 'transform 160ms ease' }} />
```

`useReducedMotion()` is exported on its own, and `prefersReducedMotion()` reads it once outside React. Both are safe on the server: the hook starts at `false` and settles after mounting, the function returns `false` where there is no one to ask.

## Server rendering

Nothing reads `window` or `document` while a module loads or while a component renders — every measurement happens in an effect or in an event handler. The package is marked `'use client'` and imports cleanly in the Next.js App Router.

## Without React

`src/core.ts` is the maths, and all of it is exported. No React, no DOM except where it says so, everything pure and testable.

```ts
import { arrayMove, insertionIndex, autoScrollSpeed, dragReducer, idleDragState } from '@uiness/dnd'
```

**Geometry.** `rectFrom(element)` reads a box off the DOM as `{ x, y, width, height }` in viewport pixels. `rectCenter(rect)`, `pointInRect(point, rect)`, `distance(a, b)`, `rectIntersection(a, b)` returns the shared area in square pixels, `lockAxis(delta, axis)` zeroes the movement an axis does not allow, `clampToBounds(rect, bounds)` returns the nearest top left corner that keeps the rect inside.

**Collision.** A `CollisionDetector` takes `{ point, activeRect?, candidates }` and returns an id or `null`. `pointerWithin` picks the smallest box under the pointer, `closestCenter` the nearest center, `closestCorners` compares the four corners and holds up better with boxes of uneven size, `closestContainer` is `pointerWithin` with `closestCenter` as a fallback and is the default for choosing a container.

**Reordering.** `arrayMove(array, from, to)`, `arrayInsert(array, index, item)`, `arrayRemove(array, index)` all return copies. `moveItem(groups, from, to)` does the same across a record of lists and keeps untouched arrays by reference. `clampIndex(index, length)` holds an index inside a list. `insertionIndex(point, rects, axis)` is the hit test: given the boxes of the *other* items, it counts how many come before the point. `gridNeighbor(index, length, columns, direction)` is one arrow key press. `columnsFromRects(rects)` counts how many boxes share the first one's row.

**Auto scroll.** `autoScrollSpeed(point, rect, options)` returns the pixels to scroll this frame. `scrollableAncestors(element)` lists the ancestors that can actually scroll right now, nearest first.

**State machine.** `dragReducer(state, action)` is the whole lifecycle as a pure function, starting from `idleDragState`. Actions are `start`, `move`, `over`, `drop` and `cancel`; anything that changes nothing returns the same object.

```ts
interface DragState {
  phase: 'idle' | 'dragging'
  mode: 'pointer' | 'keyboard' | null
  activeId: string | null
  from: DragLocation | null
  to: DragLocation | null
  origin: Point
  pointer: Point
  delta: Point
}

interface DragLocation {
  containerId: string
  index: number
}

interface Point {
  x: number
  y: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}
```

## Notes

Indices are always zero based, and a target index counts against the list with the dragged item already taken out — so the last valid slot in a list of three is 2. Hit testing measures every box once, when the drag starts, and corrects the pointer by however much has been auto scrolled since, so the boxes shifting around under the drag can never make the target flicker.
