import { useState } from 'react'
import { Calendar, type DateRange } from '@/ui/calendar'

export default function CalendarRange() {
  const [range, setRange] = useState<DateRange>({})
  const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
      disabled={weekend}
      className="rounded-xl border"
    />
  )
}
