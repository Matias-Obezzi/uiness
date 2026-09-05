import { Reveal } from '@/ui/reveal'

const steps = ['Install the item', 'Import the component', 'Scroll and watch', 'Tweak the variant']

export default function RevealDemo() {
  return (
    <Reveal stagger={120} repeat className="grid w-full gap-3 sm:grid-cols-2">
      {steps.map((step, i) => (
        <div key={step} className="rounded-xl border p-4">
          <span className="text-muted-foreground text-xs">Step {i + 1}</span>
          <p className="font-medium">{step}</p>
        </div>
      ))}
    </Reveal>
  )
}
