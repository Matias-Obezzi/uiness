import { useState } from 'react'
import { addDays, type DateRange } from '@/ui/calendar'
import { DateRangePicker } from '@/ui/date-range-picker'

const next = (days: number) => (today: Date) => ({ from: today, to: addDays(today, days - 1) })

export default function DateRangePickerConfirm() {
  const [range, setRange] = useState<DateRange>({})
  return (
    <DateRangePicker
      confirm
      value={range}
      onValueChange={setRange}
      min={new Date()}
      labels={{ placeholder: 'Stay dates' }}
      presets={[
        { label: 'Weekend', range: next(3) },
        { label: 'One week', range: next(7) },
        { label: 'Two weeks', range: next(14) },
      ]}
    />
  )
}
