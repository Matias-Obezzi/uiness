import { TextReveal } from '@/ui/text-reveal'

const manifesto =
  'We believe interfaces should feel like they were made by people who care. Every pixel earns its place, every motion has a reason, and nothing moves just because it can. Build less, polish more, and ship the thing you would want to use yourself.'

export default function TextRevealDemo() {
  return (
    <div
      className="h-[360px] w-full overflow-y-auto rounded-lg"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      <div className="flex h-[260px] flex-col items-center justify-end pb-6 text-muted-foreground text-sm">
        <span>Scroll inside the box</span>
        <span aria-hidden className="mt-1 animate-bounce motion-reduce:animate-none">
          ↓
        </span>
      </div>
      <div className="mx-auto max-w-xl px-2">
        <p className="mb-4 text-eyebrow text-muted-foreground uppercase">Manifesto</p>
        <TextReveal
          text={manifesto}
          className="font-semibold text-2xl tracking-tight sm:text-3xl"
        />
      </div>
      <div className="h-[300px]" />
    </div>
  )
}
