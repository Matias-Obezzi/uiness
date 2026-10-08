import { Button } from '@/components/ui/button'
import { island } from '@/components/ui/island'

export default function IslandProgress() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => {
          const upload = island.progress({ content: 'Uploading video', value: 0 })
          let value = 0
          const step = setInterval(() => {
            value += 0.1
            if (value < 1) return upload.set(value)
            clearInterval(step)
            upload.done({ content: 'Uploaded' })
          }, 300)
        }}
      >
        Upload
      </Button>
      <Button variant="outline" onClick={() => island.timer({ content: 'Focus', seconds: 25 })}>
        Start a 25 s timer
      </Button>
    </div>
  )
}
