import { HoverHighlight, HoverHighlightItem } from '@/ui/hover-highlight'

const items = [
  { title: 'Spotlight', body: 'A light that follows the pointer.' },
  { title: 'Marquee', body: 'Content that scrolls forever.' },
  { title: 'Tilt', body: 'A card that leans towards you.' },
  { title: 'Reveal', body: 'Things that arrive when you scroll.' },
  { title: 'Compare', body: 'Before and after with a divider.' },
  { title: 'Ticker', body: 'Numbers that count up.' },
]

export default function HoverHighlightDemo() {
  return (
    <HoverHighlight className="grid w-full gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <HoverHighlightItem key={item.title} className="rounded-xl p-4">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="mt-1 text-muted-foreground text-sm">{item.body}</p>
        </HoverHighlightItem>
      ))}
    </HoverHighlight>
  )
}
