'use client'

import { GripIcon } from 'lucide-react'
import * as React from 'react'
import { Kbd } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type ToolbarEdge = 'top' | 'right' | 'bottom' | 'left'

export interface Tool {
  id: string
  label: string
  icon: React.ReactNode
  /** A single key that picks it while focus is not in a field, such as `V`. */
  shortcut?: string
  /** Variants in a flyout: picking one makes it this tool's face. */
  variants?: Omit<Tool, 'variants'>[]
}

export interface ToolbarLabels {
  /** Names the toolbar. */
  toolbar: string
  /** Names the grip. */
  move: string
  /** Names a tool's flyout. */
  more: (tool: string) => string
}

export const defaultToolbarLabels: ToolbarLabels = {
  toolbar: 'Tools',
  move: 'Move the toolbar: drag it, or press Shift and an arrow key, to another edge.',
  more: (tool) => `More ${tool} tools`,
}

/** The edge a point is nearest to, in a box of a given size. */
export function nearestEdge(x: number, y: number, width: number, height: number): ToolbarEdge {
  const distances: [ToolbarEdge, number][] = [
    ['top', y / height],
    ['bottom', 1 - y / height],
    ['left', x / width],
    ['right', 1 - x / width],
  ]
  return distances.sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'bottom'
}

const placed: Record<ToolbarEdge, string> = {
  top: 'top-3 left-1/2 -translate-x-1/2',
  bottom: 'bottom-3 left-1/2 -translate-x-1/2',
  left: 'left-3 top-1/2 -translate-y-1/2',
  right: 'right-3 top-1/2 -translate-y-1/2',
}

export interface ToolbarProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'defaultValue'> {
  tools: Tool[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Which edge of its positioned parent it sits on. */
  edge?: ToolbarEdge
  defaultEdge?: ToolbarEdge
  onEdgeChange?: (edge: ToolbarEdge) => void
  labels?: Partial<ToolbarLabels>
}

/**
 * An editor's tool dock. A plate slides under the chosen tool, each tool shows its name and
 * shortcut on hover, and tools with variants open a flyout. Grab the grip and throw it at any
 * edge of its parent: it lands on the nearest, upright on the left and right. Arrow keys move
 * between tools; single-key shortcuts pick them.
 */
function Toolbar({
  tools,
  value,
  defaultValue,
  onValueChange,
  edge,
  defaultEdge = 'bottom',
  onEdgeChange,
  labels: labelsProp,
  className,
  ...props
}: ToolbarProps) {
  const labels = useLabels('toolbar', defaultToolbarLabels, labelsProp)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue ?? tools[0]?.id)
  const current = value ?? own
  const [ownEdge, setOwnEdge] = React.useState(defaultEdge)
  const side = edge ?? ownEdge
  const vertical = side === 'left' || side === 'right'
  // The variant picked for each tool with a flyout.
  const [faces, setFaces] = React.useState<Record<string, string>>({})
  const [drag, setDrag] = React.useState<{ x: number; y: number } | null>(null)
  const dragFrom = React.useRef<{ pointer: number; x: number; y: number } | null>(null)
  const bar = React.useRef<HTMLDivElement>(null)
  const [plate, setPlate] = React.useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  )

  const pick = (id: string) => {
    if (value === undefined) setOwn(id)
    onValueChange?.(id)
  }
  const moveTo = (next: ToolbarEdge) => {
    if (edge === undefined) setOwnEdge(next)
    onEdgeChange?.(next)
  }
  const faceOf = (tool: Tool) =>
    tool.variants?.find((v) => v.id === faces[tool.id]) ?? tool.variants?.[0] ?? tool
  const activeTool = tools.find(
    (t) => t.id === current || t.variants?.some((v) => v.id === current),
  )

  // The plate goes under the chosen tool.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new edge lays the tools out again
  React.useLayoutEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>(`[data-tool="${activeTool?.id}"]`)
    if (!el) return setPlate(null)
    setPlate({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
  }, [activeTool?.id, side])

  // Single-key shortcuts, away from fields.
  const toolsRef = React.useRef(tools)
  const pickRef = React.useRef(pick)
  React.useEffect(() => {
    toolsRef.current = tools
    pickRef.current = pick
  })
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      for (const tool of toolsRef.current)
        for (const t of [tool, ...(tool.variants ?? [])])
          if (t.shortcut && t.shortcut.toLowerCase() === event.key.toLowerCase()) {
            pickRef.current(t.id)
            if (t !== tool) setFaces((f) => ({ ...f, [tool.id]: t.id }))
            return
          }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const roving = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
    const dir = event.key === keys[0] ? -1 : event.key === keys[1] ? 1 : 0
    if (!dir && event.key !== 'Home' && event.key !== 'End') return
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-tool-button]'),
    )
    const at = buttons.indexOf(document.activeElement as HTMLElement)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (at + dir + buttons.length) % buttons.length
    buttons[next]?.focus()
    event.preventDefault()
  }

  return (
    <div
      data-slot="toolbar"
      data-edge={side}
      className={cn(
        'absolute z-10',
        !drag && placed[side],
        !drag &&
          !reduced &&
          'transition-[top,left,right,bottom,translate] duration-(--duration-slow,300ms) ease-(--easing-spring,ease-out)',
        className,
      )}
      style={drag ? { left: drag.x, top: drag.y, translate: '-50% -50%' } : undefined}
      {...props}
    >
      <div
        ref={bar}
        role="toolbar"
        aria-label={labels.toolbar}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        onKeyDown={roving}
        className={cn(
          'relative flex items-center gap-0.5 rounded-xl border bg-background/90 p-1 shadow-lg backdrop-blur',
          vertical && 'flex-col',
        )}
      >
        {plate && (
          <span
            aria-hidden="true"
            className="absolute rounded-lg bg-primary transition-[left,top,width,height] duration-(--duration-normal,200ms) ease-(--easing-emphasized,ease-out) motion-reduce:transition-none"
            style={{ left: plate.x, top: plate.y, width: plate.w, height: plate.h }}
          />
        )}
        <button
          type="button"
          data-tool-button=""
          tabIndex={-1}
          aria-label={labels.move}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return
            event.currentTarget.setPointerCapture?.(event.pointerId)
            dragFrom.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY }
          }}
          onPointerMove={(event) => {
            const parent = bar.current?.parentElement?.offsetParent
            if (!dragFrom.current || !parent) return
            const box = parent.getBoundingClientRect()
            setDrag({ x: event.clientX - box.left, y: event.clientY - box.top })
          }}
          onPointerUp={(event) => {
            const parent = bar.current?.parentElement?.offsetParent
            dragFrom.current = null
            if (drag && parent) {
              const box = parent.getBoundingClientRect()
              moveTo(
                nearestEdge(
                  event.clientX - box.left,
                  event.clientY - box.top,
                  box.width,
                  box.height,
                ),
              )
            }
            setDrag(null)
          }}
          onKeyDown={(event) => {
            const to: Record<string, ToolbarEdge> = {
              ArrowUp: 'top',
              ArrowDown: 'bottom',
              ArrowLeft: 'left',
              ArrowRight: 'right',
            }
            const next = to[event.key]
            if (!next || !event.shiftKey) return
            event.preventDefault()
            event.stopPropagation()
            moveTo(next)
          }}
          className="relative z-10 flex size-8 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing pointer-coarse:size-10 [&_svg]:size-4"
        >
          <GripIcon aria-hidden="true" />
        </button>
        <span
          aria-hidden="true"
          className={cn('bg-border', vertical ? 'mx-1.5 h-px w-5' : 'my-1.5 h-5 w-px')}
        />
        {tools.map((tool) => {
          const face = faceOf(tool)
          const on = tool.id === activeTool?.id
          const button = (
            <button
              type="button"
              data-tool-button=""
              tabIndex={on ? 0 : -1}
              aria-pressed={on}
              aria-label={face.label}
              aria-keyshortcuts={face.shortcut}
              onClick={() => pick(face.id)}
              className={cn(
                'relative z-10 flex size-8 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10 [&_svg]:size-4',
                on
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {face.icon}
            </button>
          )
          return (
            <div
              key={tool.id}
              data-tool={tool.id}
              className={cn('relative flex', vertical && 'flex-col')}
            >
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                  side={
                    vertical
                      ? side === 'left'
                        ? 'right'
                        : 'left'
                      : side === 'top'
                        ? 'bottom'
                        : 'top'
                  }
                  className="flex items-center gap-2"
                >
                  {face.label}
                  {face.shortcut && <Kbd>{face.shortcut.toUpperCase()}</Kbd>}
                </TooltipContent>
              </Tooltip>
              {tool.variants && (
                <Popover>
                  <PopoverTrigger
                    data-tool-button=""
                    tabIndex={-1}
                    aria-label={labels.more(tool.label)}
                    className={cn(
                      'absolute z-20 size-2.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring after:absolute after:-inset-2',
                      vertical ? 'right-0 bottom-0' : 'right-0 bottom-0',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute right-0.5 bottom-0.5 size-0 border-4 border-transparent',
                        on
                          ? 'border-r-primary-foreground border-b-primary-foreground'
                          : 'border-r-muted-foreground border-b-muted-foreground',
                      )}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    side={
                      vertical
                        ? side === 'left'
                          ? 'right'
                          : 'left'
                        : side === 'top'
                          ? 'bottom'
                          : 'top'
                    }
                    className="flex w-auto gap-0.5 p-1"
                  >
                    {tool.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={current === v.id}
                        aria-label={v.label}
                        onClick={() => {
                          setFaces((f) => ({ ...f, [tool.id]: v.id }))
                          pick(v.id)
                        }}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground pointer-coarse:size-10 [&_svg]:size-4"
                      >
                        {v.icon}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { Toolbar }
