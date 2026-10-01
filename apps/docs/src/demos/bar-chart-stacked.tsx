import { BarChart } from '@/ui/bar-chart'

// Thirty days of made up sign ups by plan, the same on every render.
const data = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 8, i + 1),
  free: 40 + Math.round(Math.abs(Math.sin(i / 2.5)) * 30) + i,
  pro: 12 + Math.round(Math.abs(Math.cos(i / 3)) * 14),
  team: 3 + (i % 4) * 2,
}))

export default function BarChartStacked() {
  return (
    <BarChart
      stacked
      className="w-full"
      data={data}
      x="date"
      series={[
        { key: 'free', label: 'Free' },
        { key: 'pro', label: 'Pro' },
        { key: 'team', label: 'Team' },
      ]}
    />
  )
}
