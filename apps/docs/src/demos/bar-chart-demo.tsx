import { BarChart } from '@/ui/bar-chart'

// Thirty days of made up traffic, the same on every render.
const data = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 8, i + 1)
  const weekend = date.getDay() === 0 || date.getDay() === 6
  const wave = Math.sin(i / 3) * 90
  return {
    date,
    desktop: Math.round((weekend ? 380 : 720) + wave + i * 8),
    mobile: Math.round((weekend ? 560 : 360) - wave / 2 + i * 5),
  }
})

export default function BarChartDemo() {
  return (
    <BarChart
      className="w-full"
      data={data}
      x="date"
      series={[
        { key: 'desktop', label: 'Desktop' },
        { key: 'mobile', label: 'Mobile' },
      ]}
    />
  )
}
