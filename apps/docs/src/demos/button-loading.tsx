import { SaveIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'

export default function ButtonLoading() {
  const [saving, setSaving] = useState(false)
  const save = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button loading={saving} onClick={save}>
        Save changes
      </Button>
      <Button variant="outline" loading={saving} onClick={save}>
        <SaveIcon /> Save
      </Button>
      <Button size="icon" variant="secondary" loading={saving} onClick={save} aria-label="Save">
        <SaveIcon />
      </Button>
    </div>
  )
}
