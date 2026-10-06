import * as React from 'react'
import { DonutChart } from '@/components/ui/donut-chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const months = {
  september: [
    { key: 'organic', label: 'Organic search', value: 18_420 },
    { key: 'direct', label: 'Direct', value: 9_310 },
    { key: 'social', label: 'Social', value: 6_045 },
    { key: 'referral', label: 'Referral', value: 3_280 },
    { key: 'email', label: 'Email', value: 1_870 },
  ],
  august: [
    { key: 'organic', label: 'Organic search', value: 15_960 },
    { key: 'direct', label: 'Direct', value: 10_120 },
    { key: 'social', label: 'Social', value: 4_380 },
    { key: 'referral', label: 'Referral', value: 3_905 },
    { key: 'email', label: 'Email', value: 2_410 },
  ],
}

export default function DonutChartDemo() {
  const [month, setMonth] = React.useState<keyof typeof months>('september')
  return (
    <div className="grid w-full justify-items-center gap-6">
      <ToggleGroup
        type="single"
        variant="outline"
        value={month}
        onValueChange={(value) => value && setMonth(value as keyof typeof months)}
        aria-label="Month"
      >
        <ToggleGroupItem value="august">August</ToggleGroupItem>
        <ToggleGroupItem value="september">September</ToggleGroupItem>
      </ToggleGroup>
      <DonutChart data={months[month]} label="Visits" locale="en-US" />
    </div>
  )
}
