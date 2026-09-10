'use client'

import * as React from 'react'
import {
  type AnnouncementContext,
  type AutoScrollOptions,
  type Axis,
  arrayMove,
  autoScrollSpeed,
  type Collidable,
  type CollisionDetector,
  clampToBounds,
  closestContainer,
  columnsFromRects,
  type Direction,
  type DragAction,
  type DragAnnouncements,
  type DragLocation,
  type DragMode,
  type DragState,
  defaultAnnouncements,
  distance,
  dragReducer,
  gridNeighbor,
  idleDragState,
  insertionIndex,
  lockAxis,
  moveItem,
  type Point,
  type Rect,
  rectFrom,
  scrollableAncestors,
} from './core'

// -- shared props -----------------------------------------------------------------------------

/**
 * Everything that has to sit on the element the user grabs. Only the press is handled here:
 * the rest of the drag is followed on the window, so it survives the element being re-rendered
 * into another container mid drag.
 */
export interface DragHandleProps {
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

/** Registers an item so its box can be measured. Put it on the element that moves. */
export interface DragItemProps {
  ref: (node: HTMLElement | null) => void
  'data-dnd-id': string
  'data-dragging'?: ''
}

/** Registers a container so the pointer can be matched against it. */
export interface DragContainerProps {
  ref: (node: HTMLElement | null) => void
  'data-dnd-container': string
  'data-over'?: ''
}

/** A copy of the item that follows the pointer. Hidden unless a pointer drag is running. */
export interface DragOverlayProps {
  'aria-hidden': true
  style: React.CSSProperties
}

/** The element screen readers read the drag out of. Render it once, anywhere. */
export interface LiveRegionProps {
  role: 'status'
  'aria-live': 'assertive'
  'aria-atomic': true
  style: React.CSSProperties
}

/** Element props for a freely positioned element. */
export interface DragElementProps {
  ref: (node: HTMLElement | null) => void
  'data-dragging'?: ''
  style: React.CSSProperties
}

const hiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  border: 0,
  whiteSpace: 'nowrap',
  clipPath: 'inset(50%)',
}

const liveRegionProps: LiveRegionProps = {
  role: 'status',
  'aria-live': 'assertive',
  'aria-atomic': true,
  style: hiddenStyle,
}

const getLiveRegionProps = (): LiveRegionProps => liveRegionProps

const zero: Point = { x: 0, y: 0 }
const freeLocation: DragLocation = { containerId: '', index: -1 }

const touchActionFor = (axis: Axis) => (axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none')

const arrowDirection = (key: string): Direction | null =>
  key === 'ArrowUp'
    ? 'up'
    : key === 'ArrowDown'
      ? 'down'
      : key === 'ArrowLeft'
        ? 'left'
        : key === 'ArrowRight'
          ? 'right'
          : null

const slotKey = (location: DragLocation) => `${location.containerId}:${location.index}`

interface Pending {
  id: string
  pointerId: number
  origin: Point
  target: HTMLElement
}

function release(pending: Pending | null) {
  if (!pending) return
  const { target, pointerId } = pending
  if (typeof target.releasePointerCapture !== 'function') return
  if (typeof target.hasPointerCapture === 'function' && !target.hasPointerCapture(pointerId)) return
  target.releasePointerCapture(pointerId)
}

interface PointerListeners {
  move: (event: PointerEvent) => void
  up: (event: PointerEvent) => void
  cancel: (event: PointerEvent) => void
}

/** Follow the pointer on the window until the drag ends. Returns the teardown. */
function listen(target: HTMLElement, handlers: PointerListeners): () => void {
  const view = target.ownerDocument.defaultView ?? window
  view.addEventListener('pointermove', handlers.move)
  view.addEventListener('pointerup', handlers.up)
  view.addEventListener('pointercancel', handlers.cancel)
  return () => {
    view.removeEventListener('pointermove', handlers.move)
    view.removeEventListener('pointerup', handlers.up)
    view.removeEventListener('pointercancel', handlers.cancel)
  }
}

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

// -- reduced motion ---------------------------------------------------------------------------

/**
 * Whether the user asked for less motion. Starts `false` so the server and the first client
 * render agree, then settles on the real answer and follows it if the setting changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

// -- announcements ----------------------------------------------------------------------------

type Announce = (kind: keyof DragAnnouncements, context: AnnouncementContext) => void

function useAnnouncer(announcements: DragAnnouncements | undefined): [string, Announce] {
  const custom = React.useRef(announcements)
  custom.current = announcements
  const [message, setMessage] = React.useState('')
  const announce = React.useCallback<Announce>((kind, context) => {
    setMessage((custom.current?.[kind] ?? defaultAnnouncements[kind])(context))
  }, [])
  return [message, announce]
}

// -- one element, no drop targets -------------------------------------------------------------

export interface DragGestureEvent {
  mode: DragMode
  /** Pointer position when the drag started. Zero for a keyboard drag. */
  origin: Point
  /** Latest pointer position. */
  pointer: Point
  /** Movement since the drag started, with the axis lock applied. */
  delta: Point
}

export interface DragGestureOptions {
  /** Which way the element may move. Default `both`. */
  axis?: Axis
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Pixels one arrow key press moves the element. Default 20. */
  keyboardStep?: number
  /** What a screen reader calls the handle. Default `draggable`. */
  roleDescription?: string
  onStart?: (event: DragGestureEvent) => void
  onMove?: (event: DragGestureEvent) => void
  /** The drag was dropped. */
  onEnd?: (event: DragGestureEvent) => void
  /** Escape was pressed, focus was lost or the pointer was taken away. */
  onCancel?: (event: DragGestureEvent) => void
}

export interface DragGestureResult {
  isDragging: boolean
  mode: DragMode | null
  /** Movement since the drag started, with the axis lock applied. */
  delta: Point
  /** Stop the drag and report a cancel. */
  cancel: () => void
  getHandleProps: () => DragHandleProps
}

/**
 * Pointer and keyboard handling for a single element, with no notion of lists or drop targets.
 * It reports deltas and leaves it to you to do something with them. `useDraggable` and the
 * sortable hooks are built on it; reach for it when none of them fit.
 */
export function useDragGesture(options: DragGestureOptions = {}): DragGestureResult {
  const [state, dispatch] = React.useReducer(dragReducer, idleDragState)
  const stateRef = React.useRef(state)
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const pending = React.useRef<Pending | null>(null)
  const unlisten = React.useRef<(() => void) | null>(null)

  const send = React.useCallback((action: DragAction) => {
    stateRef.current = dragReducer(stateRef.current, action)
    dispatch(action)
  }, [])

  const stopListening = React.useCallback(() => {
    unlisten.current?.()
    unlisten.current = null
  }, [])

  React.useEffect(() => () => unlisten.current?.(), [])

  const emit = React.useCallback((kind: 'onStart' | 'onMove' | 'onEnd' | 'onCancel') => {
    const current = stateRef.current
    const mode = current.mode
    if (!mode) return
    optionsRef.current[kind]?.({
      mode,
      origin: current.origin,
      pointer: current.pointer,
      delta: lockAxis(current.delta, optionsRef.current.axis ?? 'both'),
    })
  }, [])

  const cancel = React.useCallback(() => {
    stopListening()
    if (stateRef.current.phase !== 'dragging') {
      pending.current = null
      return
    }
    emit('onCancel')
    const held = pending.current
    pending.current = null
    release(held)
    send({ type: 'cancel' })
  }, [emit, send, stopListening])

  const finish = React.useCallback(() => {
    stopListening()
    if (stateRef.current.phase !== 'dragging') {
      pending.current = null
      return
    }
    emit('onEnd')
    const held = pending.current
    pending.current = null
    release(held)
    send({ type: 'drop' })
  }, [emit, send, stopListening])

  const handleMove = React.useCallback(
    (event: PointerEvent) => {
      const held = pending.current
      if (!held || held.pointerId !== event.pointerId) return
      const point = { x: event.clientX, y: event.clientY }
      if (stateRef.current.phase === 'idle') {
        if (distance(point, held.origin) < (optionsRef.current.activationDistance ?? 4)) return
        send({
          type: 'start',
          id: held.id,
          from: freeLocation,
          mode: 'pointer',
          point: held.origin,
        })
        emit('onStart')
      }
      send({ type: 'move', point })
      emit('onMove')
    },
    [emit, send],
  )

  const handleUp = React.useCallback(
    (event: PointerEvent) => {
      if (pending.current?.pointerId !== event.pointerId) return
      finish()
    },
    [finish],
  )

  const handleCancel = React.useCallback(
    (event: PointerEvent) => {
      if (pending.current?.pointerId !== event.pointerId) return
      cancel()
    },
    [cancel],
  )

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (optionsRef.current.disabled || event.button !== 0) return
      if (stateRef.current.phase !== 'idle') return
      const target = event.currentTarget
      // Capture keeps touch and pen gestures coming to us instead of turning into a scroll.
      if (typeof target.setPointerCapture === 'function') target.setPointerCapture(event.pointerId)
      pending.current = {
        id: 'item',
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        target,
      }
      stopListening()
      unlisten.current = listen(target, { move: handleMove, up: handleUp, cancel: handleCancel })
    },
    [handleCancel, handleMove, handleUp, stopListening],
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (optionsRef.current.disabled) return
      const current = stateRef.current
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (current.phase === 'idle') {
          send({ type: 'start', id: 'item', from: freeLocation, mode: 'keyboard', point: zero })
          emit('onStart')
        } else {
          finish()
        }
        return
      }
      if (current.phase !== 'dragging') return
      const direction = arrowDirection(event.key)
      if (!direction) return
      event.preventDefault()
      const step = optionsRef.current.keyboardStep ?? 20
      const { pointer } = current
      const point = {
        x: pointer.x + (direction === 'left' ? -step : direction === 'right' ? step : 0),
        y: pointer.y + (direction === 'up' ? -step : direction === 'down' ? step : 0),
      }
      send({ type: 'move', point })
      emit('onMove')
    },
    [emit, finish, send],
  )

  const onBlur = React.useCallback(() => {
    if (stateRef.current.phase === 'dragging' && stateRef.current.mode === 'keyboard') cancel()
  }, [cancel])

  // Escape works from anywhere, not just from the element that happens to have focus.
  React.useEffect(() => {
    if (state.phase !== 'dragging') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      cancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, cancel])

  const axis = options.axis ?? 'both'
  const dragging = state.phase === 'dragging'
  const getHandleProps = (): DragHandleProps => ({
    role: 'button',
    tabIndex: options.disabled ? -1 : 0,
    'aria-roledescription': options.roleDescription ?? 'draggable',
    'aria-pressed': dragging,
    ...(options.disabled ? { 'aria-disabled': true as const } : null),
    ...(dragging ? { 'data-dragging': '' as const } : null),
    style: { touchAction: touchActionFor(axis), userSelect: 'none', WebkitUserSelect: 'none' },
    onPointerDown,
    onKeyDown,
    onBlur,
  })

  return {
    isDragging: dragging,
    mode: state.mode,
    delta: lockAxis(state.delta, axis),
    cancel,
    getHandleProps,
  }
}

// -- one element, free position ---------------------------------------------------------------

export interface DraggableOptions extends DragGestureOptions {
  /** Name read out in the announcements. Default `item`. */
  id?: string
  /** Controlled offset. Leave it out to let the hook own the position. */
  position?: Point
  /** Offset to start from when the hook owns the position. Default `{ x: 0, y: 0 }`. */
  defaultPosition?: Point
  /** Every change, including the ones during a drag. */
  onPositionChange?: (position: Point) => void
  /** Once, when the drag is dropped. */
  onDragEnd?: (position: Point) => void
  /** Keep the element inside a box: a rect in viewport pixels, or its offset parent. */
  bounds?: Rect | 'parent' | null
  announcements?: DragAnnouncements
}

export interface DraggableResult {
  /** Offset from where the element sits in the layout, in pixels. */
  position: Point
  isDragging: boolean
  mode: DragMode | null
  delta: Point
  reducedMotion: boolean
  /** Latest message for the live region. */
  announcement: string
  /** Move the element without a drag. */
  setPosition: (position: Point) => void
  cancel: () => void
  getElementProps: () => DragElementProps
  getHandleProps: () => DragHandleProps
  getLiveRegionProps: () => LiveRegionProps
}

/**
 * Move one element anywhere: dialogs, floating panels, a map pin. The position is an offset
 * from wherever the element already sits, so it composes with whatever CSS put it there.
 */
export function useDraggable(options: DraggableOptions = {}): DraggableResult {
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const node = React.useRef<HTMLElement | null>(null)
  const [uncontrolled, setUncontrolled] = React.useState<Point>(options.defaultPosition ?? zero)
  const position = options.position ?? uncontrolled
  const positionRef = React.useRef(position)
  positionRef.current = position
  const origin = React.useRef<{ base: Point; rect: Rect; bounds: Rect | null } | null>(null)
  const [announcement, announce] = useAnnouncer(options.announcements)
  const reducedMotion = useReducedMotion()

  const setPosition = React.useCallback((next: Point) => {
    positionRef.current = next
    if (optionsRef.current.position === undefined) setUncontrolled(next)
    optionsRef.current.onPositionChange?.(next)
  }, [])

  const context = React.useCallback(
    (delta: Point): AnnouncementContext => ({
      id: optionsRef.current.id ?? 'item',
      from: freeLocation,
      to: freeLocation,
      count: 0,
      delta,
    }),
    [],
  )

  const apply = React.useCallback(
    (delta: Point) => {
      const start = origin.current
      if (!start) return
      const moved = { ...start.rect, x: start.rect.x + delta.x, y: start.rect.y + delta.y }
      const placed = start.bounds ? clampToBounds(moved, start.bounds) : moved
      setPosition({
        x: start.base.x + placed.x - start.rect.x,
        y: start.base.y + placed.y - start.rect.y,
      })
    },
    [setPosition],
  )

  const gesture = useDragGesture({
    axis: options.axis,
    disabled: options.disabled,
    activationDistance: options.activationDistance,
    keyboardStep: options.keyboardStep,
    roleDescription: options.roleDescription,
    onStart: (event) => {
      const element = node.current
      const bounds = element ? resolveBounds(element, optionsRef.current.bounds) : null
      origin.current = element
        ? { base: positionRef.current, rect: rectFrom(element), bounds }
        : null
      announce('start', context(event.delta))
      optionsRef.current.onStart?.(event)
    },
    onMove: (event) => {
      apply(event.delta)
      announce('move', context(event.delta))
      optionsRef.current.onMove?.(event)
    },
    onEnd: (event) => {
      announce('drop', context(event.delta))
      origin.current = null
      optionsRef.current.onDragEnd?.(positionRef.current)
      optionsRef.current.onEnd?.(event)
    },
    onCancel: (event) => {
      const base = origin.current?.base
      if (base) setPosition(base)
      announce('cancel', context(zero))
      origin.current = null
      optionsRef.current.onCancel?.(event)
    },
  })

  const setNode = React.useCallback((element: HTMLElement | null) => {
    node.current = element
  }, [])

  const getElementProps = (): DragElementProps => ({
    ref: setNode,
    ...(gesture.isDragging ? { 'data-dragging': '' as const } : null),
    style: {
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      // No easing while the element is under the pointer, and none at all if motion is a problem.
      transition: gesture.isDragging || reducedMotion ? 'none' : undefined,
    },
  })

  return {
    position,
    isDragging: gesture.isDragging,
    mode: gesture.mode,
    delta: gesture.delta,
    reducedMotion,
    announcement,
    setPosition,
    cancel: gesture.cancel,
    getElementProps,
    getHandleProps: gesture.getHandleProps,
    getLiveRegionProps,
  }
}

function resolveBounds(element: HTMLElement, bounds: Rect | 'parent' | null | undefined) {
  if (!bounds) return null
  if (bounds !== 'parent') return bounds
  const parent = element.offsetParent ?? element.parentElement
  return parent ? rectFrom(parent) : null
}

// -- lists ------------------------------------------------------------------------------------

interface Snapshot {
  /** The order as it was when the drag started, which is what indices are counted against. */
  groups: Record<string, string[]>
  rects: Map<string, Rect>
  containers: Collidable[]
  columns: Map<string, number>
}

interface CollectionOptions {
  groups: Record<string, string[]>
  groupOrder: string[]
  axis: Axis
  columns: number | undefined
  disabled: boolean
  activationDistance: number
  collisionDetection: CollisionDetector
  autoScroll: AutoScrollOptions | null
  announcements: DragAnnouncements | undefined
  roleDescription: string
  crossGroup: boolean
  onCommit: (id: string, from: DragLocation, to: DragLocation) => void
  onDragStart: ((id: string, at: DragLocation) => void) | undefined
  onDragCancel: ((id: string, at: DragLocation) => void) | undefined
}

interface Bound {
  ref: (node: HTMLElement | null) => void
  onPointerDown: React.PointerEventHandler<HTMLElement>
  onKeyDown: React.KeyboardEventHandler<HTMLElement>
}

interface Collection {
  state: DragState
  /** The order to render: the in-flight one while a drag is running. */
  groups: Record<string, string[]>
  activeRect: Rect | null
  announcement: string
  reducedMotion: boolean
  cancel: () => void
  getContainerProps: (containerId: string) => DragContainerProps
  getItemProps: (id: string) => DragItemProps
  getHandleProps: (id: string) => DragHandleProps
  getOverlayProps: () => DragOverlayProps
}

function viewportRect(element: HTMLElement): Rect {
  const view = element.ownerDocument.defaultView
  if (view && element === element.ownerDocument.scrollingElement) {
    return { x: 0, y: 0, width: view.innerWidth, height: view.innerHeight }
  }
  return rectFrom(element)
}

/** The engine behind `useSortable` and `useSortableGroups`. One container is just a special case. */
function useDragCollection(options: CollectionOptions): Collection {
  const [state, dispatch] = React.useReducer(dragReducer, idleDragState)
  const stateRef = React.useRef(state)
  const optionsRef = React.useRef(options)
  optionsRef.current = options

  const nodes = React.useRef(new Map<string, HTMLElement>())
  const containers = React.useRef(new Map<string, HTMLElement>())
  const bounds = React.useRef(new Map<string, Bound>())
  const containerRefs = React.useRef(new Map<string, (node: HTMLElement | null) => void>())
  const snapshot = React.useRef<Snapshot | null>(null)
  const scrollShift = React.useRef<Point>(zero)
  const pending = React.useRef<Pending | null>(null)
  const unlisten = React.useRef<(() => void) | null>(null)
  const announced = React.useRef('')

  const [announcement, announce] = useAnnouncer(options.announcements)
  const reducedMotion = useReducedMotion()

  const send = React.useCallback((action: DragAction) => {
    stateRef.current = dragReducer(stateRef.current, action)
    dispatch(action)
  }, [])

  const stopListening = React.useCallback(() => {
    unlisten.current?.()
    unlisten.current = null
  }, [])

  React.useEffect(() => () => unlisten.current?.(), [])

  /** The order as it stands mid drag, derived from the snapshot so indices stay comparable. */
  const previewOf = React.useCallback((current: DragState): Record<string, string[]> => {
    const base = snapshot.current?.groups
    if (current.phase !== 'dragging' || !current.from || !current.to || !base) {
      return optionsRef.current.groups
    }
    return moveItem(base, current.from, current.to)
  }, [])

  const measure = React.useCallback((): Snapshot => {
    const current = optionsRef.current
    const rects = new Map<string, Rect>()
    const columns = new Map<string, number>()
    const groups: Record<string, string[]> = {}
    for (const [containerId, ids] of Object.entries(current.groups)) {
      groups[containerId] = ids.slice()
      const list: Rect[] = []
      for (const id of ids) {
        const node = nodes.current.get(id)
        if (!node) continue
        const rect = rectFrom(node)
        rects.set(id, rect)
        list.push(rect)
      }
      columns.set(containerId, current.columns ?? columnsFromRects(list))
    }
    const boxes: Collidable[] = []
    for (const [containerId, node] of containers.current) {
      boxes.push({ id: containerId, rect: rectFrom(node) })
    }
    return { groups, rects, containers: boxes, columns }
  }, [])

  const begin = React.useCallback(
    (id: string, mode: DragMode, point: Point): boolean => {
      let at: DragLocation | null = null
      for (const [containerId, ids] of Object.entries(optionsRef.current.groups)) {
        const index = ids.indexOf(id)
        if (index !== -1) {
          at = { containerId, index }
          break
        }
      }
      if (!at) return false
      const snap = measure()
      snapshot.current = snap
      scrollShift.current = zero
      announced.current = slotKey(at)
      send({ type: 'start', id, from: at, mode, point })
      announce('start', {
        id,
        from: at,
        to: at,
        count: snap.groups[at.containerId]?.length ?? 0,
        delta: zero,
      })
      optionsRef.current.onDragStart?.(id, at)
      return true
    },
    [announce, measure, send],
  )

  /** Work out which slot the pointer is over and dispatch it. */
  const updateOver = React.useCallback(
    (point: Point) => {
      const current = stateRef.current
      const snap = snapshot.current
      if (current.phase !== 'dragging' || !current.activeId || !current.from || !snap) return
      const { axis, crossGroup, collisionDetection } = optionsRef.current
      // Rects were measured once, at the start. Auto scroll moves the page under them, so the
      // pointer is corrected by however much has been scrolled since instead of re-measuring.
      const shift = scrollShift.current
      const at = { x: point.x + shift.x, y: point.y + shift.y }
      const rect = snap.rects.get(current.activeId) ?? null
      let containerId = current.from.containerId
      if (crossGroup) {
        const dragged = rect
          ? {
              ...rect,
              x: rect.x + (at.x - current.origin.x),
              y: rect.y + (at.y - current.origin.y),
            }
          : null
        const hit = collisionDetection({
          point: at,
          activeRect: dragged,
          candidates: snap.containers,
        })
        containerId = hit ?? current.to?.containerId ?? current.from.containerId
      }
      const others = (snap.groups[containerId] ?? []).filter((id) => id !== current.activeId)
      const rects = others
        .map((id) => snap.rects.get(id))
        .filter((box): box is Rect => box !== undefined)
      send({ type: 'over', to: { containerId, index: insertionIndex(at, rects, axis) } })
    },
    [send],
  )

  const commit = React.useCallback(() => {
    const current = stateRef.current
    const held = pending.current
    pending.current = null
    stopListening()
    release(held)
    if (current.phase !== 'dragging' || !current.activeId || !current.from || !current.to) {
      send({ type: 'cancel' })
      return
    }
    const preview = previewOf(current)
    announce('drop', {
      id: current.activeId,
      from: current.from,
      to: current.to,
      count: preview[current.to.containerId]?.length ?? 0,
      delta: current.delta,
    })
    const changed =
      current.to.containerId !== current.from.containerId || current.to.index !== current.from.index
    send({ type: 'drop' })
    snapshot.current = null
    if (changed) optionsRef.current.onCommit(current.activeId, current.from, current.to)
  }, [announce, previewOf, send, stopListening])

  const cancel = React.useCallback(() => {
    const current = stateRef.current
    const held = pending.current
    pending.current = null
    stopListening()
    release(held)
    if (current.phase !== 'dragging' || !current.activeId || !current.from) {
      send({ type: 'cancel' })
      return
    }
    const base = snapshot.current?.groups ?? optionsRef.current.groups
    announce('cancel', {
      id: current.activeId,
      from: current.from,
      to: current.from,
      count: base[current.from.containerId]?.length ?? 0,
      delta: current.delta,
    })
    optionsRef.current.onDragCancel?.(current.activeId, current.from)
    send({ type: 'cancel' })
    snapshot.current = null
  }, [announce, send, stopListening])

  /** One arrow key press. */
  const step = React.useCallback(
    (direction: Direction) => {
      const current = stateRef.current
      const snap = snapshot.current
      if (current.phase !== 'dragging' || !current.to || !snap) return
      const { axis, crossGroup, groupOrder } = optionsRef.current
      const preview = previewOf(current)
      const alongAxis =
        axis === 'both' ||
        (axis === 'y'
          ? direction === 'up' || direction === 'down'
          : direction === 'left' || direction === 'right')
      if (alongAxis) {
        const list = preview[current.to.containerId] ?? []
        const columns =
          axis === 'both'
            ? (snap.columns.get(current.to.containerId) ?? 1)
            : axis === 'x'
              ? list.length
              : 1
        const index = gridNeighbor(current.to.index, list.length, columns, direction)
        send({ type: 'over', to: { containerId: current.to.containerId, index } })
        return
      }
      if (!crossGroup) return
      const position = groupOrder.indexOf(current.to.containerId)
      const next = groupOrder[position + (direction === 'left' || direction === 'up' ? -1 : 1)]
      if (next === undefined) return
      // The item is not in that list yet, so it can also land right after the last one.
      const target = preview[next] ?? []
      const index = Math.min(Math.max(current.to.index, 0), target.length)
      send({ type: 'over', to: { containerId: next, index } })
    },
    [previewOf, send],
  )

  const handleMove = React.useCallback(
    (event: PointerEvent) => {
      const held = pending.current
      if (!held || held.pointerId !== event.pointerId) return
      const point = { x: event.clientX, y: event.clientY }
      if (stateRef.current.phase === 'idle') {
        if (distance(point, held.origin) < optionsRef.current.activationDistance) return
        if (!begin(held.id, 'pointer', held.origin)) {
          pending.current = null
          stopListening()
          return
        }
      }
      send({ type: 'move', point })
      updateOver(point)
    },
    [begin, send, stopListening, updateOver],
  )

  const handleUp = React.useCallback(
    (event: PointerEvent) => {
      if (pending.current?.pointerId !== event.pointerId) return
      commit()
    },
    [commit],
  )

  const handleCancel = React.useCallback(
    (event: PointerEvent) => {
      if (pending.current?.pointerId !== event.pointerId) return
      cancel()
    },
    [cancel],
  )

  /**
   * A keyboard drag across containers re-renders the item into another parent, which drops the
   * focus. The refocus below puts it back, so the cancel waits a tick to see if it did.
   */
  const onBlur = React.useCallback(() => {
    const current = stateRef.current
    if (current.phase !== 'dragging' || current.mode !== 'keyboard') return
    const id = current.activeId
    queueMicrotask(() => {
      const now = stateRef.current
      if (now.phase !== 'dragging' || now.mode !== 'keyboard' || now.activeId !== id) return
      const node = id ? nodes.current.get(id) : null
      if (node?.ownerDocument.activeElement === node) return
      cancel()
    })
  }, [cancel])

  const boundFor = React.useCallback(
    (id: string): Bound => {
      const cached = bounds.current.get(id)
      if (cached) return cached
      const bound: Bound = {
        ref: (node) => {
          if (node) nodes.current.set(id, node)
          else nodes.current.delete(id)
        },
        onPointerDown: (event) => {
          if (optionsRef.current.disabled || event.button !== 0) return
          if (stateRef.current.phase !== 'idle') return
          const target = event.currentTarget
          // Capture keeps touch and pen gestures coming to us instead of turning into a scroll.
          if (typeof target.setPointerCapture === 'function') {
            target.setPointerCapture(event.pointerId)
          }
          pending.current = {
            id,
            pointerId: event.pointerId,
            origin: { x: event.clientX, y: event.clientY },
            target,
          }
          stopListening()
          unlisten.current = listen(target, {
            move: handleMove,
            up: handleUp,
            cancel: handleCancel,
          })
        },
        onKeyDown: (event) => {
          if (optionsRef.current.disabled) return
          const current = stateRef.current
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            if (current.phase === 'idle') begin(id, 'keyboard', zero)
            else if (current.activeId === id) commit()
            return
          }
          if (current.phase !== 'dragging' || current.activeId !== id) return
          const direction = arrowDirection(event.key)
          if (!direction) return
          event.preventDefault()
          step(direction)
        },
      }
      bounds.current.set(id, bound)
      return bound
    },
    [begin, commit, handleCancel, handleMove, handleUp, step, stopListening],
  )

  const containerRefFor = React.useCallback((containerId: string) => {
    const cached = containerRefs.current.get(containerId)
    if (cached) return cached
    const ref = (node: HTMLElement | null) => {
      if (node) containers.current.set(containerId, node)
      else containers.current.delete(containerId)
    }
    containerRefs.current.set(containerId, ref)
    return ref
  }, [])

  const preview = React.useMemo(() => previewOf(state), [state, previewOf])

  // Moving an item to another container re-renders it into a different parent, which loses the
  // focus a keyboard drag depends on. Put it back before the browser notices.
  useIsoLayoutEffect(() => {
    if (state.phase !== 'dragging' || state.mode !== 'keyboard' || !state.activeId) return
    const node = nodes.current.get(state.activeId)
    if (node && node.ownerDocument.activeElement !== node) node.focus()
  })

  // Every change of slot gets read out, however it was made.
  React.useEffect(() => {
    const { phase, to, from, activeId, delta } = state
    if (phase !== 'dragging' || !to || !from || !activeId) return
    if (slotKey(to) === announced.current) return
    announced.current = slotKey(to)
    announce('move', {
      id: activeId,
      from,
      to,
      count: preview[to.containerId]?.length ?? 0,
      delta,
    })
  }, [state, preview, announce])

  React.useEffect(() => {
    if (state.phase !== 'dragging') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      cancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, cancel])

  // Scroll the nearest scrollable ancestor while the pointer sits near one of its edges.
  React.useEffect(() => {
    const settings = optionsRef.current.autoScroll
    if (!settings || state.phase !== 'dragging' || state.mode !== 'pointer' || !state.activeId) {
      return
    }
    const node = nodes.current.get(state.activeId)
    if (!node) return
    const scrollers = scrollableAncestors(node)
    if (scrollers.length === 0) return
    let frame = requestAnimationFrame(function tick() {
      frame = requestAnimationFrame(tick)
      const point = stateRef.current.pointer
      for (const element of scrollers) {
        const speed = autoScrollSpeed(point, viewportRect(element), settings)
        if (speed.x === 0 && speed.y === 0) continue
        const top = element.scrollTop
        const left = element.scrollLeft
        element.scrollTop = top + speed.y
        element.scrollLeft = left + speed.x
        const moved = { x: element.scrollLeft - left, y: element.scrollTop - top }
        if (moved.x === 0 && moved.y === 0) continue
        const shift = scrollShift.current
        scrollShift.current = { x: shift.x + moved.x, y: shift.y + moved.y }
        updateOver(point)
        break
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [state.phase, state.mode, state.activeId, updateOver])

  const dragging = state.phase === 'dragging'
  const activeRect = state.activeId ? (snapshot.current?.rects.get(state.activeId) ?? null) : null
  const touchAction = touchActionFor(options.axis)

  const getHandleProps = (id: string): DragHandleProps => {
    const bound = boundFor(id)
    const active = dragging && state.activeId === id
    return {
      role: 'button',
      tabIndex: options.disabled ? -1 : 0,
      'aria-roledescription': options.roleDescription,
      'aria-pressed': active,
      ...(options.disabled ? { 'aria-disabled': true as const } : null),
      ...(active ? { 'data-dragging': '' as const } : null),
      style: { touchAction, userSelect: 'none', WebkitUserSelect: 'none' },
      onPointerDown: bound.onPointerDown,
      onKeyDown: bound.onKeyDown,
      onBlur,
    }
  }

  const getItemProps = (id: string): DragItemProps => ({
    ref: boundFor(id).ref,
    'data-dnd-id': id,
    ...(dragging && state.activeId === id ? { 'data-dragging': '' as const } : null),
  })

  const getContainerProps = (containerId: string): DragContainerProps => ({
    ref: containerRefFor(containerId),
    'data-dnd-container': containerId,
    ...(dragging && state.to?.containerId === containerId ? { 'data-over': '' as const } : null),
  })

  const getOverlayProps = (): DragOverlayProps => {
    const visible = dragging && state.mode === 'pointer' && activeRect !== null
    return {
      'aria-hidden': true,
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: activeRect?.width,
        height: activeRect?.height,
        pointerEvents: 'none',
        touchAction: 'none',
        zIndex: 1000,
        transition: reducedMotion ? 'none' : undefined,
        display: visible ? undefined : 'none',
        transform: activeRect
          ? `translate3d(${activeRect.x + state.delta.x}px, ${activeRect.y + state.delta.y}px, 0)`
          : undefined,
      },
    }
  }

  return {
    state,
    groups: preview,
    activeRect,
    announcement,
    reducedMotion,
    cancel,
    getContainerProps,
    getItemProps,
    getHandleProps,
    getOverlayProps,
  }
}

const LIST = 'list'
const LIST_ORDER = [LIST]

const resolveAutoScroll = (
  value: boolean | AutoScrollOptions | undefined,
): AutoScrollOptions | null => (value === false ? null : value === true || !value ? {} : value)

export interface SortableChange {
  id: string
  from: number
  to: number
}

export interface SortableOptions {
  /** Item ids, in their current order. Ids have to be unique and stable. */
  items: string[]
  /** Called once, when a drag is dropped somewhere other than where it started. */
  onReorder: (items: string[], change: SortableChange) => void
  /** `y` for a vertical list (default), `x` for a horizontal one, `both` for a grid. */
  axis?: Axis
  /** Columns per row on a `both` axis. Measured from the layout when left out. */
  columns?: number
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Scroll the nearest scrollable ancestor near its edges. Default true. */
  autoScroll?: boolean | AutoScrollOptions
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls an item. Default `sortable item`. */
  roleDescription?: string
  onDragStart?: (id: string, index: number) => void
  onDragCancel?: (id: string, index: number) => void
}

export interface SortableResult {
  /** The order to render: the in-flight one while a drag is running, the prop otherwise. */
  items: string[]
  activeId: string | null
  /** Index the drag started from, or -1. */
  activeIndex: number
  /** Index it would land on if dropped now, or -1. */
  overIndex: number
  isDragging: boolean
  mode: DragMode | null
  /** Pointer movement since the drag started. Zero for a keyboard drag. */
  delta: Point
  /** Box of the dragged item as it was when the drag started, or null. */
  activeRect: Rect | null
  reducedMotion: boolean
  /** Latest message for the live region. */
  announcement: string
  cancel: () => void
  getListProps: () => DragContainerProps
  getItemProps: (id: string) => DragItemProps
  getHandleProps: (id: string) => DragHandleProps
  getOverlayProps: () => DragOverlayProps
  getLiveRegionProps: () => LiveRegionProps
}

/**
 * Reorder one list, along an axis or across a grid. `items` is the order you pass in; render
 * `result.items` instead, which is the same list with the in-flight move already applied.
 */
export function useSortable(options: SortableOptions): SortableResult {
  const { items, onReorder } = options
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const callbacks = React.useRef(options)
  callbacks.current = options

  const onReorderRef = React.useRef(onReorder)
  onReorderRef.current = onReorder

  const groups = React.useMemo(() => ({ [LIST]: items }), [items])

  const onCommit = React.useCallback((id: string, from: DragLocation, to: DragLocation) => {
    onReorderRef.current(arrayMove(itemsRef.current, from.index, to.index), {
      id,
      from: from.index,
      to: to.index,
    })
  }, [])

  const onDragStart = React.useCallback((id: string, at: DragLocation) => {
    callbacks.current.onDragStart?.(id, at.index)
  }, [])
  const onDragCancel = React.useCallback((id: string, at: DragLocation) => {
    callbacks.current.onDragCancel?.(id, at.index)
  }, [])

  const collection = useDragCollection({
    groups,
    groupOrder: LIST_ORDER,
    axis: options.axis ?? 'y',
    columns: options.columns,
    disabled: options.disabled ?? false,
    activationDistance: options.activationDistance ?? 4,
    collisionDetection: closestContainer,
    autoScroll: resolveAutoScroll(options.autoScroll),
    announcements: options.announcements,
    roleDescription: options.roleDescription ?? 'sortable item',
    crossGroup: false,
    onCommit,
    onDragStart: options.onDragStart ? onDragStart : undefined,
    onDragCancel: options.onDragCancel ? onDragCancel : undefined,
  })

  const { state } = collection
  return {
    items: collection.groups[LIST] ?? items,
    activeId: state.activeId,
    activeIndex: state.from?.index ?? -1,
    overIndex: state.to?.index ?? -1,
    isDragging: state.phase === 'dragging',
    mode: state.mode,
    delta: state.delta,
    activeRect: collection.activeRect,
    reducedMotion: collection.reducedMotion,
    announcement: collection.announcement,
    cancel: collection.cancel,
    getListProps: () => collection.getContainerProps(LIST),
    getItemProps: collection.getItemProps,
    getHandleProps: collection.getHandleProps,
    getOverlayProps: collection.getOverlayProps,
    getLiveRegionProps,
  }
}

export interface GroupsChange {
  id: string
  from: DragLocation
  to: DragLocation
}

export interface SortableGroupsOptions {
  /** Container id to the ids it holds, in order. Empty containers are valid drop targets. */
  groups: Record<string, string[]>
  /** Called once, when a drag is dropped somewhere other than where it started. */
  onChange: (groups: Record<string, string[]>, change: GroupsChange) => void
  /** Container order for keyboard moves across containers. Default `Object.keys(groups)`. */
  order?: string[]
  /** Axis inside a container. `y` (default) puts the containers side by side. */
  axis?: Axis
  /** Columns per row on a `both` axis. Measured from the layout when left out. */
  columns?: number
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Which container the pointer is over. Default `closestContainer`. */
  collisionDetection?: CollisionDetector
  /** Scroll the nearest scrollable ancestor near its edges. Default true. */
  autoScroll?: boolean | AutoScrollOptions
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls an item. Default `sortable item`. */
  roleDescription?: string
  onDragStart?: (id: string, at: DragLocation) => void
  onDragCancel?: (id: string, at: DragLocation) => void
}

export interface SortableGroupsResult {
  /** The containers to render: the in-flight state while a drag is running. */
  groups: Record<string, string[]>
  activeId: string | null
  /** Slot the drag started in, or null. */
  from: DragLocation | null
  /** Slot it would land in if dropped now, or null. */
  over: DragLocation | null
  isDragging: boolean
  mode: DragMode | null
  /** Pointer movement since the drag started. Zero for a keyboard drag. */
  delta: Point
  /** Box of the dragged item as it was when the drag started, or null. */
  activeRect: Rect | null
  reducedMotion: boolean
  /** Latest message for the live region. */
  announcement: string
  cancel: () => void
  getGroupProps: (groupId: string) => DragContainerProps
  getItemProps: (id: string) => DragItemProps
  getHandleProps: (id: string) => DragHandleProps
  getOverlayProps: () => DragOverlayProps
  getLiveRegionProps: () => LiveRegionProps
}

/**
 * Move items inside and between several containers: a board, a pair of transfer lists, a
 * playlist split by section. Same shape as `useSortable`, keyed by container.
 */
export function useSortableGroups(options: SortableGroupsOptions): SortableGroupsResult {
  const { groups, onChange, order } = options
  const groupsRef = React.useRef(groups)
  groupsRef.current = groups
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const callbacks = React.useRef(options)
  callbacks.current = options

  const keys = Object.keys(groups).join(',')
  // biome-ignore lint/correctness/useExhaustiveDependencies: the joined keys stand in for the object.
  const groupOrder = React.useMemo(() => order ?? Object.keys(groupsRef.current), [order, keys])

  const onCommit = React.useCallback((id: string, from: DragLocation, to: DragLocation) => {
    onChangeRef.current(moveItem(groupsRef.current, from, to), { id, from, to })
  }, [])
  const onDragStart = React.useCallback((id: string, at: DragLocation) => {
    callbacks.current.onDragStart?.(id, at)
  }, [])
  const onDragCancel = React.useCallback((id: string, at: DragLocation) => {
    callbacks.current.onDragCancel?.(id, at)
  }, [])

  const collection = useDragCollection({
    groups,
    groupOrder,
    axis: options.axis ?? 'y',
    columns: options.columns,
    disabled: options.disabled ?? false,
    activationDistance: options.activationDistance ?? 4,
    collisionDetection: options.collisionDetection ?? closestContainer,
    autoScroll: resolveAutoScroll(options.autoScroll),
    announcements: options.announcements,
    roleDescription: options.roleDescription ?? 'sortable item',
    crossGroup: true,
    onCommit,
    onDragStart: options.onDragStart ? onDragStart : undefined,
    onDragCancel: options.onDragCancel ? onDragCancel : undefined,
  })

  const { state } = collection
  return {
    groups: collection.groups,
    activeId: state.activeId,
    from: state.from,
    over: state.to,
    isDragging: state.phase === 'dragging',
    mode: state.mode,
    delta: state.delta,
    activeRect: collection.activeRect,
    reducedMotion: collection.reducedMotion,
    announcement: collection.announcement,
    cancel: collection.cancel,
    getGroupProps: collection.getContainerProps,
    getItemProps: collection.getItemProps,
    getHandleProps: collection.getHandleProps,
    getOverlayProps: collection.getOverlayProps,
    getLiveRegionProps,
  }
}
