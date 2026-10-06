import { Label } from '@/components/ui/label'
import { TimePicker } from '@/components/ui/time-picker'

export default function TimePickerCycles() {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex flex-col gap-2">
        <Label id="cycle-12">12 hours, en-US</Label>
        <TimePicker aria-labelledby="cycle-12" locale="en-US" defaultValue="14:05" />
      </div>
      <div className="flex flex-col gap-2">
        <Label id="cycle-24">24 hours with seconds, de-DE</Label>
        <TimePicker aria-labelledby="cycle-24" locale="de-DE" seconds defaultValue="14:05:30" />
      </div>
    </div>
  )
}
