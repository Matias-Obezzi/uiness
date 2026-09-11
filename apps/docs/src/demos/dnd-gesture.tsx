import { useDragGesture } from '@uiness/dnd'
import { useRef, useState } from 'react'

const MIN = 160
const MAX = 420

export default function DndGesture() {
  const [width, setWidth] = useState(260)
  const start = useRef(width)
  const gesture = useDragGesture({
    axis: 'x',
    onStart: () => {
      start.current = width
    },
    onMove: ({ delta }) => setWidth(Math.min(MAX, Math.max(MIN, start.current + delta.x))),
    onCancel: () => setWidth(start.current),
  })

  return (
    <div className="w-full space-y-3">
      <div className="flex h-40 w-full overflow-hidden rounded-xl border">
        <div
          style={{ width }}
          className="flex shrink-0 items-center justify-center bg-muted/40 font-mono text-muted-foreground text-sm tabular-nums"
        >
          {Math.round(width)}px
        </div>
        <div
          {...gesture.getHandleProps()}
          // The bar reads as 6px but is grabbed from 26: a divider you have to aim at is a
          // divider that feels broken. The pseudo element widens the target, not the look.
          className='relative w-1.5 shrink-0 cursor-col-resize bg-border outline-none transition-colors after:absolute after:-inset-x-2.5 after:inset-y-0 after:content-[""] hover:bg-ring focus-visible:bg-ring data-[dragging]:bg-ring'
        >
          <span className="sr-only">Resize the panel</span>
        </div>
        <div className="flex-1 p-4 text-muted-foreground text-sm">
          The hook only reports deltas. Turning one into a width is your job.
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Drag the divider, or Tab to it, Space to pick it up, left and right to resize 20px at a
        time, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
