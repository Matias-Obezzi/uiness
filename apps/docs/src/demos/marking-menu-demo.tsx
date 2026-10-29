import { CircleIcon, MinusIcon, PencilIcon, SquareIcon, TriangleIcon, TypeIcon } from 'lucide-react'
import { useState } from 'react'
import { MarkingMenu } from '@/components/ui/marking-menu'

const items = [
  { id: 'pen', label: 'Pen', icon: <PencilIcon /> },
  { id: 'square', label: 'Square', icon: <SquareIcon /> },
  { id: 'circle', label: 'Circle', icon: <CircleIcon /> },
  { id: 'text', label: 'Text', icon: <TypeIcon /> },
  { id: 'line', label: 'Line', icon: <MinusIcon /> },
  { id: 'triangle', label: 'Triangle', icon: <TriangleIcon /> },
]

export default function MarkingMenuDemo() {
  const [tool, setTool] = useState('pen')
  const current = items.find((i) => i.id === tool)
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <MarkingMenu aria-label="Tools" items={items} onSelect={setTool}>
        {current?.icon}
      </MarkingMenu>
      <p className="text-muted-foreground text-sm">
        {current?.label} · hold and move, flick, or tap
      </p>
    </div>
  )
}
