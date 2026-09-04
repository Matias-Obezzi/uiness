import { BellIcon } from 'lucide-react'
import { Button } from '@/ui/button'
import { island } from '@/ui/island'

export default function IslandAlert() {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() =>
          island.alert({
            title: 'AirPods Pro',
            description: 'Connected, battery 82%',
            icon: <BellIcon className="size-4" />,
          })
        }
      >
        Expanded alert
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          island.alert({ title: 'Copied', icon: '📋', mode: 'compact', duration: 2000 })
        }
      >
        Compact alert
      </Button>
    </div>
  )
}
