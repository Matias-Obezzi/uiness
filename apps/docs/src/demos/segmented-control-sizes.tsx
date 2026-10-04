import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control'

export default function SegmentedControlSizes() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <SegmentedControl
          key={size}
          size={size}
          defaultValue="monthly"
          aria-label={`Billing, ${size}`}
        >
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
      ))}
      <SegmentedControl fullWidth defaultValue="all" aria-label="Filter">
        <SegmentedControlItem value="all">All</SegmentedControlItem>
        <SegmentedControlItem value="open">Open</SegmentedControlItem>
        <SegmentedControlItem value="closed">Closed</SegmentedControlItem>
      </SegmentedControl>
    </div>
  )
}
