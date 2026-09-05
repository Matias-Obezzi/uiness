import { NumberTicker } from '@/ui/number-ticker'

const stats = [
  { label: 'Downloads', value: 128400 },
  { label: 'Stars', value: 4210 },
  { label: 'Uptime', value: 99.98, decimals: 2, suffix: '%' },
]

export default function NumberTickerDemo() {
  return (
    <div className="grid w-full gap-6 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border p-5 text-center">
          <p className="font-bold text-3xl tracking-tight">
            <NumberTicker value={s.value} decimals={s.decimals} />
            {s.suffix}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
