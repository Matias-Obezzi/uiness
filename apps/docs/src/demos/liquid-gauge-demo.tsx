import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LiquidGauge } from '@/components/ui/liquid-gauge'

export default function LiquidGaugeDemo() {
  const [used, setUsed] = useState(32)
  return (
    <div className="flex flex-col items-center gap-4">
      <LiquidGauge label="Storage" value={used} max={50} format={(n) => `${n} GB`} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setUsed((u) => Math.max(0, u - 8))}>
          Free 8 GB
        </Button>
        <Button variant="outline" size="sm" onClick={() => setUsed((u) => Math.min(50, u + 8))}>
          Upload 8 GB
        </Button>
      </div>
    </div>
  )
}
