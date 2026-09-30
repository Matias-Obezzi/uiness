import { VelocityMarquee } from '@/ui/velocity-marquee'

const first = ['Design', 'Build', 'Ship', 'Repeat']
const second = ['Scroll', 'Faster', 'Then', 'Back', 'Up']

function Words({ words, outline }: { words: string[]; outline?: boolean }) {
  return (
    <span className="flex items-center gap-8 font-black text-6xl uppercase tracking-tighter">
      {words.map((word) => (
        <span key={word} className="flex items-center gap-8">
          <span
            className={
              outline ? 'text-transparent [-webkit-text-stroke:1.5px_var(--foreground)]' : undefined
            }
          >
            {word}
          </span>
          <span aria-hidden className="text-muted-foreground/40 text-4xl">
            ✦
          </span>
        </span>
      ))}
    </span>
  )
}

export default function VelocityMarqueeDemo() {
  return (
    <VelocityMarquee
      baseVelocity={60}
      gap="2rem"
      className="-mx-8 w-[calc(100%+4rem)] gap-2 py-4"
      style={{
        maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
      }}
    >
      <Words words={first} />
      <Words words={second} outline />
    </VelocityMarquee>
  )
}
