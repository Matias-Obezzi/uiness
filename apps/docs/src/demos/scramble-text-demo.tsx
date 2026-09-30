import { ScrambleText } from '@/ui/scramble-text'

const links = ['Work', 'About', 'Journal', 'Contact']

export default function ScrambleTextDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-8 font-mono">
      <div className="rounded-xl border bg-muted/40 p-5">
        <p className="text-muted-foreground text-xs">
          <span className="text-primary">$</span> ./decrypt --payload headline.bin
        </p>
        <p className="mt-3 font-semibold text-2xl tracking-tight sm:text-3xl [&_[data-scrambled]]:text-muted-foreground">
          <ScrambleText text="ACCESS GRANTED" trigger="view" duration={1400} />
        </p>
        <p className="mt-1 text-muted-foreground text-sm [&_[data-scrambled]]:text-primary">
          <ScrambleText text="Welcome back, operator." trigger="view" delay={900} duration={1200} />
        </p>
      </div>
      <nav
        aria-label="Demo"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm uppercase"
      >
        {links.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            onClick={(e) => e.preventDefault()}
            className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ScrambleText text={link} trigger="hover" duration={500} speed={30} />
          </a>
        ))}
      </nav>
    </div>
  )
}
