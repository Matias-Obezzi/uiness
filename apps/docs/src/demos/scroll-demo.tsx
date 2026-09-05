import { useScrollProgress } from '@uiness/scroll'
import { useRef } from 'react'

export default function ScrollDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(ref, { offset: ['start end', 'end start'] })
  return (
    <div
      ref={ref}
      className="flex h-40 w-full items-center justify-center rounded-xl border"
      style={{
        background: `linear-gradient(to right, var(--primary) ${progress * 100}%, transparent 0)`,
      }}
    >
      <span className="rounded-md bg-background px-3 py-1 font-mono text-sm tabular-nums">
        progress {progress.toFixed(2)}
      </span>
    </div>
  )
}
