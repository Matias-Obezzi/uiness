import { ClockIcon, FlameIcon, StarIcon } from 'lucide-react'
import { ChipGroup, ChipGroupItem } from '@/components/ui/chip-group'

export default function ChipGroupSingle() {
  return (
    <ChipGroup type="single" size="sm" aria-label="Sort by" defaultValue="hot">
      <ChipGroupItem value="hot" icon={<FlameIcon />}>
        Hot
      </ChipGroupItem>
      <ChipGroupItem value="new" icon={<ClockIcon />}>
        New
      </ChipGroupItem>
      <ChipGroupItem value="top" icon={<StarIcon />}>
        Top
      </ChipGroupItem>
    </ChipGroup>
  )
}
