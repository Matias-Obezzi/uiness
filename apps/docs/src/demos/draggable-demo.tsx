import { useState } from 'react'
import { Draggable, DraggableHandle, type Point } from '@/ui/draggable'

export default function DraggableDemo() {
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })

  return (
    <div className="w-full space-y-3">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border bg-muted/30">
        <Draggable
          id="player"
          bounds="parent"
          withHandle
          defaultPosition={{ x: 24, y: 24 }}
          onPositionChange={setPosition}
          className="w-56"
        >
          <DraggableHandle>Now playing</DraggableHandle>
          <div className="space-y-1 p-3 text-sm">
            <p className="font-medium">Sunlit</p>
            <p className="text-muted-foreground text-xs">Mildlife · Automatic</p>
            <p className="pt-2 font-mono text-muted-foreground text-xs tabular-nums">
              x {Math.round(position.x)} · y {Math.round(position.y)}
            </p>
          </div>
        </Draggable>
      </div>
      <p className="text-muted-foreground text-sm">
        Drag the panel by its bar, or use the keyboard: Tab to the bar, Space to pick it up, the
        arrow keys to move it 20px at a time, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
