import { Sparkline } from '@/components/ui/sparkline'

const data = [4, 6, 5, 9, 7, 11, 8, 12, 10, 14, 13, 16]

export default function SparklineVariants() {
  return (
    <div className="grid w-full max-w-sm gap-6 text-sm">
      <p className="leading-7">
        Deploys this week{' '}
        <Sparkline data={data} width={72} height={20} aria-label="Deploys rising from 4 to 16" />{' '}
        <span className="font-medium">16</span>
      </p>
      <div className="grid grid-cols-3 gap-4">
        <figure className="grid gap-2">
          <Sparkline data={data} width={96} height={32} />
          <figcaption className="text-muted-foreground text-xs">line</figcaption>
        </figure>
        <figure className="grid gap-2">
          <Sparkline data={data} width={96} height={32} variant="area" color="var(--chart-2)" />
          <figcaption className="text-muted-foreground text-xs">area</figcaption>
        </figure>
        <figure className="grid gap-2">
          <Sparkline data={data} width={96} height={32} variant="bar" color="var(--chart-3)" />
          <figcaption className="text-muted-foreground text-xs">bar</figcaption>
        </figure>
      </div>
    </div>
  )
}
