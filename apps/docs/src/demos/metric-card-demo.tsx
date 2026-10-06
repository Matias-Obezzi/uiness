import { RefreshCwIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/metric-card'
import { Sparkline } from '@/components/ui/sparkline'

// Two made up weeks per metric, the same on every render; "Refresh" moves to the next set.
// Trends are in thousands (revenue, users) and percent (churn), so the tooltips say so.
const thousands =
  (prefix = '') =>
  (value: number) =>
    `${prefix}${value.toLocaleString('en-US')}k`
const percent = (value: number) => `${value.toLocaleString('en-US')}%`
const sets = [
  {
    revenue: 48_210,
    revenueDelta: 0.124,
    revenueTrend: [31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 45, 48],
    users: 2_841,
    usersDelta: 0.031,
    usersTrend: [2.5, 2.6, 2.6, 2.7, 2.65, 2.7, 2.75, 2.72, 2.8, 2.78, 2.82, 2.84],
    churn: 0.021,
    churnDelta: -0.18,
    churnTrend: [3.1, 2.9, 3, 2.7, 2.6, 2.5, 2.6, 2.4, 2.3, 2.2, 2.2, 2.1],
  },
  {
    revenue: 51_940,
    revenueDelta: 0.077,
    revenueTrend: [40, 44, 43, 47, 45, 48, 47, 50, 49, 52, 50, 52],
    users: 2_790,
    usersDelta: -0.018,
    usersTrend: [2.84, 2.86, 2.83, 2.85, 2.8, 2.82, 2.78, 2.8, 2.77, 2.79, 2.78, 2.79],
    churn: 0.024,
    churnDelta: 0.14,
    churnTrend: [2.2, 2.1, 2.2, 2.3, 2.2, 2.4, 2.3, 2.5, 2.4, 2.4, 2.5, 2.4],
  },
]

export default function MetricCardDemo() {
  const [index, setIndex] = React.useState(0)
  const set = sets[index % sets.length] ?? sets[0]
  if (!set) return null
  return (
    <div className="grid w-full gap-4">
      <div className="grid w-full gap-4 sm:grid-cols-3">
        <MetricCard
          label="Revenue"
          value={set.revenue}
          locale="en-US"
          format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
          delta={set.revenueDelta}
          comparison="vs last month"
          sparkline={
            <Sparkline
              data={set.revenueTrend}
              variant="area"
              height={36}
              tooltip
              format={thousands('$')}
            />
          }
        />
        <MetricCard
          label="Active users"
          value={set.users}
          locale="en-US"
          delta={set.usersDelta}
          comparison="vs last week"
          sparkline={<Sparkline data={set.usersTrend} height={36} tooltip format={thousands()} />}
        />
        <MetricCard
          label="Churn"
          value={set.churn}
          locale="en-US"
          format={{ style: 'percent', maximumFractionDigits: 1 }}
          delta={set.churnDelta}
          inverse
          comparison="vs last month"
          sparkline={
            <Sparkline data={set.churnTrend} variant="bar" height={36} tooltip format={percent} />
          }
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => setIndex((i) => i + 1)}
      >
        <RefreshCwIcon />
        Refresh
      </Button>
    </div>
  )
}
