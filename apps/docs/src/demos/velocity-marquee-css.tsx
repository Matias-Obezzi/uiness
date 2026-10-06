import { VelocityMarquee } from '@/ui/velocity-marquee'

const rows = [
  ['No', 'JavaScript', 'while', 'scrolling'],
  ['Pushed', 'by', 'the', 'page'],
]

export default function VelocityMarqueeCss() {
  return (
    <VelocityMarquee
      driver="css"
      baseVelocity={40}
      sensitivity={1.5}
      className="-mx-8 w-[calc(100%+4rem)] gap-2 py-4"
      style={{
        maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
      }}
    >
      {rows.map((words) => (
        <span
          key={words[0]}
          className="flex items-center gap-6 pr-6 font-black text-5xl uppercase tracking-tighter"
        >
          {words.map((word) => (
            <span key={word}>{word}</span>
          ))}
          <span aria-hidden className="text-3xl text-muted-foreground/40">
            ✦
          </span>
        </span>
      ))}
    </VelocityMarquee>
  )
}
