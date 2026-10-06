import { LineChart } from '@/components/ui/line-chart'

// Thirty days of made up visitors, the same on every render.
const data = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 8, i + 1),
  visitors: Math.round(1800 + Math.sin(i / 3) * 420 + i * 32),
  returning: Math.round(700 + Math.cos(i / 4) * 160 + i * 14),
}))

export default function LineChartDemo() {
  return (
    <LineChart
      area
      curve="monotone"
      className="w-full"
      data={data}
      x="date"
      series={[
        { key: 'visitors', label: 'Visitors' },
        { key: 'returning', label: 'Returning' },
      ]}
    />
  )
}
