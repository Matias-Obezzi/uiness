import { Minus, Plus } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/ui/button'
import { Odometer } from '@/ui/odometer'

function Followers() {
  const [count, setCount] = React.useState(48_217)
  React.useEffect(() => {
    const timer = setInterval(() => setCount((c) => c + Math.ceil(Math.random() * 40)), 1600)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex-1 rounded-xl border p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60 motion-reduce:animate-none" />
          <span className="relative size-2 rounded-full bg-emerald-500" />
        </span>
        Followers, live
      </div>
      <p className="mt-2 font-bold text-4xl tracking-tight">
        <Odometer value={count} locale="en-US" />
      </p>
    </div>
  )
}

export default function OdometerDemo() {
  const [value, setValue] = React.useState(12.5)
  const step = (by: number) => setValue((v) => Math.max(0, Math.round((v + by) * 100) / 100))
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row">
      <Followers />
      <div className="flex-1 rounded-xl border p-5">
        <p className="text-muted-foreground text-sm">Price per seat</p>
        <p className="mt-2 font-bold text-4xl tracking-tight">
          <Odometer
            value={value}
            decimals={2}
            locale="en-US"
            format={{ style: 'currency', currency: 'USD' }}
          />
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="icon" aria-label="Lower" onClick={() => step(-7.25)}>
            <Minus />
          </Button>
          <Button variant="outline" size="icon" aria-label="Raise" onClick={() => step(7.25)}>
            <Plus />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setValue(Math.round(Math.random() * 99_999) / 100)}
          >
            Surprise me
          </Button>
        </div>
      </div>
    </div>
  )
}
