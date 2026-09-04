import { useState } from 'react'
import { Combobox } from '@/ui/combobox'

const people = [
  { value: 'ada', label: 'Ada Lovelace', keywords: ['analytical engine'] },
  { value: 'alan', label: 'Alan Turing' },
  { value: 'grace', label: 'Grace Hopper' },
  { value: 'katherine', label: 'Katherine Johnson' },
]

export default function ComboboxMultiple() {
  const [value, setValue] = useState<string[]>(['ada'])
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
