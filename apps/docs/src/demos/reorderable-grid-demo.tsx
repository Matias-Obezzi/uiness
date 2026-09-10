import { useState } from 'react'
import { ReorderableGrid, ReorderableGridItem } from '@/ui/reorderable-grid'

const APPS = {
  mail: { label: 'Mail', emoji: '✉️' },
  calendar: { label: 'Calendar', emoji: '📅' },
  notes: { label: 'Notes', emoji: '📝' },
  camera: { label: 'Camera', emoji: '📷' },
  music: { label: 'Music', emoji: '🎧' },
  maps: { label: 'Maps', emoji: '🗺️' },
  weather: { label: 'Weather', emoji: '⛅' },
  clock: { label: 'Clock', emoji: '⏰' },
}

const app = (id: string) => APPS[id as keyof typeof APPS]

export default function ReorderableGridDemo() {
  const [order, setOrder] = useState(Object.keys(APPS))

  return (
    <div className="w-full max-w-md space-y-3">
      <ReorderableGrid items={order} onReorder={setOrder} columns={4}>
        {(id) => (
          <ReorderableGridItem key={id} id={id}>
            <span aria-hidden="true" className="text-2xl">
              {app(id).emoji}
            </span>
            <span className="text-xs">{app(id).label}</span>
          </ReorderableGridItem>
        )}
      </ReorderableGrid>
      <p className="text-muted-foreground text-sm">
        Drag a tile anywhere, or use the keyboard: Tab to a tile, Space to pick it up, left and
        right for a cell and up and down for a whole row, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
