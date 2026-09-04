import { useState } from 'react'
import { Combobox } from '@/ui/combobox'
import { Label } from '@/ui/label'

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'react-router', label: 'React Router' },
  { value: 'astro', label: 'Astro', group: 'Static' },
  { value: 'eleventy', label: 'Eleventy', group: 'Static' },
]

export default function ComboboxDemo() {
  const [value, setValue] = useState<string | null>('next')
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="framework">Framework</Label>
      <Combobox
        id="framework"
        options={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select a framework"
        searchPlaceholder="Search frameworks…"
        emptyText="No framework found."
      />
    </div>
  )
}
