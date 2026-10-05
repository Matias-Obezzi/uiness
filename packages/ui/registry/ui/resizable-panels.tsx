'use client'

import { GripVerticalIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ResizableDirection = 'horizontal' | 'vertical'

interface PanelConfig {
  id: string
  defaultSize?: number
  minSize: number
  maxSize: number
  collapsible: boolean
  collapsedSize: number
}

interface GroupContextValue {
  direction: ResizableDirection
  sizes: number[]
  configs: PanelConfig[]
  dragging: number | null
  keyboardStep: number
  startDrag: (handle: number, event: React.PointerEvent<HTMLElement>) => void
  resizeBy: (handle: number, delta: number) => void
  resizeTo: (handle: number, size: number) => void
  toggleCollapse: (handle: number) => void
  reset: (handle: number) => void
}

const GroupContext = React.createContext<GroupContextValue | null>(null)
const PanelIndexContext = React.createContext(-1)
const HandleIndexContext = React.createContext(-1)

function useGroup(component: string) {
  const context = React.useContext(GroupContext)
  if (!context) throw new Error(`${component} must be used within <ResizablePanelGroup>`)
  return context
}

const STORAGE_PREFIX = 'uiness-resizable:'
const round = (n: number) => Math.round(n * 1000) / 1000
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Sizes from the panels' `defaultSize`, sharing what is left between the ones without. */
function defaultLayout(configs: PanelConfig[]) {
  const given = configs.reduce((sum, c) => sum + (c.defaultSize ?? 0), 0)
  const open = configs.filter((c) => c.defaultSize === undefined).length
  const share = open > 0 ? Math.max(0, 100 - given) / open : 0
  const sizes = configs.map((c) => c.defaultSize ?? share)
  const total = sizes.reduce((sum, s) => sum + s, 0) || 1
  return sizes.map((s) => round((s / total) * 100))
}

/** A size the panel accepts. Below its minimum a collapsible panel snaps shut or back open. */
function sizeFor(size: number, c: PanelConfig) {
  if (c.collapsible && size < c.minSize) {
    return size < (c.minSize + c.collapsedSize) / 2 ? c.collapsedSize : c.minSize
  }
  return clamp(size, c.minSize, c.maxSize)
}

/** Moves the border between panel `i` and the next by `delta` percent, within their limits. */
function resizePair(sizes: number[], i: number, delta: number, configs: PanelConfig[]) {
  const a = sizes[i]
  const b = sizes[i + 1]
  const ca = configs[i]
  const cb = configs[i + 1]
  if (a === undefined || b === undefined || !ca || !cb) return sizes
  const total = a + b
  let nextA = sizeFor(a + delta, ca)
  const nextB = sizeFor(total - nextA, cb)
  nextA = total - nextB
  if (nextA !== ca.collapsedSize || !ca.collapsible) nextA = clamp(nextA, ca.minSize, ca.maxSize)
  const next = [...sizes]
  next[i] = round(nextA)
  next[i + 1] = round(total - nextA)
  return next
}

function readLayout(key: string, count: number): number[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.length === count &&
      parsed.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    ) {
      return parsed
    }
  } catch {
    // Storage can be off (private mode, a sandboxed frame) or hold junk; the defaults stand.
  }
  return null
}

function writeLayout(key: string, sizes: number[]) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(sizes))
  } catch {
    // Not remembering the layout is fine.
  }
}

export interface ResizablePanelGroupProps extends React.ComponentProps<'div'> {
  /** `horizontal` puts the panels side by side, `vertical` stacks them. Default `horizontal`. */
  direction?: ResizableDirection
  /** Remembers the layout in localStorage under this name, across visits. */
  autoSaveId?: string
  /** Called with the sizes, in percent, whenever they change. */
  onLayout?: (sizes: number[]) => void
  /** Percent moved by each arrow key press on a handle. Default 5. */
  keyboardStep?: number
}

/**
 * Panels that share a space, with handles between them to trade it. `ResizablePanel` and
 * `ResizableHandle` must be direct children, in order.
 */
function ResizablePanelGroup({
  direction = 'horizontal',
  autoSaveId,
  onLayout,
  keyboardStep = 5,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const groupId = React.useId()
  const groupRef = React.useRef<HTMLDivElement>(null)

  const elements = React.Children.toArray(children).filter(React.isValidElement)
  const configs: PanelConfig[] = []
  for (const element of elements) {
    if (element.type !== ResizablePanel) continue
    const p = element.props as ResizablePanelProps
    configs.push({
      id: p.id ?? `${groupId}-panel-${configs.length}`,
      defaultSize: p.defaultSize,
      minSize: p.minSize ?? 0,
      maxSize: p.maxSize ?? 100,
      collapsible: p.collapsible ?? false,
      collapsedSize: p.collapsedSize ?? 0,
    })
  }
  const configsRef = React.useRef(configs)
  configsRef.current = configs

  const [state, setState] = React.useState(() => defaultLayout(configs))
  // A panel added or removed starts over from the defaults.
  const sizes = state.length === configs.length ? state : defaultLayout(configs)
  const sizesRef = React.useRef(sizes)
  sizesRef.current = sizes
  const [dragging, setDragging] = React.useState<number | null>(null)
  // The size each panel had before it collapsed, to open it back to.
  const beforeCollapse = React.useRef(new Map<number, number>())
  const restored = React.useRef(false)

  React.useLayoutEffect(() => {
    if (!autoSaveId) return
    const saved = readLayout(autoSaveId, configsRef.current.length)
    if (saved) setState(saved)
    restored.current = true
  }, [autoSaveId])

  const onLayoutRef = React.useRef(onLayout)
  onLayoutRef.current = onLayout
  const firstLayout = React.useRef(true)
  React.useEffect(() => {
    if (firstLayout.current) {
      firstLayout.current = false
      return
    }
    onLayoutRef.current?.(sizes)
    if (!autoSaveId || !restored.current) return
    const timer = window.setTimeout(() => writeLayout(autoSaveId, sizes), 150)
    return () => window.clearTimeout(timer)
  }, [sizes, autoSaveId])

  const update = React.useCallback((next: number[]) => {
    const prev = sizesRef.current
    if (!next.some((s, i) => s !== prev[i])) return
    // However a panel folds, by key, drag or Enter, Enter opens it back to this size.
    configsRef.current.forEach((c, i) => {
      const before = prev[i] ?? 0
      if (c.collapsible && before > c.collapsedSize && (next[i] ?? 0) <= c.collapsedSize) {
        beforeCollapse.current.set(i, before)
      }
    })
    setState(next)
  }, [])

  const resizeBy = React.useCallback(
    (handle: number, delta: number) => {
      update(resizePair(sizesRef.current, handle, delta, configsRef.current))
    },
    [update],
  )

  const resizeTo = React.useCallback(
    (handle: number, size: number) => {
      const current = sizesRef.current[handle] ?? 0
      update(resizePair(sizesRef.current, handle, size - current, configsRef.current))
    },
    [update],
  )

  const toggleCollapse = React.useCallback(
    (handle: number) => {
      const current = sizesRef.current
      // The panel before the handle folds when it can, otherwise the one after.
      const target = configsRef.current[handle]?.collapsible ? handle : handle + 1
      const c = configsRef.current[target]
      const size = current[target]
      if (!c?.collapsible || size === undefined) return
      const collapsed = size <= c.collapsedSize
      const goal = collapsed
        ? (beforeCollapse.current.get(target) ?? c.defaultSize ?? Math.max(c.minSize, 25))
        : c.collapsedSize
      const delta = target === handle ? goal - size : size - goal
      update(resizePair(current, handle, delta, configsRef.current))
    },
    [update],
  )

  const reset = React.useCallback(
    (handle: number) => {
      const current = sizesRef.current
      const defaults = defaultLayout(configsRef.current)
      const a = current[handle]
      const b = current[handle + 1]
      const da = defaults[handle]
      const db = defaults[handle + 1]
      if (a === undefined || b === undefined || da === undefined || db === undefined) return
      // The two panels go back to their default proportion of the space they share now.
      const goal = ((a + b) * da) / (da + db)
      update(resizePair(current, handle, goal - a, configsRef.current))
    },
    [update],
  )

  const startDrag = React.useCallback(
    (handle: number, event: React.PointerEvent<HTMLElement>) => {
      const group = groupRef.current
      if (!group || event.button !== 0) return
      event.preventDefault()
      const horizontal = direction === 'horizontal'
      const panels = Array.from(group.children).filter(
        (el) => (el as HTMLElement).dataset.slot === 'resizable-panel',
      ) as HTMLElement[]
      const space =
        panels.reduce((sum, el) => sum + (horizontal ? el.offsetWidth : el.offsetHeight), 0) ||
        (horizontal ? group.clientWidth : group.clientHeight)
      if (space <= 0) return
      const rtl = horizontal && getComputedStyle(group).direction === 'rtl'
      const start = horizontal ? event.clientX : event.clientY
      const startSizes = sizesRef.current
      const target = event.currentTarget
      target.setPointerCapture?.(event.pointerId)
      setDragging(handle)
      // The whole page shows the resize cursor and stops selecting text while dragging.
      const body = document.body.style
      const saved = { cursor: body.cursor, userSelect: body.userSelect }
      body.cursor = horizontal ? 'col-resize' : 'row-resize'
      body.userSelect = 'none'

      const move = (e: PointerEvent) => {
        const offset = ((horizontal ? e.clientX : e.clientY) - start) * (rtl ? -1 : 1)
        update(resizePair(startSizes, handle, (offset / space) * 100, configsRef.current))
      }
      const end = () => {
        target.removeEventListener('pointermove', move)
        target.removeEventListener('pointerup', end)
        target.removeEventListener('pointercancel', end)
        body.cursor = saved.cursor
        body.userSelect = saved.userSelect
        setDragging(null)
      }
      target.addEventListener('pointermove', move)
      target.addEventListener('pointerup', end)
      target.addEventListener('pointercancel', end)
    },
    [direction, update],
  )

  // Rebuilt on every render: the configs come from the children, which are new each time the
  // owner renders, and the panels re-render with the group anyway.
  const context: GroupContextValue = {
    direction,
    sizes,
    configs,
    dragging,
    keyboardStep,
    startDrag,
    resizeBy,
    resizeTo,
    toggleCollapse,
    reset,
  }

  let panelIndex = -1
  return (
    <GroupContext.Provider value={context}>
      <div
        ref={groupRef}
        data-slot="resizable-panel-group"
        data-direction={direction}
        data-dragging={dragging !== null || undefined}
        className={cn(
          'flex size-full overflow-hidden',
          direction === 'vertical' && 'flex-col',
          className,
        )}
        {...props}
      >
        {elements.map((element, i) => {
          if (element.type === ResizablePanel) {
            panelIndex++
            return (
              <PanelIndexContext.Provider key={element.key ?? i} value={panelIndex}>
                {element}
              </PanelIndexContext.Provider>
            )
          }
          if (element.type === ResizableHandle) {
            return (
              <HandleIndexContext.Provider key={element.key ?? i} value={panelIndex}>
                {element}
              </HandleIndexContext.Provider>
            )
          }
          return element
        })}
      </div>
    </GroupContext.Provider>
  )
}

export interface ResizablePanelProps extends React.ComponentProps<'div'> {
  /** Starting size in percent of the group. Panels without one share what is left. */
  defaultSize?: number
  /** Smallest size in percent. Default 0. */
  minSize?: number
  /** Largest size in percent. Default 100. */
  maxSize?: number
  /**
   * Lets the panel fold to `collapsedSize` when dragged well under `minSize`, or with Enter on
   * its handle.
   */
  collapsible?: boolean
  /** Size in percent when folded. Default 0. */
  collapsedSize?: number
}

function ResizablePanel({
  defaultSize: _defaultSize,
  minSize: _minSize,
  maxSize: _maxSize,
  collapsible: _collapsible,
  collapsedSize: _collapsedSize,
  className,
  style,
  ...props
}: ResizablePanelProps) {
  const { sizes, configs, dragging } = useGroup('ResizablePanel')
  const index = React.useContext(PanelIndexContext)
  const size = sizes[index] ?? 0
  const config = configs[index]
  const collapsed = config?.collapsible === true && size <= config.collapsedSize

  return (
    <div
      data-slot="resizable-panel"
      data-collapsed={collapsed || undefined}
      data-size={size}
      {...props}
      id={config?.id}
      // Flex grow in proportion to the size, from a zero basis, so the handles keep their own
      // width and the panels share the rest exactly.
      style={{ flex: `${size} 1 0px`, ...style }}
      className={cn(
        'min-h-0 min-w-0 overflow-hidden',
        dragging === null &&
          'transition-[flex-grow] duration-(--duration-normal,200ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) motion-reduce:transition-none',
        className,
      )}
    />
  )
}

export interface ResizableHandleProps extends React.ComponentProps<'div'> {
  /** Draw a grip in the middle of the line. */
  withHandle?: boolean
  /** Stops the handle from moving. */
  disabled?: boolean
}

/**
 * The border between two panels. Drag it, or focus it and use the arrow keys, Home and End.
 * Enter folds a collapsible panel and opens it again, and a double click puts both panels back
 * to their default sizes.
 */
function ResizableHandle({
  withHandle,
  disabled,
  className,
  onKeyDown,
  onPointerDown,
  onDoubleClick,
  'aria-label': label,
  ...props
}: ResizableHandleProps) {
  const group = useGroup('ResizableHandle')
  const index = React.useContext(HandleIndexContext)
  const before = group.configs[index]
  const size = group.sizes[index] ?? 0
  const horizontal = group.direction === 'horizontal'

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || disabled || !before) return
    const less = horizontal ? 'ArrowLeft' : 'ArrowUp'
    const more = horizontal ? 'ArrowRight' : 'ArrowDown'
    const rtl = horizontal && getComputedStyle(event.currentTarget).direction === 'rtl'
    const sign = rtl ? -1 : 1
    if (event.key === less) group.resizeBy(index, -group.keyboardStep * sign)
    else if (event.key === more) group.resizeBy(index, group.keyboardStep * sign)
    else if (event.key === 'Home')
      group.resizeTo(index, before.collapsible ? before.collapsedSize : before.minSize)
    else if (event.key === 'End') group.resizeTo(index, before.maxSize)
    else if (event.key === 'Enter') group.toggleCollapse(index)
    else return
    event.preventDefault()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable window splitter has no native element
    <div
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-controls={before?.id}
      aria-valuenow={Math.round(size)}
      aria-valuemin={Math.round(
        before?.collapsible ? before.collapsedSize : (before?.minSize ?? 0),
      )}
      aria-valuemax={Math.round(before?.maxSize ?? 100)}
      aria-label={label ?? 'Resize panels'}
      aria-disabled={disabled || undefined}
      data-slot="resizable-handle"
      data-direction={group.direction}
      data-dragging={group.dragging === index || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        'relative flex shrink-0 touch-none select-none items-center justify-center bg-border outline-none transition-colors',
        'after:absolute focus-visible:bg-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging]:bg-ring',
        horizontal
          ? 'w-px cursor-col-resize after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2'
          : 'h-px cursor-row-resize after:inset-x-0 after:top-1/2 after:h-2 after:-translate-y-1/2',
        disabled && 'cursor-default',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented && !disabled) group.startDrag(index, event)
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event)
        if (!event.defaultPrevented && !disabled) group.reset(index)
      }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            'z-(--z-raised,10) flex items-center justify-center rounded-sm border bg-border',
            horizontal ? 'h-5 w-3' : 'h-3 w-5',
          )}
        >
          <GripVerticalIcon className={cn('size-2.5', !horizontal && 'rotate-90')} />
        </div>
      )}
    </div>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
