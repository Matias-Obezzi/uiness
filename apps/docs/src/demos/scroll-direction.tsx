import { scrollToElement, useScrollDirection, useScrollVelocity, useStuck } from '@uiness/scroll'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const sections = Array.from({ length: 8 }, (_, i) => `Section ${i + 1}`)

export default function ScrollDirection() {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const header = useRef<HTMLDivElement>(null)
  const direction = useScrollDirection({ container: box, threshold: 12 })
  const velocity = useScrollVelocity({ container: box })
  const stuck = useStuck(header)
  const hidden = direction === 'down'

  return (
    <div className="flex w-full flex-col gap-3">
      <div ref={setBox} className="relative h-72 w-full overflow-y-auto rounded-xl border">
        <div className="h-16 px-4 pt-4 text-muted-foreground text-sm">
          Scroll down, then back up a little.
        </div>
        <div
          ref={header}
          className="sticky top-0 z-10 flex items-center justify-between border-y bg-background/90 px-4 py-2 font-medium text-sm backdrop-blur transition-transform duration-300"
          style={{ transform: hidden ? 'translateY(-100%)' : 'none' }}
        >
          <span>{stuck ? 'Stuck to the top' : 'Header'}</span>
          <span className="font-mono text-muted-foreground text-xs tabular-nums">
            {velocity} px/s
          </span>
        </div>
        {sections.map((title) => (
          <section key={title} id={title} className="h-40 border-b px-4 py-6">
            <h3 className="font-medium">{title}</h3>
          </section>
        ))}
      </div>
      <Button
        variant="outline"
        className="self-start"
        onClick={() => {
          const target = box?.querySelector('[id="Section 6"]')
          // The header is 37px tall: stop short of it so the title is not under it.
          if (target) scrollToElement(target, { container: box, offset: 37, duration: 800 })
        }}
      >
        Go to section 6
      </Button>
    </div>
  )
}
