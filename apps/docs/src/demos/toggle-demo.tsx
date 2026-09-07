import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'
import { Toggle } from '@/ui/toggle'

export default function ToggleDemo() {
  return (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Bold">
        <BoldIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Italic">
        <ItalicIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Underline" defaultPressed>
        <UnderlineIcon />
        Underline
      </Toggle>
      <Toggle aria-label="Disabled" disabled>
        <BoldIcon />
      </Toggle>
    </div>
  )
}
