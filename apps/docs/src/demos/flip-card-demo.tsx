import { Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { FlipCard, FlipCardBack, FlipCardFront } from '@/ui/flip-card'

const features = ['Unlimited projects', 'Custom domains', 'Priority support', 'Team seats']

export default function FlipCardDemo() {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <FlipCard aria-label="Ada Lovelace, profile" className="h-72 w-52">
        <FlipCardFront className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <img
            src="/img/gallery-1.png"
            alt=""
            className="size-20 rounded-full object-cover ring-4 ring-muted"
          />
          <div>
            <p className="font-semibold">Ada Lovelace</p>
            <p className="text-muted-foreground text-sm">Analyst</p>
          </div>
          <p className="mt-auto text-caption text-muted-foreground">Hover to turn</p>
        </FlipCardFront>
        <FlipCardBack className="flex flex-col justify-between bg-primary p-6 text-primary-foreground">
          <p className="text-sm leading-relaxed">
            Wrote the first program for a machine that did not exist yet, and saw it could do far
            more than sums.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['1843', 'Notes'],
              ['1st', 'Program'],
              ['∞', 'Ideas'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-semibold text-lg">{value}</p>
                <p className="text-xs opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </FlipCardBack>
      </FlipCard>

      <FlipCard trigger="click" aria-label="Pro plan" className="h-72 w-52">
        <FlipCardFront className="flex flex-col p-6">
          <span className="text-eyebrow text-muted-foreground uppercase">Pro</span>
          <p className="mt-3 font-bold text-4xl tracking-tight">
            $12<span className="font-normal text-base text-muted-foreground">/mo</span>
          </p>
          <p className="mt-2 text-muted-foreground text-sm">For people shipping every week.</p>
          <p className="mt-auto text-caption text-muted-foreground">Click to see what is in it</p>
        </FlipCardFront>
        <FlipCardBack className="flex flex-col gap-3 p-6">
          <span className="text-eyebrow text-muted-foreground uppercase">Included</span>
          <ul className="space-y-2.5 text-sm">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </FlipCardBack>
      </FlipCard>

      <div className="flex flex-col items-center gap-3">
        <FlipCard
          trigger="manual"
          direction="vertical"
          flipped={flipped}
          className="h-[15.75rem] w-52"
        >
          <FlipCardFront className="overflow-hidden">
            <img src="/img/gallery-3.png" alt="" className="h-32 w-full object-cover" />
            <div className="p-4">
              <p className="font-semibold">Morning bowl</p>
              <p className="text-muted-foreground text-sm">Ten minutes, no stove.</p>
            </div>
          </FlipCardFront>
          <FlipCardBack className="p-4">
            <p className="font-semibold">You need</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground text-sm">
              <li>Oats and yoghurt</li>
              <li>A handful of berries</li>
              <li>Honey, to taste</li>
              <li>Toasted seeds</li>
            </ul>
          </FlipCardBack>
        </FlipCard>
        <Button size="sm" variant="outline" onClick={() => setFlipped((f) => !f)}>
          <RotateCcw />
          {flipped ? 'Show the dish' : 'Show the recipe'}
        </Button>
      </div>
    </div>
  )
}
