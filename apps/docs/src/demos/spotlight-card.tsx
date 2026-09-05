import { SpotlightCard } from '@/ui/spotlight'

const features = [
  { title: 'Fast', body: 'Nothing but a radial gradient and two CSS variables.' },
  { title: 'Themed', body: 'The glow takes the primary color unless you say otherwise.' },
  { title: 'Independent', body: 'Every card tracks the pointer on its own.' },
]

export default function SpotlightCardDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {features.map((f) => (
        <SpotlightCard key={f.title}>
          <div className="p-5">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-muted-foreground text-sm">{f.body}</p>
          </div>
        </SpotlightCard>
      ))}
    </div>
  )
}
