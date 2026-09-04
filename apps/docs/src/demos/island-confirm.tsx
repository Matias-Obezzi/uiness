import { useState } from 'react'
import { Button } from '@/ui/button'
import { island } from '@/ui/island'

export default function IslandConfirm() {
  const [result, setResult] = useState('')
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="destructive"
        onClick={async () => {
          const ok = await island.confirm({
            title: 'Delete 3 photos?',
            description: 'They will be removed from all your devices.',
            confirmText: 'Delete',
            destructive: true,
          })
          setResult(ok ? 'Deleted' : 'Kept')
        }}
      >
        Delete photos
      </Button>
      <span className="text-muted-foreground text-sm">{result}</span>
    </div>
  )
}
