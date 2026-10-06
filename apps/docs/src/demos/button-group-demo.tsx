import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'
import { useState } from 'react'
import { ButtonGroup, ButtonGroupItem } from '@/components/ui/button-group'

const ranges = ['Day', 'Week', 'Month', 'Year']

export default function ButtonGroupDemo() {
  const [range, setRange] = useState('Week')
  const [zoom, setZoom] = useState(100)
  return (
    <div className="flex flex-col items-center gap-6">
      <ButtonGroup aria-label="Range">
        {ranges.map((r) => (
          <ButtonGroupItem key={r} aria-pressed={range === r} onClick={() => setRange(r)}>
            {r}
          </ButtonGroupItem>
        ))}
      </ButtonGroup>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <ButtonGroup aria-label="Pages">
          <ButtonGroupItem aria-label="Previous page">
            <ChevronLeftIcon />
          </ButtonGroupItem>
          <ButtonGroupItem aria-label="Next page">
            <ChevronRightIcon />
          </ButtonGroupItem>
        </ButtonGroup>
        <ButtonGroup aria-label="Zoom">
          <ButtonGroupItem
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
          >
            <ZoomOutIcon />
          </ButtonGroupItem>
          <ButtonGroupItem aria-label={`Reset zoom, ${zoom}%`} onClick={() => setZoom(100)}>
            <RotateCcwIcon />
            <span className="w-9 tabular-nums">{zoom}%</span>
          </ButtonGroupItem>
          <ButtonGroupItem
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(400, z + 25))}
          >
            <ZoomInIcon />
          </ButtonGroupItem>
        </ButtonGroup>
      </div>
    </div>
  )
}
