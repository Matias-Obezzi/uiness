import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function SwitchDemo() {
  return (
    <div className="flex items-center gap-3">
      <Switch id="airplane" />
      <Label htmlFor="airplane">Airplane mode</Label>
    </div>
  )
}
