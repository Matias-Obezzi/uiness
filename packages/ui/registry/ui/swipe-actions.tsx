'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import * as React from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

export interface SwipeAction {
  /** Names the action, on its button and in the menu. */
  label: string
  icon?: React.ReactNode
  /** The color of the revealed button. Default `neutral`. */
  tone?: 'neutral' | 'primary' | 'destructive'
  /**
   * Runs on a full swipe, a tap on the revealed button or a pick from the menu. The row slides
   * away and folds first, so remove the item here, unless `keepRow` is set.
   */
  onSelect: () => void
  /** Slide the row back instead of away, for actions like "Mark as read". */
  keepRow?: boolean
}

interface GroupContextValue {
  openId: string | null
  setOpenId: (id: string | null) => void
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

/** Width of each revealed button, in pixels. */
const ACTION_WIDTH = 76
/** Movement before a press counts as a swipe, or is left to the page as a scroll. */
const SLOP = 8
/** How far past the row's width a swipe has to go to run the first action by itself. */
const FULL_SWIPE = 0.6
/** How far ahead, in milliseconds, the release speed carries the row when deciding where it lands. */
const PROJECT_MS = 120
/** Only the movement in this many milliseconds before release counts towards the speed. */
const VELOCITY_WINDOW = 100

const tones: Record<NonNullable<SwipeAction['tone']>, string> = {
  neutral: 'bg-muted-foreground text-background',
  primary: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-white',
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export interface SwipeActionsProps extends React.ComponentProps<'ul'> {}

/** A list of rows that reveal actions when swiped. Only one row stays open at a time. */
function SwipeActions({ className, ...props }: SwipeActionsProps) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const context = React.useMemo(() => ({ openId, setOpenId }), [openId])
  return (
    <GroupContext.Provider value={context}>
      <ul
        data-slot="swipe-actions"
        className={cn('flex flex-col divide-y overflow-hidden', className)}
        {...props}
      />
    </GroupContext.Provider>
  )
}

export interface SwipeActionsLabels {
  /** Name of a row's menu button, from the row's `label`. */
  moreActions: (label: string) => string
}

export const defaultSwipeActionsLabels: SwipeActionsLabels = {
  moreActions: (label) => `More actions for ${label}`,
}

export interface SwipeActionsRowProps extends Omit<React.ComponentProps<'li'>, 'children'> {
  /** Names the row in its menu button, like the subject of a message. */
  label: string
  /** Actions under the left edge, revealed by swiping right. The first one sits at the edge. */
  leading?: SwipeAction[]
  /** Actions under the right edge, revealed by swiping left. The first one sits at the edge. */
  trailing?: SwipeAction[]
  /** A long swipe runs the first action of that side without a tap. Default true. */
  fullSwipe?: boolean
  /** Show the menu button with the same actions. Default true. Keep it unless the actions are elsewhere too. */
  menu?: boolean
  /** Classes for the sliding layer that holds the content. */
  contentClassName?: string
  children?: React.ReactNode
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<SwipeActionsLabels>
}

/**
 * One row. Drag it sideways with a finger or the mouse to reveal its actions; it snaps open or
 * shut when let go, and a long swipe runs the first action. The menu button offers the same
 * actions to the keyboard, to screen readers and to anyone who would rather not swipe.
 */
function SwipeActionsRow({
  label,
  leading = [],
  trailing = [],
  fullSwipe = true,
  menu = true,
  className,
  contentClassName,
  children,
  labels: labelsProp,
  ...props
}: SwipeActionsRowProps) {
  const labels = useLabels('swipe-actions', defaultSwipeActionsLabels, labelsProp)
  const id = React.useId()
  const group = React.useContext(GroupContext)
  const reduced = useReducedMotion()
  const rowRef = React.useRef<HTMLLIElement>(null)
  const [offset, setOffset] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const offsetRef = React.useRef(0)
  React.useLayoutEffect(() => {
    offsetRef.current = offset
  })
  const drag = React.useRef<{
    pointer: number
    startX: number
    startY: number
    origin: number
    axis: 'x' | 'y' | null
    samples: [number, number][]
  } | null>(null)
  const suppressClick = React.useRef(false)

  const leadingWidth = leading.length * ACTION_WIDTH
  const trailingWidth = trailing.length * ACTION_WIDTH
  const rowWidth = () => rowRef.current?.offsetWidth || 360
  const fullAt = () => rowWidth() * FULL_SWIPE
  // The row's width for rendering, kept in state: render cannot measure the DOM.
  const [measuredWidth, setMeasuredWidth] = React.useState(360)
  React.useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    setMeasuredWidth(row.offsetWidth || 360)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setMeasuredWidth(row.offsetWidth || 360))
    observer.observe(row)
    return () => observer.disconnect()
  }, [])
  const armed =
    fullSwipe &&
    ((offset > 0 && leading.length > 0 && offset >= measuredWidth * FULL_SWIPE) ||
      (offset < 0 && trailing.length > 0 && -offset >= measuredWidth * FULL_SWIPE))

  const settle = React.useCallback(
    (next: number) => {
      setOffset(next)
      if (next !== 0) group?.setOpenId(id)
      else if (group?.openId === id) group.setOpenId(null)
    },
    [group, id],
  )

  // Another row opening closes this one.
  React.useEffect(() => {
    if (group && group.openId !== id && offsetRef.current !== 0 && !drag.current) setOffset(0)
  }, [group, id])

  // While open, Escape or a press anywhere else puts the row away.
  React.useEffect(() => {
    if (offset === 0 || dragging || busy) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') settle(0)
    }
    const onPointer = (event: PointerEvent) => {
      if (!rowRef.current?.contains(event.target as Node)) settle(0)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [offset, dragging, busy, settle])

  const run = async (action: SwipeAction, direction: 1 | -1) => {
    if (busy) return
    const row = rowRef.current
    const duration = 220
    if (reduced || !row) {
      setOffset(0)
      action.onSelect()
      return
    }
    setBusy(true)
    if (action.keepRow) {
      setOffset(0)
      await wait(duration)
      setBusy(false)
      action.onSelect()
      return
    }
    // Slide away, then fold the row's height so the list closes the gap smoothly.
    setOffset(direction * row.offsetWidth)
    await wait(duration)
    if (typeof row.animate === 'function') {
      const fold = row.animate([{ height: `${row.offsetHeight}px` }, { height: '0px' }], {
        duration,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        fill: 'forwards',
      })
      await fold.finished.catch(() => {})
      action.onSelect()
      // If the owner kept the item, put the row back in place.
      fold.cancel()
    } else {
      action.onSelect()
    }
    setDragging(true)
    setOffset(0)
    setBusy(false)
    requestAnimationFrame(() => setDragging(false))
    if (group?.openId === id) group.setOpenId(null)
  }

  const constrain = (raw: number) => {
    const sideWidth = raw > 0 ? leadingWidth : trailingWidth
    const has = raw > 0 ? leading.length > 0 : trailing.length > 0
    const limit = !has ? 0 : fullSwipe ? rowWidth() : sideWidth
    const distance = Math.abs(raw)
    // Past the limit it still follows, but each pixel costs more, like pulling elastic.
    const eased = distance <= limit ? distance : limit + (distance - limit) * 0.2
    return Math.sign(raw) * eased
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) return
    if ((event.target as HTMLElement).closest('[data-swipe-ignore]')) return
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offsetRef.current,
      axis: null,
      samples: [[event.timeStamp, event.clientX]],
    }
    // Measured again as a drag starts, so the full swipe point matches the handlers'.
    setMeasuredWidth(rowWidth())
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    const dx = event.clientX - d.startX
    const dy = event.clientY - d.startY
    if (d.axis === null) {
      if (Math.abs(dx) > SLOP && Math.abs(dx) > Math.abs(dy)) {
        d.axis = 'x'
        d.startX = event.clientX
        event.currentTarget.setPointerCapture?.(event.pointerId)
        setDragging(true)
        group?.setOpenId(id)
      } else if (Math.abs(dy) > SLOP) {
        d.axis = 'y'
      }
      return
    }
    if (d.axis !== 'x') return
    event.preventDefault()
    d.samples.push([event.timeStamp, event.clientX])
    if (d.samples.length > 6) d.samples.shift()
    setOffset(constrain(d.origin + event.clientX - d.startX))
  }

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    drag.current = null
    if (d.axis !== 'x') return
    suppressClick.current = true
    setDragging(false)
    const current = offsetRef.current
    // Speed over the last moments before release; a finger that stopped has none.
    const recent = d.samples.filter(([t]) => event.timeStamp - t <= VELOCITY_WINDOW)
    const first = recent[0]
    const span = first ? Math.max(event.timeStamp - first[0], 16) : 0
    const velocity =
      !cancelled && first && recent.length > 1 ? (event.clientX - first[1]) / span : 0
    if (fullSwipe && !cancelled) {
      const primary = current > 0 ? leading[0] : trailing[0]
      if (primary && Math.abs(current) >= fullAt()) {
        void run(primary, current > 0 ? 1 : -1)
        return
      }
    }
    const projected = current + velocity * PROJECT_MS
    if (projected > leadingWidth / 2 && leading.length > 0 && current > 0) settle(leadingWidth)
    else if (projected < -trailingWidth / 2 && trailing.length > 0 && current < 0)
      settle(-trailingWidth)
    else settle(0)
  }

  const all = [...leading.map((a) => [a, 1] as const), ...trailing.map((a) => [a, -1] as const)]

  return (
    <li
      ref={rowRef}
      data-slot="swipe-actions-row"
      data-open={offset !== 0 || undefined}
      className={cn('relative overflow-hidden bg-background', className)}
      {...props}
    >
      {leading.length > 0 && (
        <SwipeActionsSide
          actions={leading}
          where="leading"
          offset={offset}
          dragging={dragging}
          busy={busy}
          armed={armed}
          onRun={run}
        />
      )}
      {trailing.length > 0 && (
        <SwipeActionsSide
          actions={trailing}
          where="trailing"
          offset={offset}
          dragging={dragging}
          busy={busy}
          armed={armed}
          onRun={run}
        />
      )}
      <div
        data-slot="swipe-actions-content"
        data-dragging={dragging || undefined}
        className={cn(
          'relative flex touch-pan-y items-center gap-2 bg-background',
          !dragging &&
            'transition-transform duration-(--duration-normal,200ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) motion-reduce:transition-none',
          dragging && 'select-none',
          contentClassName,
        )}
        style={{ transform: offset ? `translate3d(${offset}px, 0, 0)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishDrag(event, false)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onClickCapture={(event) => {
          // The click that ends a drag, or a tap on an open row, only puts the row away.
          if (suppressClick.current || (offsetRef.current !== 0 && !busy)) {
            if (!suppressClick.current) settle(0)
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        <div className="min-w-0 flex-1">{children}</div>
        {menu && all.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              data-swipe-ignore=""
              aria-label={labels.moreActions(label)}
              className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground"
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {all.map(([action, direction], i) => (
                <React.Fragment key={`${direction}-${action.label}`}>
                  {i === leading.length && i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    variant={action.tone === 'destructive' ? 'destructive' : 'default'}
                    onSelect={() => void run(action, direction)}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  )
}

/** The actions under one side of a row, as wide as the row has moved that way. */
function SwipeActionsSide({
  actions,
  where,
  offset,
  dragging,
  busy,
  armed,
  onRun,
}: {
  actions: SwipeAction[]
  where: 'leading' | 'trailing'
  offset: number
  dragging: boolean
  busy: boolean
  armed: boolean
  onRun: (action: SwipeAction, direction: 1 | -1) => void
}) {
  const open = where === 'leading' ? offset > 0 : offset < 0
  const width = Math.abs(open ? offset : 0)
  return (
    <div
      data-slot={`swipe-actions-${where}`}
      inert={!open || dragging || busy}
      className={cn(
        'absolute inset-y-0 flex overflow-hidden',
        where === 'leading' ? 'left-0' : 'right-0 flex-row-reverse',
        !dragging &&
          'transition-[width] duration-(--duration-normal,200ms) ease-(--easing-standard,cubic-bezier(0.2,0,0,1)) motion-reduce:transition-none',
      )}
      style={{ width }}
    >
      {actions.map((action, i) => (
        <button
          key={action.label}
          type="button"
          tabIndex={open ? 0 : -1}
          data-armed={(armed && i === 0) || undefined}
          className={cn(
            'flex min-w-0 shrink grow basis-0 flex-col items-center justify-center gap-1 overflow-hidden px-2 font-medium text-xs outline-none transition-[flex-grow] duration-(--duration-normal,200ms) focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset motion-reduce:transition-none [&_svg]:size-5 [&_svg]:shrink-0',
            tones[action.tone ?? 'neutral'],
            // Past the full swipe point the first action takes the whole width.
            armed && (i === 0 ? 'grow-[100]' : 'grow-0'),
          )}
          onClick={() => onRun(action, where === 'leading' ? 1 : -1)}
        >
          {action.icon}
          <span className="max-w-full truncate">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

export { SwipeActions, SwipeActionsRow }
