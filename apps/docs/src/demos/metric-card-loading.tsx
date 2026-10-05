import * as React from 'react'
import { Label } from '@/ui/label'
import { MetricCard } from '@/ui/metric-card'
import { Sparkline } from '@/ui/sparkline'
import { Switch } from '@/ui/switch'

export default function MetricCardLoading() {
  const [loading, setLoading] = React.useState(true)
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="flex items-center gap-2">
        <Switch id="metric-loading" checked={loading} onCheckedChange={setLoading} />
        <Label htmlFor="metric-loading">Loading</Label>
      </div>
      <MetricCard
        label="Orders"
        value={1_284}
        locale="en-US"
        delta={0.052}
        comparison="vs yesterday"
        loading={loading}
        sparkline={<Sparkline data={[12, 14, 13, 17, 16, 19, 18, 22]} height={36} />}
      />
    </div>
  )
}
