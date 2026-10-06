import { useState } from 'react'
import { Combobox } from '@/ui/combobox'

const people = [
  { value: 'freya', label: 'Freya Nilsson', keywords: ['design systems'] },
  { value: 'rohan', label: 'Rohan Mehta' },
  { value: 'yara', label: 'Yara Costa' },
  { value: 'emeka', label: 'Emeka Obi' },
]

export default function ComboboxMultiple() {
  const [value, setValue] = useState<string[]>(['freya'])
  return (
    <Combobox
      multiple
      options={people}
      value={value}
      onValueChange={setValue}
      placeholder="Add reviewers"
      searchPlaceholder="Search people…"
    />
  )
}
