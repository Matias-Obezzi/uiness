'use client'

import {
  type DragAnnouncements,
  type GroupsChange,
  type SortableGroupsResult,
  useSortableGroups,
} from '@uiness/dnd'
import { GripVerticalIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type { DragLocation, GroupsChange } from '@uiness/dnd'

interface KanbanContextValue {
  board: SortableGroupsResult
  /** Pointer drags only start from a `<KanbanHandle>`. */
  withHandle: boolean
}

const KanbanContext = React.createContext<KanbanContextValue | null>(null)
const KanbanCardContext = React.createContext<string | null>(null)

function useKanban() {
  const context = React.useContext(KanbanContext)
  if (!context) throw new Error('Kanban parts must be rendered inside <Kanban>')
  return context
}

function useKanbanCard() {
  const id = React.useContext(KanbanCardContext)
  if (id === null) throw new Error('<KanbanHandle> must be rendered inside <KanbanCard>')
  return id
}

export interface KanbanProps extends Omit<React.ComponentProps<'div'>, 'children' | 'onChange'> {
  /** Column id to the card ids it holds, in order. An empty column is still a drop target. */
  groups: Record<string, string[]>
  /** Called once, when a card is dropped somewhere other than where it started. */
  onChange: (groups: Record<string, string[]>, change: GroupsChange) => void
  /** Column order, which is the order the left and right arrow keys walk. Default the keys. */
  order?: string[]
  disabled?: boolean
  /**
   * Pointer drags only start from a `<KanbanHandle>` instead of anywhere on the card, which is
   * what makes a board draggable on touch without taking the page scroll with it. The keyboard
   * still drives the card itself, so there is one focus stop per card either way.
   */
  withHandle?: boolean
  /** Pixels the pointer must travel before the drag starts. Default 4. */
  activationDistance?: number
  /** Override any of the four screen reader messages. */
  announcements?: DragAnnouncements
  /** What a screen reader calls a card. Default `sortable item`. */
  roleDescription?: string
  /** One column per id, with the cards it holds right now. Keyed by you. */
  children: (columnId: string, cards: string[]) => React.ReactNode
  /** A copy of the dragged card that follows the pointer. Optional. */
  overlay?: (id: string) => React.ReactNode
}

/**
 * A board of columns whose cards move within a column and across to the next one. Focus a
 * card (or its handle), press space to pick it up, up and down to move inside the column,
 * left and right to cross to another one, space to drop and escape to put it back. The
 * column under the drag carries `data-over`.
 */
function Kanban({
  groups,
  onChange,
  order,
  disabled,
  withHandle = false,
  activationDistance,
  announcements,
  roleDescription,
  className,
  children,
  overlay,
  ...props
}: KanbanProps) {
  const board = useSortableGroups({
    groups,
    onChange,
    order,
    disabled,
    activationDistance,
    announcements,
    roleDescription,
  })
  const columns = order ?? Object.keys(groups)
  const context = React.useMemo<KanbanContextValue>(
    () => ({ board, withHandle }),
    [board, withHandle],
  )

  return (
    <KanbanContext.Provider value={context}>
      <div
        data-slot="kanban"
        data-disabled={disabled ? '' : undefined}
        {...props}
        className={cn(
          'flex items-start gap-4 overflow-x-auto data-[disabled]:opacity-50',
          className,
        )}
      >
        {columns.map((columnId) => children(columnId, board.groups[columnId] ?? []))}
      </div>
      {overlay ? (
        <div
          data-slot="kanban-overlay"
          className="rounded-lg shadow-lg"
          {...board.getOverlayProps()}
        >
          {board.activeId ? overlay(board.activeId) : null}
        </div>
      ) : null}
      <div {...board.getLiveRegionProps()}>{board.announcement}</div>
    </KanbanContext.Provider>
  )
}

export interface KanbanColumnProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Matches one of the keys of `<Kanban groups>`. */
  id: string
  /** Shown above the cards and used to name the column for screen readers. */
  title?: React.ReactNode
}

/** One column. Highlights itself at `[data-over]` while a card is held over it. */
function KanbanColumn({ id, title, className, children, ...props }: KanbanColumnProps) {
  const { board } = useKanban()
  const titleId = React.useId()

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box model
    <div
      data-slot="kanban-column"
      role="group"
      aria-labelledby={title ? titleId : undefined}
      {...props}
      {...board.getGroupProps(id)}
      className={cn(
        'flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-input bg-muted/40 p-2 transition-colors',
        'data-[over]:border-ring data-[over]:bg-accent',
        className,
      )}
    >
      {title ? (
        <div
          id={titleId}
          data-slot="kanban-column-title"
          className="px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide"
        >
          {title}
        </div>
      ) : null}
      <div data-slot="kanban-column-cards" className="flex min-h-16 flex-col gap-2">
        {children}
      </div>
    </div>
  )
}

export interface KanbanCardProps extends React.ComponentProps<'div'> {
  /** Matches one of the card ids in `<Kanban groups>`. */
  id: string
}

/**
 * One card: the thing that moves, and the thing the keyboard drives. Keeping the focus on the
 * card rather than on a handle is what lets a keyboard drag survive the card being re-rendered
 * into another column halfway across the board.
 */
function KanbanCard({ id, className, style, children, ...props }: KanbanCardProps) {
  const { board, withHandle } = useKanban()
  const { onPointerDown, ...handle } = board.getHandleProps(id)

  return (
    <KanbanCardContext.Provider value={id}>
      <div
        data-slot="kanban-card"
        {...props}
        {...board.getItemProps(id)}
        {...handle}
        {...(withHandle ? null : { onPointerDown })}
        className={cn(
          'flex items-start gap-2 rounded-md border border-input bg-background p-3 text-sm shadow-xs outline-none transition-colors',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'data-[dragging]:z-10 data-[dragging]:border-ring data-[dragging]:bg-accent data-[dragging]:text-accent-foreground',
          withHandle ? null : 'cursor-grab data-[dragging]:cursor-grabbing',
          className,
        )}
        style={{ ...handle.style, ...style }}
      >
        {children}
      </div>
    </KanbanCardContext.Provider>
  )
}

export type KanbanHandleProps = React.ComponentProps<'span'>

/**
 * The grip a card is dragged by with a pointer. Only does anything on a board marked
 * `withHandle`. It is hidden from screen readers on purpose: the card it sits in already
 * carries the button role, the name and the keys.
 */
function KanbanHandle({ className, style, children, ...props }: KanbanHandleProps) {
  const { board } = useKanban()
  const id = useKanbanCard()
  const { onPointerDown, style: handleStyle } = board.getHandleProps(id)
  const active = board.isDragging && board.activeId === id

  return (
    <span
      data-slot="kanban-handle"
      aria-hidden="true"
      data-dragging={active ? '' : undefined}
      {...props}
      onPointerDown={onPointerDown}
      className={cn(
        'inline-flex shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors',
        'data-[dragging]:cursor-grabbing data-[dragging]:text-foreground',
        className,
      )}
      style={{ ...handleStyle, ...style }}
    >
      {children ?? <GripVerticalIcon className="size-4" />}
    </span>
  )
}

export { Kanban, KanbanCard, KanbanColumn, KanbanHandle }
