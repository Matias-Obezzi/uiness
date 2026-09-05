import { Marquee } from '@/ui/marquee'

const quotes = [
  { name: 'Ada', text: 'Finally a marquee that pauses when I want to read it.' },
  { name: 'Grace', text: 'No animation library, and it still looks this smooth.' },
  { name: 'Alan', text: 'The copies are hidden from screen readers. Nice touch.' },
  { name: 'Linus', text: 'It just scrolls. That is all I wanted.' },
]

export default function MarqueeDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Marquee duration={30}>
        {quotes.map((q) => (
          <figure key={q.name} className="w-64 rounded-xl border bg-card p-4">
            <blockquote className="text-sm">{q.text}</blockquote>
            <figcaption className="mt-2 text-muted-foreground text-xs">{q.name}</figcaption>
          </figure>
        ))}
      </Marquee>
      <Marquee duration={30} reverse>
        {quotes.map((q) => (
          <figure key={q.name} className="w-64 rounded-xl border bg-card p-4">
            <blockquote className="text-sm">{q.text}</blockquote>
            <figcaption className="mt-2 text-muted-foreground text-xs">{q.name}</figcaption>
          </figure>
        ))}
      </Marquee>
    </div>
  )
}
