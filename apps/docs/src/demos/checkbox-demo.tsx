import { Checkbox } from '@/ui/checkbox'
import { Label } from '@/ui/label'

export default function CheckboxDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="news" defaultChecked />
        <Label htmlFor="news">Send me product updates</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="off" disabled />
        <Label htmlFor="off">Disabled</Label>
      </div>
    </div>
  )
}
