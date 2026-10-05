import { useState } from 'react'
import { Label } from '@/ui/label'
import { NumberField } from '@/ui/number-field'

export default function NumberFieldDemo() {
  const [guests, setGuests] = useState<number | null>(2)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="guests">Guests</Label>
      <NumberField id="guests" value={guests} onValueChange={setGuests} min={1} max={12} />
      <p className="text-muted-foreground text-sm">
        {guests === null ? 'How many are coming?' : `Table for ${guests}.`}
      </p>
    </div>
  )
}
