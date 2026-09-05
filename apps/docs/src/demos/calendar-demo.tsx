import { useState } from 'react'
import { Calendar } from '@/ui/calendar'

export default function CalendarDemo() {
  const [date, setDate] = useState<Date | null>(new Date())
  return <Calendar selected={date} onSelect={setDate} className="rounded-xl border" />
}
