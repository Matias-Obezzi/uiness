import { useState } from 'react'
import { DatePicker } from '@/ui/date-picker'
import { Label } from '@/ui/label'

export default function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(null)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="due">Due date</Label>
      <DatePicker id="due" value={date} onValueChange={setDate} min={new Date()} />
    </div>
  )
}
