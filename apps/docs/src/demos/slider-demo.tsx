import { useState } from 'react'
import { Label } from '@/ui/label'
import { Slider } from '@/ui/slider'

export default function SliderDemo() {
  const [volume, setVolume] = useState([60])
  const [price, setPrice] = useState([20, 80])

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume">Volume</Label>
          <span className="text-muted-foreground text-sm tabular-nums">{volume[0]}</span>
        </div>
        <Slider id="volume" value={volume} onValueChange={setVolume} max={100} step={1} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Price</Label>
          <span className="text-muted-foreground text-sm tabular-nums">
            ${price[0]} to ${price[1]}
          </span>
        </div>
        <Slider value={price} onValueChange={setPrice} max={100} step={5} />
      </div>
    </div>
  )
}
