import * as React from 'react'
import { ScrollProgress } from '@/components/ui/scroll-progress'

export default function ScrollProgressCircleDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card">
      <div ref={containerRef} className="relative h-64 overflow-y-auto p-6 space-y-4">
        <h4 className="font-semibold text-base">Circular Progress with Return-to-Top</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Scroll down inside this box to see the progress ring fill with the current percentage.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Clicking the circle scrolls smoothly back to the top of the container.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Screen readers announce the button with localized labels in English, Spanish, Portuguese,
          French, Italian, and Chinese.
        </p>
        <div className="h-40 rounded-lg bg-muted/50 p-4 font-mono text-xs">
          Bottom area reached.
        </div>
      </div>

      <ScrollProgress
        target={containerRef}
        variant="circle"
        className="!absolute right-4 bottom-4"
      />
    </div>
  )
}
