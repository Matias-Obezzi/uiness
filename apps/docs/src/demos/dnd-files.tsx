import { useDropZone } from '@uiness/dnd'
import { UploadIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DndFiles() {
  const [files, setFiles] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const zone = useDropZone({
    accept: 'image/*',
    onDrop: (list) => setFiles((all) => [...all, ...list.map((f) => f.name)]),
    onReject: (list) => setRejected(list.map((f) => f.name)),
  })
  return (
    <div className="w-full space-y-3">
      <div
        {...zone.getZoneProps()}
        className={cn(
          'flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground text-sm transition-colors',
          zone.isOver && 'border-primary bg-primary/5 text-foreground',
        )}
      >
        <input {...zone.getInputProps()} />
        <UploadIcon />
        <p>Drop images here</p>
        <Button size="sm" variant="outline" onClick={zone.open}>
          Or browse
        </Button>
      </div>
      {files.length > 0 && <p className="text-sm">Added: {files.join(', ')}</p>}
      {rejected.length > 0 && (
        <p className="text-destructive text-sm">Not an image: {rejected.join(', ')}</p>
      )}
    </div>
  )
}
