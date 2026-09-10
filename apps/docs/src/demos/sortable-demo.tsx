import { useState } from 'react'
import { Sortable, SortableHandle, SortableItem } from '@/ui/sortable'

const TASKS = {
  'design-review': { title: 'Design review', meta: 'Thursday · Ana' },
  'ship-registry': { title: 'Ship the registry', meta: 'Blocked on the docs' },
  'write-tests': { title: 'Write the drag tests', meta: 'In progress' },
  'update-changelog': { title: 'Update the changelog', meta: '5 entries pending' },
  'cut-release': { title: 'Cut 0.1.0', meta: 'After the review' },
}

const task = (id: string) => TASKS[id as keyof typeof TASKS]

export default function SortableDemo() {
  const [order, setOrder] = useState(Object.keys(TASKS))

  return (
    <div className="w-full max-w-sm space-y-3">
      <Sortable items={order} onReorder={setOrder} withHandle>
        {(id) => (
          <SortableItem key={id} id={id} className="py-2.5">
            <SortableHandle />
            <span className="flex-1">
              <span className="block font-medium">{task(id).title}</span>
              <span className="block text-muted-foreground text-xs">{task(id).meta}</span>
            </span>
          </SortableItem>
        )}
      </Sortable>
      <p className="text-muted-foreground text-sm">
        Drag a row by its grip, or use the keyboard: Tab to a row, Space to pick it up, the up and
        down arrows to move it, Space to drop it, Escape to put it back.
      </p>
    </div>
  )
}
