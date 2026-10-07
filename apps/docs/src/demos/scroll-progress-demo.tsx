import * as React from 'react'
import { ScrollProgress } from '@/components/ui/scroll-progress'

export default function ScrollProgressDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card">
      <ScrollProgress target={containerRef} position="top" thickness={4} color="var(--primary)" />

      <div ref={containerRef} className="h-64 overflow-y-auto p-6 space-y-4">
        <h4 className="font-semibold text-base">Scroll through this container</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The progress bar at the top measures scroll distance inside this container element.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          When placed without a target, it attaches to the root document, animating either via CSS
          scroll-driven animations or JavaScript observers.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          CSS scroll timelines allow zero JavaScript execution during scrolling on modern browsers,
          preserving silky smooth 120 FPS performance.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Try scrolling down to reach the bottom and see the bar fill completely.
        </p>
        <div className="rounded-lg bg-muted p-4 font-mono text-xs">End of content reached.</div>
      </div>
    </div>
  )
}
