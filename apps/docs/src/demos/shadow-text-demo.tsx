import { useState } from 'react'
import { ShadowText } from '@/components/ui/shadow-text'
import { Slider } from '@/components/ui/slider'

export default function ShadowTextDemo() {
  const [hour, setHour] = useState<number | undefined>(undefined)
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 py-6">
      <h3 className="font-black text-6xl tracking-tight">
        <ShadowText hour={hour}>Sundial</ShadowText>
      </h3>
      <div className="flex w-full flex-col gap-2">
        <Slider
          aria-label="Time of day"
          min={5}
          max={21}
          step={0.25}
          value={[hour ?? new Date().getHours()]}
          onValueChange={([h]) => setHour(h)}
        />
        <p className="text-center text-muted-foreground text-xs">
          {hour === undefined
            ? 'Your clock'
            : `${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`}{' '}
          · hover the word for a lamp
        </p>
      </div>
    </div>
  )
}
