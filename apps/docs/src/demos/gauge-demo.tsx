import { ShuffleIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Gauge } from '@/components/ui/gauge'

const load = [
  { value: 0, color: 'var(--chart-2)', label: 'Healthy' },
  { value: 70, color: 'oklch(0.78 0.16 70)', label: 'Busy' },
  { value: 90, color: 'var(--destructive)', label: 'Critical' },
]

const readings = [
  { cpu: 42, memory: 0.68, latency: 180 },
  { cpu: 78, memory: 0.81, latency: 320 },
  { cpu: 93, memory: 0.47, latency: 95 },
]

export default function GaugeDemo() {
  const [index, setIndex] = React.useState(0)
  const r = readings[index % readings.length] ?? { cpu: 0, memory: 0, latency: 0 }
  return (
    <div className="grid w-full justify-items-center gap-6">
      <div className="flex w-full flex-wrap items-end justify-center gap-x-10 gap-y-8">
        <Gauge
          value={r.cpu}
          label="CPU"
          thresholds={load}
          formatValue={(v) => `${Math.round(v)}%`}
        />
        <Gauge
          value={r.memory}
          max={1}
          variant="ring"
          size={140}
          thickness={12}
          label="Memory"
          color="var(--chart-1)"
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
        <Gauge
          value={r.latency}
          max={400}
          needle
          label="p95 latency"
          thresholds={[
            { value: 0, color: 'var(--chart-2)' },
            { value: 250, color: 'oklch(0.78 0.16 70)' },
            { value: 350, color: 'var(--destructive)' },
          ]}
          formatValue={(v) => `${Math.round(v)} ms`}
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => setIndex((i) => i + 1)}>
        <ShuffleIcon />
        New reading
      </Button>
    </div>
  )
}
