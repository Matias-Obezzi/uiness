'use client'

import {
  type DragAnnouncements,
  type SortableChange,
  type SortableResult,
  useSortable,
} from '@uiness/dnd'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type { SortableChange } from '@uiness/dnd'

const ReorderableGridContext = React.createContext<SortableResult | null>(null)
/**
 * True inside the floating copy of the dragged tile. The copy runs the same render function as
 * the grid, so without this it would register a second time under the id of the tile it is a
 * copy of, and the real tile would lose its box to the copy.
 */
const ReorderableGridOverlayContext = React.createContext(false)

/** Classes the tile wears while it is the one being dragged. The floating copy never wears them. */
const DRAGGING_ITEM =
  'data-[dragging]:z-10 data-[dragging]:cursor-grabbing data-[dragging]:border-ring data-[dragging]:bg-accent data-[dragging]:text-accent-foreground'

function useReorderableGrid() {
  const context = React.useContext(ReorderableGridContext)
  if (!context) {
    throw new Error('<ReorderableGridItem> must be rendered inside <ReorderableGrid>')
  }
  return context
}

export interface ReorderableGridProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Item ids, in their current order. Ids have to be unique and stable. */
  items: string[]
  /** Called once, when a tile is dropped somewhere other than where it started. */
  onReorder: (items: string[], change: SortableChange) => void
  /** Tiles per row. Default 4. Also what the up and down arrow keys step by. */
  columns?: number
  disabled?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls a tile. Default `grid item`. */
  roleDescription?: string
  /** One tile per id, in the order the drag is currently leaving them. Keyed by you. */
  children: (id: string, index: number) => React.ReactNode
  /**
   * What the copy that follows the pointer looks like. By default it is the tile itself, run
   * through `children` again. Pass this to show something else instead. Never shown during a
   * keyboard drag, where there is no pointer to follow.
   */
  overlay?: (id: string) => React.ReactNode
}

/**
 * Tiles you can rearrange in two dimensions, the way a home screen rearranges its icons.
 * Focus a tile, press space to pick it up, the arrow keys to move it a cell sideways or a
 * whole row up and down, space to drop it and escape to put it back.
 */
function ReorderableGrid({
  items,
  onReorder,
  columns = 4,
  disabled,
  activationDistance,
  announcements,
  roleDescription = 'grid item',
  className,
  style,
  children,
  overlay,
  ...props
}: ReorderableGridProps) {
  const grid = useSortable({
    items,
    onReorder,
    axis: 'both',
    columns,
    disabled,
    activationDistance,
    announcements,
    roleDescription,
  })

  return (
    <ReorderableGridContext.Provider value={grid}>
      <div
        data-slot="reorderable-grid"
        data-disabled={disabled ? '' : undefined}
        {...props}
        {...grid.getListProps()}
        className={cn('grid gap-3 data-[disabled]:opacity-50', className)}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}
      >
        {grid.items.map((id, index) => children(id, index))}
      </div>
      <div
        data-slot="reorderable-grid-overlay"
        className="rounded-lg shadow-lg"
        {...grid.getOverlayProps()}
      >
        {grid.activeId && grid.mode === 'pointer' ? (
          <ReorderableGridOverlayContext.Provider value={true}>
            {overlay
              ? overlay(grid.activeId)
              : children(grid.activeId, grid.items.indexOf(grid.activeId))}
          </ReorderableGridOverlayContext.Provider>
        ) : null}
      </div>
      <div {...grid.getLiveRegionProps()}>{grid.announcement}</div>
    </ReorderableGridContext.Provider>
  )
}

export interface ReorderableGridItemProps extends React.ComponentProps<'div'> {
  /** Matches one of the ids passed to `<ReorderableGrid items>`. */
  id: string
}

/** One tile. Dragged from anywhere on it; a tile this small has no room for a handle. */
function ReorderableGridItem({
  id,
  className,
  style,
  children,
  ...props
}: ReorderableGridItemProps) {
  const grid = useReorderableGrid()
  const inOverlay = React.useContext(ReorderableGridOverlayContext)
  const { style: handleStyle, ...handle } = grid.getHandleProps(id)

  return (
    <div
      data-slot="reorderable-grid-item"
      {...props}
      {...(inOverlay ? null : { ...grid.getItemProps(id), ...handle })}
      className={cn(
        'flex aspect-square cursor-grab select-none flex-col items-center justify-center gap-1 rounded-lg border border-input bg-background p-2 text-center text-sm outline-none transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        inOverlay ? null : DRAGGING_ITEM,
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      style={inOverlay ? style : { ...handleStyle, ...style }}
    >
      {children}
    </div>
  )
}

export { ReorderableGrid, ReorderableGridItem }
