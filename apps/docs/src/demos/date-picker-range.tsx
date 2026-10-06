import { useState } from 'react'
import type { DateRange } from '@/components/ui/calendar'
import { DatePicker } from '@/components/ui/date-picker'

export default function DatePickerRange() {
  const [range, setRange] = useState<DateRange>({})
  return <DatePicker mode="range" value={range} onValueChange={setRange} placeholder="Stay dates" />
}
