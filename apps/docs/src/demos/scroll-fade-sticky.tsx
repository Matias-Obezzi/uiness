import { ScrollFade } from '@/ui/scroll-fade'

const people = {
  A: ['Ada Lovelace', 'Alan Kay', 'Anita Borg'],
  B: ['Barbara Liskov', 'Bjarne Stroustrup', 'Brian Kernighan'],
  D: ['Dennis Ritchie', 'Donald Knuth'],
  E: ['Edsger Dijkstra', 'Evelyn Boyd Granville'],
  G: ['Grace Hopper', 'Guido van Rossum'],
  J: ['John McCarthy', 'Joan Clarke'],
  K: ['Ken Thompson', 'Katherine Johnson'],
  L: ['Linus Torvalds', 'Lynn Conway'],
  M: ['Margaret Hamilton', 'Mary Kenneth Keller'],
}

export default function ScrollFadeSticky() {
  return (
    // The border sits on a wrapper: the mask fades everything on the scroller, borders too.
    <div className="w-full max-w-xs overflow-hidden rounded-xl border bg-card">
      <ScrollFade className="h-72" size={40}>
        {Object.entries(people).map(([letter, names]) => (
          <section key={letter}>
            <p
              data-scroll-fade-sticky
              className="sticky top-0 z-10 border-b bg-card px-4 py-1.5 font-medium text-muted-foreground text-xs"
            >
              {letter}
            </p>
            <ul className="px-4">
              {names.map((name) => (
                <li key={name} className="py-2 text-sm">
                  {name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </ScrollFade>
    </div>
  )
}
