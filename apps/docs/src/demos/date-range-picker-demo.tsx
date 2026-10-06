import { useState } from 'react'
import type { DateRange } from '@/components/ui/calendar'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Label } from '@/components/ui/label'

export default function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange>({})
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="report">Report period</Label>
      <DateRangePicker id="report" value={range} onValueChange={setRange} max={new Date()} />
    </div>
  )
}
