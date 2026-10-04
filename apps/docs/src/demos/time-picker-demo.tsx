import { useState } from 'react'
import { Label } from '@/ui/label'
import { TimePicker } from '@/ui/time-picker'

export default function TimePickerDemo() {
  const [time, setTime] = useState<string | null>('09:30')
  return (
    <div className="flex flex-col gap-2">
      <Label id="meeting-label">Meeting starts</Label>
      <TimePicker
        aria-labelledby="meeting-label"
        value={time}
        onValueChange={setTime}
        step={30}
        min="08:00"
        max="18:00"
      />
      <p className="text-muted-foreground text-sm">
        Value: <code>{time ?? 'null'}</code>
      </p>
    </div>
  )
}
