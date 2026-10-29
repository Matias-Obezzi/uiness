import {
  CircleIcon,
  EraserIcon,
  HandIcon,
  HighlighterIcon,
  MousePointer2Icon,
  PencilIcon,
  SquareIcon,
  TypeIcon,
} from 'lucide-react'
import { useState } from 'react'
import { type Tool, Toolbar } from '@/components/ui/toolbar'

const tools: Tool[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2Icon />, shortcut: 'v' },
  { id: 'hand', label: 'Hand', icon: <HandIcon />, shortcut: 'h' },
  {
    id: 'draw',
    label: 'Draw',
    icon: <PencilIcon />,
    variants: [
      { id: 'pencil', label: 'Pencil', icon: <PencilIcon />, shortcut: 'p' },
      { id: 'highlighter', label: 'Highlighter', icon: <HighlighterIcon />, shortcut: 'i' },
      { id: 'eraser', label: 'Eraser', icon: <EraserIcon />, shortcut: 'e' },
    ],
  },
  {
    id: 'shape',
    label: 'Shape',
    icon: <SquareIcon />,
    variants: [
      { id: 'rectangle', label: 'Rectangle', icon: <SquareIcon />, shortcut: 'r' },
      { id: 'ellipse', label: 'Ellipse', icon: <CircleIcon />, shortcut: 'o' },
    ],
  },
  { id: 'text', label: 'Text', icon: <TypeIcon />, shortcut: 't' },
]

export default function ToolbarDemo() {
  const [tool, setTool] = useState('select')
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:16px_16px]">
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground text-sm">
        {tool} · drag the grip to any edge
      </p>
      <Toolbar tools={tools} value={tool} onValueChange={setTool} />
    </div>
  )
}
