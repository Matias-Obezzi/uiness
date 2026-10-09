import { useEffect, useState } from 'react'
import { FlipClock } from '@/components/ui/flip-clock'

const two = (n: number) => String(n).padStart(2, '0')

export default function FlipClockDemo() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const time = `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`
  const left = 59 - now.getSeconds()
  return (
    <div className="flex flex-col items-center gap-6">
      <FlipClock value={time} className="text-5xl" />
      <p className="flex items-center gap-3 text-muted-foreground text-sm">
        Next minute in <FlipClock value={two(left)} className="text-xl" />
      </p>
    </div>
  )
}
