import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export default function ToastMore() {
  const [archived, setArchived] = useState(0)
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={async () => {
          setArchived((n) => n + 1)
          if (await toast.undo('Message archived')) setArchived((n) => n - 1)
        }}
      >
        Archive ({archived})
      </Button>
      <Button variant="outline" onClick={() => toast.error('Could not reach the server')}>
        Fail (click a few times)
      </Button>
      <Button
        variant="outline"
        onClick={() => toast('Draft saved', { progress: true, duration: 6000 })}
      >
        With a progress bar
      </Button>
    </div>
  )
}
