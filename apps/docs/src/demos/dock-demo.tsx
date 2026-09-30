import {
  Calendar,
  Compass,
  Image,
  Mail,
  MessageCircle,
  Music,
  NotebookPen,
  Settings,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Dock, DockItem, DockSeparator } from '@/ui/dock'

const apps = [
  { label: 'Browser', icon: Compass, tint: 'from-sky-400 to-blue-600' },
  { label: 'Mail', icon: Mail, tint: 'from-cyan-400 to-sky-600' },
  { label: 'Messages', icon: MessageCircle, tint: 'from-emerald-400 to-green-600' },
  { label: 'Music', icon: Music, tint: 'from-rose-400 to-pink-600' },
  { label: 'Photos', icon: Image, tint: 'from-amber-300 to-orange-500' },
  { label: 'Calendar', icon: Calendar, tint: 'from-red-400 to-rose-600' },
  { label: 'Notes', icon: NotebookPen, tint: 'from-yellow-300 to-amber-500' },
  { label: 'Settings', icon: Settings, tint: 'from-zinc-400 to-zinc-600' },
]

export default function DockDemo() {
  const [running, setRunning] = useState(() => new Set(['Browser', 'Mail']))

  const open = (label: string) => setRunning((prev) => new Set(prev).add(label))

  return (
    <div className="flex h-72 w-full items-end justify-center pb-4">
      <Dock>
        {apps.map(({ label, icon: Icon, tint }) => (
          <DockItem
            key={label}
            label={label}
            active={running.has(label)}
            onClick={() => open(label)}
            className={`bg-linear-to-b text-white ${tint}`}
          >
            <Icon strokeWidth={1.75} />
          </DockItem>
        ))}
        <DockSeparator />
        <DockItem label="Trash" onClick={() => setRunning(new Set())}>
          <Trash2 strokeWidth={1.75} />
        </DockItem>
      </Dock>
    </div>
  )
}
