import { TracingBeam } from '@/ui/tracing-beam'

const sections = [
  {
    title: 'The line lights up as you read',
    body: 'Scroll this page and the beam on the left grows with you, the dot at the top turning on as soon as you start.',
  },
  {
    title: 'Anchored to your reading position',
    body: 'By default the lit part reaches sixty percent of the way down the screen, about where your eyes are.',
  },
  {
    title: 'Plain elements',
    body: 'A border colored line, a gradient over it and a dot. No SVG path math, nothing to measure but the height.',
  },
]

export default function TracingBeamDemo() {
  return (
    <TracingBeam className="w-full max-w-xl">
      <div className="flex flex-col gap-10 py-2">
        {sections.map((s) => (
          <section key={s.title}>
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-6">{s.body}</p>
          </section>
        ))}
      </div>
    </TracingBeam>
  )
}
