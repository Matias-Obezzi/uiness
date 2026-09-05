import { useParallax } from '@uiness/scroll'
import { useRef } from 'react'

function Layer({ speed, label }: { speed: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useParallax(ref, { speed })
  return (
    <div ref={ref} className="rounded-xl border bg-card p-6 text-center shadow-sm">
      <p className="font-mono text-sm">speed {speed}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  )
}

export default function ScrollParallax() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <Layer speed={0.4} label="lags behind" />
      <Layer speed={0} label="stays put" />
      <Layer speed={-0.4} label="runs ahead" />
    </div>
  )
}
