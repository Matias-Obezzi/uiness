import { useDraggable } from '@uiness/dnd'

export default function DndDraggable() {
  const drag = useDraggable({ id: 'pin', bounds: 'parent' })
  const element = drag.getElementProps()
  const handle = drag.getHandleProps()

  return (
    <div className="w-full space-y-3">
      <div className="relative h-56 w-full overflow-hidden rounded-xl border bg-muted/30">
        <div
          {...element}
          {...handle}
          // The pin is its own handle, so both getters land on one element and both carry a
          // `style`. Spreading them would leave only the second, and the offset lives in the
          // first: the drag would run with nothing to show for it.
          style={{ ...element.style, ...handle.style }}
          className="absolute top-4 left-4 cursor-grab rounded-full border bg-background px-3 py-1.5 font-medium text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging]:border-ring data-[dragging]:shadow-lg"
        >
          Café Rivas
        </div>
        <div {...drag.getLiveRegionProps()}>{drag.announcement}</div>
      </div>
      <p className="text-muted-foreground text-sm">
        The pin stays inside the box. Drag it, or Tab to it, Space to pick it up, the arrow keys to
        move it, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
