import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function LabelDemo() {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id="remember" />
      <Label htmlFor="remember">Remember me</Label>
    </div>
  )
}
