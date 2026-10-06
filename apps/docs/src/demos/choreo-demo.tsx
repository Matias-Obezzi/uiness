import { LayersIcon, RotateCcwIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Choreo } from '@/components/ui/choreo'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const features = [
  {
    icon: SparklesIcon,
    title: 'Reads the page',
    text: 'Headings, copy, images, cards and grids are told apart from the markup and the styles.',
  },
  {
    icon: LayersIcon,
    title: 'Cascades',
    text: 'Whatever arrives together comes in one after another, in reading order.',
  },
  {
    icon: ZapIcon,
    title: 'Stays out of the way',
    text: 'Transforms are added, never replaced, and every trace goes when it stops.',
  },
]

export default function ChoreoDemo() {
  const [run, setRun] = useState(0)
  const [debug, setDebug] = useState(false)

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="choreo-debug" checked={debug} onCheckedChange={setDebug} />
          <Label htmlFor="choreo-debug">Show what it found</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          <RotateCcwIcon /> Replay
        </Button>
      </div>

      <Choreo key={run} debug={debug} className="overflow-hidden rounded-xl border bg-background">
        <section className="space-y-5 px-6 pt-14 pb-10 text-center">
          <span className="inline-block rounded-full border px-3 py-1 text-caption text-muted-foreground">
            No markup changes
          </span>
          <h2 className="mx-auto max-w-lg text-display">Pages that move like they mean it</h2>
          <p className="mx-auto max-w-md text-lead text-muted-foreground">
            One component looks at what is already there and gives every piece an entrance.
          </p>
          <div className="flex justify-center gap-3">
            <Button>Get started</Button>
            <Button variant="outline">Read the docs</Button>
          </div>
        </section>

        <div className="grid grid-cols-3 border-y text-center">
          {[
            ['12,500+', 'teams'],
            ['99.9%', 'uptime'],
            ['4.8', 'rating'],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-6">
              <div className="font-bold text-3xl tabular-nums tracking-tight">{value}</div>
              <div className="text-caption text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-5 shadow-xs">
              <Icon className="mb-3 size-5 text-muted-foreground" />
              <h3 className="text-subheading">{title}</h3>
              <p className="mt-1 text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>

        <div className="grid items-center gap-8 px-6 pb-8 sm:grid-cols-2">
          <img
            src="/img/photo.png"
            alt=""
            className="aspect-video w-full rounded-xl object-cover"
          />
          <div className="space-y-3">
            <h3 className="text-heading">Media slides in from its side</h3>
            <p className="text-muted-foreground">
              An image beside text in a two column row comes in from the edge it sits on. Alone, it
              settles in from a slight zoom.
            </p>
          </div>
        </div>

        <hr className="mx-6" />

        <blockquote className="px-6 py-10 text-center text-lead italic">
          “We turned it on and the landing page finally felt finished.”
        </blockquote>
      </Choreo>
    </div>
  )
}
