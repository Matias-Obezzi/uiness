import { Warp } from '@/components/ui/warp'

export default function WarpDemo() {
  return (
    <div className="relative flex h-80 w-full touch-none select-none flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border bg-background">
      <Warp />
      <p className="relative font-semibold text-3xl tracking-tight">Into the void</p>
      <p className="relative text-muted-foreground text-sm">
        Press and hold to jump to light speed
      </p>
    </div>
  )
}
