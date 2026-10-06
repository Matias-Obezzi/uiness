import { MinusIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { UsageMeter } from '@/components/ui/usage-meter'

export default function UsageMeterDemo() {
  const [video, setVideo] = React.useState(18)
  const segments = [
    { key: 'images', label: 'Images', value: 21.4 },
    { key: 'video', label: 'Video', value: video },
    { key: 'docs', label: 'Documents', value: 6.2 },
    { key: 'other', label: 'Other', value: 2.9 },
  ]
  return (
    <div className="grid w-full max-w-md gap-5">
      <UsageMeter
        label="Workspace storage"
        segments={segments}
        limit={100}
        format={(n) => `${n.toFixed(1)} GB`}
      />
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Remove 15 GB of video"
          onClick={() => setVideo((v) => Math.max(0, v - 15))}
        >
          <MinusIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Upload 15 GB of video"
          onClick={() => setVideo((v) => v + 15)}
        >
          <PlusIcon />
        </Button>
        15 GB of video
      </div>
    </div>
  )
}
