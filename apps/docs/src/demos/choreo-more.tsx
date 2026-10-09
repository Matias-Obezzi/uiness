import { LogOutIcon, RotateCcwIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useChoreo } from '@/components/ui/choreo'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const steps = [
  ['Plan', 'Sketch what the page has to say.'],
  ['Build', 'Write the markup, nothing more.'],
  ['Ship', 'Every piece comes in on its own.'],
]

export default function ChoreoMore() {
  const ref = useRef<HTMLDivElement>(null)
  const [scrub, setScrub] = useState(false)
  const [entered, setEntered] = useState(0)
  const choreo = useChoreo({
    root: ref,
    scrub,
    effects: { heading: 'words' },
    onEnter: () => setEntered((n) => n + 1),
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="choreo-scrub" checked={scrub} onCheckedChange={setScrub} />
          <Label htmlFor="choreo-scrub">Scrub with the scroll</Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm tabular-nums">{entered} in</span>
          <Button variant="outline" size="sm" disabled={scrub} onClick={() => choreo.leave()}>
            <LogOutIcon /> Leave
          </Button>
          <Button variant="outline" size="sm" onClick={() => choreo.replay()}>
            <RotateCcwIcon /> Replay
          </Button>
        </div>
      </div>

      <div
        ref={ref}
        className="h-96 space-y-16 overflow-y-auto rounded-xl border bg-background p-6"
      >
        <section className="space-y-3 text-center">
          <h2 className="mx-auto max-w-md text-display">Every word arrives on its own</h2>
          <p className="mx-auto max-w-sm text-muted-foreground">
            Headings come in word by word here. Scroll down for cards that flip and tilt in.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, text]) => (
            <div key={title} data-choreo="flip" className="rounded-xl border bg-card p-5 shadow-xs">
              <h3 className="text-subheading">{title}</h3>
              <p className="mt-1 text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-heading">Tilted into place</h2>
          {steps.map(([title, text]) => (
            <p key={title} data-choreo="rotate" className="rounded-lg border p-4 text-sm">
              <strong>{title}.</strong> {text}
            </p>
          ))}
        </section>

        <h2 className="pb-24 text-center text-heading">That is the whole page</h2>
      </div>
    </div>
  )
}
