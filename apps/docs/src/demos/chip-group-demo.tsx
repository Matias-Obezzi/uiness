import { useState } from 'react'
import { ChipGroup, ChipGroupItem } from '@/ui/chip-group'

const cuisines = ['Italian', 'Japanese', 'Mexican', 'Indian', 'Vegan', 'Thai']

export default function ChipGroupDemo() {
  const [picked, setPicked] = useState(['Japanese', 'Vegan'])
  return (
    <div className="flex max-w-md flex-col gap-3">
      <ChipGroup type="multiple" aria-label="Cuisine" value={picked} onValueChange={setPicked}>
        {cuisines.map((c) => (
          <ChipGroupItem key={c} value={c}>
            {c}
          </ChipGroupItem>
        ))}
      </ChipGroup>
      <p className="text-muted-foreground text-sm">
        {picked.length ? `Showing ${picked.join(', ')}.` : 'Showing everything.'}
      </p>
    </div>
  )
}
