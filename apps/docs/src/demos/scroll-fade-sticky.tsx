import { ScrollFade } from '@/ui/scroll-fade'

const people = {
  A: ['Alan Kay', 'Anita Borg', 'Adele Goldberg'],
  B: ['Bjarne Stroustrup', 'Brian Kernighan', 'Butler Lampson'],
  D: ['Donald Knuth', 'Dorothy Vaughan'],
  E: ['Edsger Dijkstra', 'Evelyn Boyd Granville'],
  G: ['Gladys West', 'Guido van Rossum'],
  J: ['John McCarthy', 'Joan Clarke'],
  K: ['Karen Spärck Jones', 'Kristen Nygaard'],
  L: ['Linus Torvalds', 'Lynn Conway'],
  M: ['Mary Kenneth Keller', 'Marvin Minsky'],
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
