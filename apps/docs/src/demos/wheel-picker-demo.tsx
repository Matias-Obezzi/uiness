import { useState } from 'react'
import { WheelPicker } from '@/components/ui/wheel-picker'

const hours = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1)
  return { value: h, label: h }
})
const minutes = Array.from({ length: 12 }, (_, i) => {
  const m = String(i * 5).padStart(2, '0')
  return { value: m, label: m }
})
const periods = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

export default function WheelPickerDemo() {
  const [hour, setHour] = useState('7')
  const [minute, setMinute] = useState('30')
  const [period, setPeriod] = useState('AM')
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-64 gap-1">
        <WheelPicker label="Hour" options={hours} value={hour} onValueChange={setHour} loop />
        <WheelPicker
          label="Minute"
          options={minutes}
          value={minute}
          onValueChange={setMinute}
          loop
        />
        <WheelPicker label="AM or PM" options={periods} value={period} onValueChange={setPeriod} />
      </div>
      <p className="text-muted-foreground text-sm">
        Alarm at {hour}:{minute} {period}
      </p>
    </div>
  )
}
