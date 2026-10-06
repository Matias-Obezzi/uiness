import { Label } from '@/components/ui/label'
import { NumberField } from '@/components/ui/number-field'

export default function NumberFieldFormat() {
  return (
    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="discount">Discount</Label>
        <NumberField
          id="discount"
          className="w-full"
          defaultValue={0.15}
          min={0}
          max={1}
          step={0.05}
          formatOptions={{ style: 'percent' }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="price">Price</Label>
        <NumberField
          id="price"
          className="w-full"
          defaultValue={49}
          min={0}
          step={0.5}
          largeStep={10}
          formatOptions={{ style: 'currency', currency: 'EUR' }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="distance">Distance</Label>
        <NumberField
          id="distance"
          className="w-full"
          defaultValue={5}
          min={0}
          max={42}
          formatOptions={{ style: 'unit', unit: 'kilometer' }}
          allowWheel
        />
      </div>
    </div>
  )
}
