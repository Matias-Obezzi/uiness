import { RetroGrid } from '@/components/ui/retro-grid'

export default function RetroGridDemo() {
  return (
    <div className="relative flex h-80 w-full flex-col items-center overflow-hidden rounded-xl border bg-background pt-16">
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-radial-[ellipse_at_50%_100%] from-fuchsia-500/25 via-transparent to-transparent"
      />
      <RetroGrid angle={62} lineColor="oklch(0.67 0.26 322 / 0.55)" />
      <p className="relative text-eyebrow text-muted-foreground uppercase">Now playing</p>
      <h2 className="relative mt-2 bg-linear-to-b from-amber-300 via-pink-500 to-fuchsia-600 bg-clip-text text-display text-transparent">
        Night Drive
      </h2>
    </div>
  )
}
