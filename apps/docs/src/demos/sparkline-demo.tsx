import { Sparkline } from '@/components/ui/sparkline'

// Made up closing prices over twenty days, the same on every render.
const walk = (seed: number, start: number, drift: number) =>
  Array.from({ length: 20 }, (_, i) =>
    Number((start + drift * i + Math.sin(i * 0.9 + seed) * start * 0.04).toFixed(2)),
  )

const rows = [
  { symbol: 'ORSN', name: 'Orrin Systems', data: walk(1, 120, 0.9) },
  { symbol: 'VLTA', name: 'Velta', data: walk(4, 84, -0.6) },
  { symbol: 'QLLN', name: 'Quillon', data: walk(2, 42, 0.1) },
]

const days = Array.from({ length: 20 }, (_, i) =>
  new Date(2026, 8, i + 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
)

export default function SparklineDemo() {
  return (
    <div className="grid w-full max-w-md gap-1">
      {rows.map((row) => {
        const last = row.data[row.data.length - 1] ?? 0
        const first = row.data[0] ?? 0
        const change = (last - first) / first
        return (
          <div key={row.symbol} className="flex items-center gap-4 rounded-lg px-3 py-2">
            <div className="w-24 shrink-0">
              <div className="font-medium text-sm">{row.symbol}</div>
              <div className="truncate text-muted-foreground text-xs">{row.name}</div>
            </div>
            <Sparkline
              data={row.data}
              labels={days}
              variant="area"
              height={36}
              markers={['min', 'max', 'last']}
              format={(v) => `$${v.toFixed(2)}`}
              tooltip
              className="flex-1"
            />
            <div className="w-20 shrink-0 text-right">
              <div className="font-medium text-sm tabular-nums">${last.toFixed(2)}</div>
              <div className="text-muted-foreground text-xs tabular-nums">
                {change >= 0 ? '+' : ''}
                {(change * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
