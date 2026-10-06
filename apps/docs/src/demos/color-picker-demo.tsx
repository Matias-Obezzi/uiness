import { useState } from 'react'
import { ColorPicker } from '@/components/ui/color-picker'
import { Label } from '@/components/ui/label'

export default function ColorPickerDemo() {
  const [color, setColor] = useState('#6d28d9')
  const [swatches, setSwatches] = useState(['#0f172a', '#e11d48', '#f59e0b', '#10b981', '#0ea5e9'])
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor="brand">Brand color</Label>
      <ColorPicker
        id="brand"
        value={color}
        onValueChange={setColor}
        swatches={swatches}
        onSwatchesChange={setSwatches}
        contrastWith="#ffffff"
      />
      <div
        className="mt-2 rounded-lg px-4 py-2 font-medium text-sm text-white"
        style={{ background: color }}
      >
        White text on it
      </div>
    </div>
  )
}
