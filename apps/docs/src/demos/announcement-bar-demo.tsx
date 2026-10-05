import { useState } from 'react'
import { AnnouncementBar } from '@/ui/announcement-bar'
import { Button } from '@/ui/button'

// Three days from whenever the page is opened, so the demo always has something to count.
const launch = Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000

export default function AnnouncementBarDemo() {
  const [key, setKey] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="w-full overflow-hidden rounded-lg border">
        <AnnouncementBar
          key={key}
          onDismiss={() => setDismissed(true)}
          messages={[
            <>
              Version 2 is here. <a href="#v2">See what is new</a>
            </>,
            <>Early bird pricing ends soon</>,
            <>
              We are hiring designers. <a href="#jobs">Open roles</a>
            </>,
          ]}
          countdownTo={launch}
        />
        <div className="flex h-28 items-center justify-center bg-background text-muted-foreground text-sm">
          Your page
        </div>
      </div>
      {dismissed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDismissed(false)
            setKey(key + 1)
          }}
        >
          Show it again
        </Button>
      )}
    </div>
  )
}
