import { UptimeCard, type UptimeDay, type UptimeStatus } from '@/components/ui/uptime-card'

// Ninety days ending today, the same on every render: a few bad days per service.
function days(bad: Record<number, UptimeStatus>): UptimeDay[] {
  const today = Date.UTC(2026, 9, 29)
  return Array.from({ length: 90 }, (_, i) => {
    const status = bad[i] ?? 'up'
    return {
      date: new Date(today - (89 - i) * 86400000).toISOString().slice(0, 10),
      status,
      incidents:
        status === 'up'
          ? undefined
          : [
              {
                time: '14:02 UTC',
                title: status === 'down' ? 'Requests failing in us-east' : 'Slow responses',
                note: 'Resolved after 38 minutes.',
              },
            ],
    }
  })
}

export default function UptimeCardDemo() {
  return (
    <UptimeCard
      services={[
        { name: 'API', days: days({ 21: 'degraded', 63: 'down', 64: 'degraded' }) },
        { name: 'Dashboard', days: days({ 40: 'degraded' }) },
        { name: 'Webhooks', days: days({ 12: 'down', 77: 'degraded', 88: 'degraded' }) },
      ]}
    />
  )
}
