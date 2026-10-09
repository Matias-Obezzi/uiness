import { TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { island } from '@/components/ui/island'

export default function IslandUndo() {
  const [tasks, setTasks] = useState(['Write the brief', 'Book the venue', 'Send invites'])
  return (
    <ul className="flex w-full max-w-sm flex-col gap-2">
      {tasks.map((task, i) => (
        <li key={task} className="flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="text-sm">{task}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${task}`}
            onClick={async () => {
              setTasks((list) => list.filter((t) => t !== task))
              const undone = await island.undo('Task deleted', { icon: <TrashIcon size={16} /> })
              if (undone) setTasks((list) => [...list.slice(0, i), task, ...list.slice(i)])
            }}
          >
            <TrashIcon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
