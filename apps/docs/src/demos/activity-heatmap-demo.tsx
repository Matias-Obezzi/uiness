import { ActivityHeatmap } from '@/ui/activity-heatmap'

// A year of made up commits up to 4 October 2026: busier on weekdays, quieter in August, the
// same on every render.
const end = new Date(2026, 9, 4)
let seed = 7
const random = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const data = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
  const weekend = date.getDay() === 0 || date.getDay() === 6
  const august = date.getMonth() === 7
  const chance = weekend ? 0.25 : august ? 0.35 : 0.8
  const value = random() < chance ? Math.ceil(random() ** 2 * (weekend ? 4 : 12)) : 0
  return { date, value }
})
const total = data.reduce((sum, d) => sum + d.value, 0)

export default function ActivityHeatmapDemo() {
  return (
    <div className="grid w-full gap-3">
      <p className="text-sm">
        <span className="font-semibold">{total.toLocaleString('en-US')}</span>{' '}
        <span className="text-muted-foreground">contributions in the last year</span>
      </p>
      <ActivityHeatmap
        data={data}
        endDate={end}
        locale="en-US"
        formatDay={({ date, value }) =>
          `${value === 0 ? 'No' : value} ${value === 1 ? 'contribution' : 'contributions'} on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      />
    </div>
  )
}
