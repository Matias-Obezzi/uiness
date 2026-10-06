import { BarChart } from '@/components/ui/bar-chart'

export default function BarChartEmpty() {
  return (
    <BarChart
      className="w-full rounded-lg border border-dashed"
      data={[]}
      x="date"
      series={[{ key: 'orders', label: 'Orders' }]}
      empty={
        <div className="grid gap-1 text-center">
          <p className="font-medium text-foreground">No orders yet</p>
          <p>They show up here a few minutes after the first one.</p>
        </div>
      }
    />
  )
}
