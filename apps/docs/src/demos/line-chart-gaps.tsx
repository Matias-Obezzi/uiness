import { LineChart } from '@/ui/line-chart'

// Response times with a few days the monitor was down: those rows have no value.
const down = new Set([9, 10, 11, 19])
const data = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, '0')}`,
  p50: down.has(i) ? null : Math.round(120 + Math.sin(i / 2) * 18),
  p95: down.has(i) ? null : Math.round(310 + Math.cos(i / 3) * 60 + (i % 7) * 6),
}))

export default function LineChartGaps() {
  return (
    <LineChart
      className="w-full"
      data={data}
      x="date"
      yFormat={(ms) => `${ms} ms`}
      series={[
        { key: 'p50', label: 'Median' },
        { key: 'p95', label: '95th percentile' },
      ]}
    />
  )
}
