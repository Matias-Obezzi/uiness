'use client'

import {
  type DragAnnouncements,
  type SortableChange,
  type SortableResult,
  useSortable,
} from '@uiness/dnd'
import { GripVerticalIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type { SortableChange } from '@uiness/dnd'

interface SortableContextValue {
  sortable: SortableResult
  /** Pointer drags only start from a `<SortableHandle>`. */
  withHandle: boolean
}

const SortableContext = React.createContext<SortableContextValue | null>(null)
const SortableItemContext = React.createContext<string | null>(null)
/**
 * True inside the floating copy of the dragged row. The copy runs the same render function as
 * the list, so without this every part would register a second time under the id of the row it
 * is a copy of, and the real row would lose its box to the copy.
 */
const SortableOverlayContext = React.createContext(false)

/** Classes the row wears while it is the one being dragged. The floating copy never wears them. */
const DRAGGING_ITEM =
  'data-[dragging]:z-10 data-[dragging]:border-ring data-[dragging]:bg-accent data-[dragging]:text-accent-foreground data-[dragging]:shadow-sm'

function useSortableRoot() {
  const context = React.useContext(SortableContext)
  if (!context) throw new Error('Sortable parts must be rendered inside <Sortable>')
  return context
}

function useSortableItem() {
  const id = React.useContext(SortableItemContext)
  if (id === null) throw new Error('<SortableHandle> must be rendered inside <SortableItem>')
  return id
}

export interface SortableProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
  /** Item ids, in their current order. Ids have to be unique and stable. */
  items: string[]
  /** Called once, when an item is dropped somewhere other than where it started. */
  onReorder: (items: string[], change: SortableChange) => void
  /** `y` for a vertical list (default), `x` for a horizontal one. */
  axis?: 'x' | 'y'
  disabled?: boolean
  /**
   * Pointer drags only start from a `<SortableHandle>` instead of anywhere on the row, which is
   * what makes a list draggable on touch without taking the page scroll with it. The keyboard
   * still drives the row itself, so there is one focus stop per row either way.
   */
  withHandle?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls an item. Default `sortable item`. */
  roleDescription?: string
  /** One item per id, in the order the drag is currently leaving them. Keyed by you. */
  children: (id: string, index: number) => React.ReactNode
  /**
   * What the copy that follows the pointer looks like. By default it is the row itself, run
   * through `children` again, which is what makes a drag visible without any wiring. Pass this
   * to show something else instead. Never shown during a keyboard drag, where there is no
   * pointer to follow.
   */
  overlay?: (id: string) => React.ReactNode
}

/**
 * A list you can reorder with the pointer or the keyboard. Focus a row (or its handle),
 * press space to pick it up, the arrow keys to move it, space again to drop it and escape
 * to put it back. The live region that reads all of that out is rendered for you.
 */
function Sortable({
  items,
  onReorder,
  axis = 'y',
  disabled,
  withHandle = false,
  activationDistance,
  announcements,
  roleDescription,
  className,
  children,
  overlay,
  ...props
}: SortableProps) {
  const sortable = useSortable({
    items,
    onReorder,
    axis,
    disabled,
    activationDistance,
    announcements,
    roleDescription,
  })
  const context = React.useMemo<SortableContextValue>(
    () => ({ sortable, withHandle }),
    [sortable, withHandle],
  )

  return (
    <SortableContext.Provider value={context}>
      <ul
        data-slot="sortable"
        data-axis={axis}
        data-disabled={disabled ? '' : undefined}
        {...props}
        {...sortable.getListProps()}
        className={cn(
          'flex list-none gap-2 p-0 data-[disabled]:opacity-50',
          axis === 'x' ? 'flex-row' : 'flex-col',
          className,
        )}
      >
        {sortable.items.map((id, index) => children(id, index))}
      </ul>
      <div
        data-slot="sortable-overlay"
        className="rounded-md shadow-lg"
        {...sortable.getOverlayProps()}
      >
        {sortable.activeId && sortable.mode === 'pointer' ? (
          <SortableOverlayContext.Provider value={true}>
            {overlay
              ? overlay(sortable.activeId)
              : children(sortable.activeId, sortable.items.indexOf(sortable.activeId))}
          </SortableOverlayContext.Provider>
        ) : null}
      </div>
      <div {...sortable.getLiveRegionProps()}>{sortable.announcement}</div>
    </SortableContext.Provider>
  )
}

export interface SortableItemProps extends React.ComponentProps<'li'> {
  /** Matches one of the ids passed to `<Sortable items>`. */
  id: string
}

/**
 * One row: the thing that moves, and the thing the keyboard drives. On a list marked
 * `withHandle` the press that starts a pointer drag is left to `<SortableHandle>` and
 * everything else stays here, so the row is still the single focus stop.
 */
function SortableItem({ id, className, style, children, ...props }: SortableItemProps) {
  const { sortable, withHandle } = useSortableRoot()
  const inOverlay = React.useContext(SortableOverlayContext)
  const { onPointerDown, style: handleStyle, ...handle } = sortable.getHandleProps(id)

  return (
    <SortableItemContext.Provider value={id}>
      <li
        data-slot="sortable-item"
        {...props}
        {...(inOverlay
          ? null
          : {
              ...sortable.getItemProps(id),
              ...handle,
              ...(withHandle ? null : { onPointerDown }),
            })}
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          inOverlay ? null : DRAGGING_ITEM,
          withHandle ? null : 'cursor-grab data-[dragging]:cursor-grabbing',
          className,
        )}
        style={inOverlay ? style : { ...handleStyle, ...style }}
      >
        {children}
      </li>
    </SortableItemContext.Provider>
  )
}

export type SortableHandleProps = React.ComponentProps<'span'>

/**
 * The grip a row is dragged by with a pointer. Only does anything on a list marked
 * `withHandle`. It is hidden from screen readers on purpose: the row it sits in already
 * carries the button role, the name and the keys, and two stops per row would be one too many.
 */
function SortableHandle({ className, style, children, ...props }: SortableHandleProps) {
  const { sortable, withHandle } = useSortableRoot()
  const id = useSortableItem()
  const inOverlay = React.useContext(SortableOverlayContext)
  const { onPointerDown, style: handleStyle } = sortable.getHandleProps(id)
  const active = !inOverlay && sortable.isDragging && sortable.activeId === id

  return (
    <span
      data-slot="sortable-handle"
      aria-hidden="true"
      data-dragging={active ? '' : undefined}
      {...props}
      {...(inOverlay || !withHandle ? null : { onPointerDown })}
      className={cn(
        'inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors',
        'data-[dragging]:cursor-grabbing data-[dragging]:text-foreground',
        className,
      )}
      style={{ ...handleStyle, ...style }}
    >
      {children ?? <GripVerticalIcon className="size-4" />}
    </span>
  )
}

export { Sortable, SortableHandle, SortableItem }
