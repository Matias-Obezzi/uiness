import { useSortable } from '@uiness/dnd'
import { useState } from 'react'

const TRACKS: Record<string, string> = {
  sunlit: 'Sunlit — Mildlife',
  nightcall: 'Nightcall — Kavinsky',
  weightless: 'Weightless — Marconi Union',
  'the-rip': 'The Rip — Portishead',
}

export default function DndDemo() {
  const [ids, setIds] = useState(Object.keys(TRACKS))
  const sortable = useSortable({ items: ids, onReorder: setIds })

  return (
    <div className="w-full max-w-sm space-y-3">
      <ul {...sortable.getListProps()} className="flex list-none flex-col gap-2 p-0">
        {sortable.items.map((id) => (
          <li
            key={id}
            {...sortable.getItemProps(id)}
            {...sortable.getHandleProps(id)}
            className="cursor-grab rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging]:border-ring data-[dragging]:bg-accent"
          >
            {TRACKS[id]}
          </li>
        ))}
      </ul>
      <div {...sortable.getLiveRegionProps()}>{sortable.announcement}</div>
      <p className="text-muted-foreground text-sm">
        Nothing here is styled by the hook. Drag a row, or Tab to it, Space to pick it up, the arrow
        keys to move it, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
