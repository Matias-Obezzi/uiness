import { useState } from 'react'
import type { DateRange } from '@/ui/calendar'
import { DatePicker } from '@/ui/date-picker'

export default function DatePickerRange() {
  const [range, setRange] = useState<DateRange>({})
  return <DatePicker mode="range" value={range} onValueChange={setRange} placeholder="Stay dates" />
}
