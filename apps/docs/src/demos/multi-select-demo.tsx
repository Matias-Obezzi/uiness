import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'

const options = [
  { value: 'react', label: 'React', group: 'Libraries' },
  { value: 'vue', label: 'Vue', group: 'Libraries' },
  { value: 'svelte', label: 'Svelte', group: 'Libraries' },
  { value: 'solid', label: 'Solid', group: 'Libraries' },
  { value: 'next', label: 'Next.js', group: 'Frameworks' },
  { value: 'remix', label: 'Remix', group: 'Frameworks' },
  { value: 'astro', label: 'Astro', group: 'Frameworks' },
  { value: 'gatsby', label: 'Gatsby', group: 'Frameworks', disabled: true },
]

export default function MultiSelectDemo() {
  const [value, setValue] = useState(['react', 'svelte', 'next', 'astro'])
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="stack">Stack</Label>
      <MultiSelect
        id="stack"
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="Pick your stack"
        maxShown={3}
        className="w-full"
      />
    </div>
  )
}
