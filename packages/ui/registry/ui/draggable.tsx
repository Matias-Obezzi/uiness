'use client'

import {
  type AnnouncementContext,
  type DragAnnouncements,
  type DraggableResult,
  defaultAnnouncements,
  type Point,
  type Rect,
  useDraggable,
} from '@uiness/dnd'
import { GripHorizontalIcon } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface DraggableLabels {
  /** What a screen reader calls the element. */
  draggable: string
  /** The name read in the announcements when no `id` is given. */
  panel: string
  /** Read out as the name of a `DraggableHandle`. */
  handle: string
  /** Read when it is picked up. */
  start: (context: AnnouncementContext) => string
  /** Read when it moves. */
  move: (context: AnnouncementContext) => string
  /** Read when it is dropped. */
  drop: (context: AnnouncementContext) => string
  /** Read when the drag is cancelled. */
  cancel: (context: AnnouncementContext) => string
}

export const defaultDraggableLabels: DraggableLabels = {
  draggable: 'draggable',
  panel: 'panel',
  handle: 'Move panel',
  ...defaultAnnouncements,
}

export type { Point, Rect } from '@uiness/dnd'

const DraggableContext = React.createContext<DraggableResult | null>(null)

function useDraggableRoot() {
  const context = React.useContext(DraggableContext)
  if (!context) throw new Error('<DraggableHandle> must be rendered inside <Draggable>')
  return context
}

export interface DraggableProps
  extends Omit<React.ComponentProps<'div'>, 'onDragStart' | 'onDragEnd'> {
  /** Name read out in the announcements. Default `panel`. */
  id?: string
  /** Controlled offset from where the element sits in the layout. */
  position?: Point
  /** Offset to start from when the component owns the position. Default `{ x: 0, y: 0 }`. */
  defaultPosition?: Point
  /** Every change, including the ones during a drag. */
  onPositionChange?: (position: Point) => void
  /** Once, when the drag is dropped. */
  onDragEnd?: (position: Point) => void
  /** Keep it inside a box: a rect in viewport pixels, or its offset parent. */
  bounds?: Rect | 'parent' | null
  /** Which way it may move. Default `both`. */
  axis?: 'x' | 'y' | 'both'
  disabled?: boolean
  /** It only moves when dragged from a `<DraggableHandle>` instead of from anywhere on it. */
  withHandle?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Pixels one arrow key press moves it. Default 20. */
  keyboardStep?: number
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls it. Default `draggable`. */
  roleDescription?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<DraggableLabels>
}

/**
 * An element you can move anywhere: a dialog by its title bar, a floating panel, a pin on a
 * map. The offset is written as a transform, so it composes with whatever CSS put the element
 * there. Focus it (or its handle), press space to pick it up, the arrow keys to move it, space
 * to drop it and escape to put it back where it was.
 */
function Draggable({
  id: idProp,
  position,
  defaultPosition,
  onPositionChange,
  onDragEnd,
  bounds,
  axis,
  disabled,
  withHandle = false,
  activationDistance,
  keyboardStep,
  announcements,
  roleDescription,
  labels: labelsProp,
  className,
  style,
  children,
  ...props
}: DraggableProps) {
  const labels = useLabels('draggable', defaultDraggableLabels, labelsProp)
  const drag = useDraggable({
    id: idProp ?? labels.panel,
    position,
    defaultPosition,
    onPositionChange,
    onDragEnd,
    bounds,
    axis,
    disabled,
    activationDistance,
    keyboardStep,
    announcements: {
      start: labels.start,
      move: labels.move,
      drop: labels.drop,
      cancel: labels.cancel,
      ...announcements,
    },
    roleDescription: roleDescription ?? labels.draggable,
  })
  const element = drag.getElementProps()
  const handle = withHandle ? null : drag.getHandleProps()

  return (
    <DraggableContext.Provider value={drag}>
      <div
        data-slot="draggable"
        {...props}
        {...element}
        {...handle}
        className={cn(
          'relative rounded-lg border border-input bg-background text-foreground shadow-sm outline-none',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'data-[dragging]:z-(--z-drag,90) data-[dragging]:border-ring data-[dragging]:shadow-lg',
          'aria-disabled:opacity-50',
          withHandle ? null : 'cursor-grab data-[dragging]:cursor-grabbing',
          className,
        )}
        style={{ ...element.style, ...handle?.style, ...style }}
      >
        {children}
        <div {...drag.getLiveRegionProps()}>{drag.announcement}</div>
      </div>
    </DraggableContext.Provider>
  )
}

export interface DraggableHandleProps extends React.ComponentProps<'div'> {
  /** Read out as the name of the handle. Default `Move panel`. */
  label?: string
}

/** The bar the element is dragged by. Only does anything on a `<Draggable withHandle>`. */
function DraggableHandle({ label, className, style, children, ...props }: DraggableHandleProps) {
  const drag = useDraggableRoot()
  const handle = drag.getHandleProps()
  const labels = useLabels('draggable', defaultDraggableLabels)

  return (
    <div
      data-slot="draggable-handle"
      {...props}
      {...handle}
      className={cn(
        'flex cursor-grab select-none items-center gap-2 rounded-t-lg border-input border-b bg-muted px-3 py-2 text-muted-foreground text-sm outline-none transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'data-[dragging]:cursor-grabbing data-[dragging]:bg-accent data-[dragging]:text-accent-foreground',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        className,
      )}
      style={{ ...handle.style, ...style }}
    >
      <GripHorizontalIcon className="size-4 shrink-0" aria-hidden="true" />
      {children ?? <span className="sr-only">{label ?? labels.handle}</span>}
    </div>
  )
}

export { Draggable, DraggableHandle }
