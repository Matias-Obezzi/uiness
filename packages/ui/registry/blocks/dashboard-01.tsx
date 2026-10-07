'use client'

import { DownloadIcon } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart } from '@/components/ui/line-chart'
import { MetricCard } from '@/components/ui/metric-card'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { Sparkline } from '@/components/ui/sparkline'
import { cn } from '@/lib/utils'

export type DashboardRange = '7d' | '30d' | '90d'

export interface DashboardDay {
  /** ISO date. */
  date: string
  revenue: number
  orders: number
  visitors: number
}

export type OrderStatus = 'paid' | 'pending' | 'refunded'

export interface DashboardOrder {
  id: string
  customer: string
  /** ISO date. */
  date: string
  amount: number
  status: OrderStatus
}

export interface Dashboard01Labels {
  range: string
  ranges: Record<DashboardRange, string>
  export: string
  revenue: string
  orders: string
  conversion: string
  averageOrder: string
  /** `{range}` is replaced. */
  comparison: string
  revenueOverTime: string
  recentOrders: string
  order: string
  customer: string
  date: string
  amount: string
  status: string
  statuses: Record<OrderStatus, string>
}

export interface Dashboard01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode | null
  /** One row per day, oldest first. The range shows the last 7, 30 or 90 of them. */
  days?: DashboardDay[]
  /** Newest first. */
  orders?: DashboardOrder[]
  defaultRange?: DashboardRange
  /** Called with the rows in the selected range. Without it, the button is hidden. */
  onExport?: (days: DashboardDay[]) => void
  currency?: string
  locale?: string
  labels?: Partial<Dashboard01Labels>
}

const defaultLabels: Dashboard01Labels = {
  range: 'Range',
  ranges: { '7d': '7 days', '30d': '30 days', '90d': '90 days' },
  export: 'Export',
  revenue: 'Revenue',
  orders: 'Orders',
  conversion: 'Conversion',
  averageOrder: 'Average order',
  comparison: 'vs previous {range}',
  revenueOverTime: 'Revenue over time',
  recentOrders: 'Recent orders',
  order: 'Order',
  customer: 'Customer',
  date: 'Date',
  amount: 'Amount',
  status: 'Status',
  statuses: { paid: 'Paid', pending: 'Pending', refunded: 'Refunded' },
}

const spans: Record<DashboardRange, number> = { '7d': 7, '30d': 30, '90d': 90 }

/**
 * Made-up days that look alive and come out the same on the server and in the browser: a
 * weekly wave on a slow climb, no randomness.
 */
function sampleDays(count: number, end = Date.UTC(2026, 9, 6)): DashboardDay[] {
  return Array.from({ length: count }, (_, i) => {
    const visitors = Math.round(1800 + 22 * i + 420 * Math.sin((i * 2 * Math.PI) / 7))
    const orders = Math.round(visitors * (0.031 + 0.004 * Math.sin(i / 5)))
    return {
      date: new Date(end - (count - 1 - i) * 86_400_000).toISOString().slice(0, 10),
      visitors,
      orders,
      revenue: Math.round(orders * (62 + 6 * Math.cos(i / 4))),
    }
  })
}

// Built once: a new array each render would hand the chart new data every time.
const defaultDays = sampleDays(180)

const defaultOrders: DashboardOrder[] = [
  { id: '3210', customer: 'Ana Ruiz', date: '2026-10-06', amount: 129, status: 'paid' },
  { id: '3209', customer: 'Tom Becker', date: '2026-10-06', amount: 89.5, status: 'pending' },
  { id: '3208', customer: 'Priya Natarajan', date: '2026-10-05', amount: 240, status: 'paid' },
  { id: '3207', customer: 'Leo Martins', date: '2026-10-05', amount: 54, status: 'refunded' },
  { id: '3206', customer: 'Sara Okafor', date: '2026-10-04', amount: 312.8, status: 'paid' },
]

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  refunded: 'outline',
}

const sum = (days: DashboardDay[], key: 'revenue' | 'orders' | 'visitors') =>
  days.reduce((total, day) => total + day[key], 0)

/** The change from `before` to `now`, as a fraction; undefined without a before. */
const change = (now: number, before: number) => (before > 0 ? (now - before) / before : undefined)

/**
 * A store's overview: four figures with their change against the previous period and a
 * sparkline, revenue over time, and the latest orders. The range switch recomputes all of it.
 * One column when narrow; the figures go two then four across, and the table scrolls sideways
 * rather than squeezing.
 */
function Dashboard01({
  title = 'Overview',
  description = 'How the store is doing.',
  days = defaultDays,
  orders = defaultOrders,
  defaultRange = '30d',
  onExport,
  currency = 'USD',
  locale = 'en-US',
  labels: labelsProp,
  className,
  ...props
}: Dashboard01Props) {
  const labels = {
    ...defaultLabels,
    ...labelsProp,
    ranges: { ...defaultLabels.ranges, ...labelsProp?.ranges },
    statuses: { ...defaultLabels.statuses, ...labelsProp?.statuses },
  }
  const headingId = React.useId()
  const [range, setRange] = React.useState<DashboardRange>(defaultRange)

  const span = spans[range]
  const current = days.slice(-span)
  const previous = days.slice(-2 * span, -span)
  const revenue = sum(current, 'revenue')
  const orderCount = sum(current, 'orders')
  const visitors = sum(current, 'visitors')
  const previousRevenue = sum(previous, 'revenue')
  const previousOrders = sum(previous, 'orders')
  const previousVisitors = sum(previous, 'visitors')
  const conversion = visitors > 0 ? orderCount / visitors : 0
  const previousConversion = previousVisitors > 0 ? previousOrders / previousVisitors : 0
  const average = orderCount > 0 ? revenue / orderCount : 0
  const previousAverage = previousOrders > 0 ? previousRevenue / previousOrders : 0
  const comparison = labels.comparison.replace('{range}', labels.ranges[range])

  const money = { style: 'currency', currency, maximumFractionDigits: 0 } as const
  const formatMoney = new Intl.NumberFormat(locale, { style: 'currency', currency })
  const formatDate = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  // Sparklines show the same days in at most 30 points, so 90 days stay readable.
  const step = Math.max(1, Math.ceil(current.length / 30))
  const trend = (pick: (day: DashboardDay) => number) =>
    current.filter((_, i) => i % step === 0).map(pick)

  return (
    <section
      data-slot="block-dashboard-01"
      aria-labelledby={headingId}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id={headingId} className="text-heading">
              {title}
            </h2>
            {description && <p className="mt-1 text-muted-foreground text-sm">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              aria-label={labels.range}
              value={range}
              onValueChange={(value) => setRange(value as DashboardRange)}
              size="sm"
            >
              {(Object.keys(spans) as DashboardRange[]).map((key) => (
                <SegmentedControlItem key={key} value={key}>
                  {labels.ranges[key]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(current)}>
                <DownloadIcon />
                {labels.export}
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          <MetricCard
            label={labels.revenue}
            value={revenue}
            locale={locale}
            format={money}
            delta={change(revenue, previousRevenue)}
            comparison={comparison}
            sparkline={<Sparkline data={trend((d) => d.revenue)} variant="area" height={32} />}
          />
          <MetricCard
            label={labels.orders}
            value={orderCount}
            locale={locale}
            delta={change(orderCount, previousOrders)}
            comparison={comparison}
            sparkline={<Sparkline data={trend((d) => d.orders)} height={32} />}
          />
          <MetricCard
            label={labels.conversion}
            value={conversion}
            locale={locale}
            format={{ style: 'percent', maximumFractionDigits: 2 }}
            delta={change(conversion, previousConversion)}
            comparison={comparison}
            sparkline={
              <Sparkline
                data={trend((d) => (d.visitors ? (d.orders / d.visitors) * 100 : 0))}
                variant="bar"
                height={32}
              />
            }
          />
          <MetricCard
            label={labels.averageOrder}
            value={average}
            locale={locale}
            format={{ style: 'currency', currency, maximumFractionDigits: 2 }}
            delta={change(average, previousAverage)}
            comparison={comparison}
            sparkline={
              <Sparkline data={trend((d) => (d.orders ? d.revenue / d.orders : 0))} height={32} />
            }
          />
        </div>

        <div className="rounded-xl border bg-card p-4 @3xl:p-6">
          <h3 className="mb-4 font-medium">{labels.revenueOverTime}</h3>
          <LineChart
            area
            curve="monotone"
            data={current as unknown as Record<string, unknown>[]}
            x="date"
            series={[{ key: 'revenue', label: labels.revenue }]}
            yFormat={(value) =>
              new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                notation: 'compact',
              }).format(value)
            }
            locale={locale}
            height={260}
          />
        </div>

        <div className="rounded-xl border bg-card">
          <h3 className="px-4 pt-4 font-medium @3xl:px-6 @3xl:pt-6">{labels.recentOrders}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="px-4 py-3 font-medium @3xl:px-6">
                    {labels.order}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.customer}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {labels.date}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {labels.amount}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium @3xl:pr-6">
                    {labels.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-muted-foreground @3xl:px-6">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{order.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate.format(new Date(order.date))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney.format(order.amount)}
                    </td>
                    <td className="px-4 py-3 @3xl:pr-6">
                      <Badge variant={statusVariant[order.status]}>
                        {labels.statuses[order.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Dashboard01 }
