import { SettingsIcon } from 'lucide-react'
import { Button } from '@/ui/button'

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Settings">
        <SettingsIcon />
      </Button>
    </div>
  )
}
