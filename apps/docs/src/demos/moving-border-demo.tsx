import { MovingBorder } from '@/ui/moving-border'

export default function MovingBorderDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <MovingBorder asChild radius="9999px">
        <button type="button" className="font-medium text-sm">
          <span className="px-5 py-2">Get started</span>
        </button>
      </MovingBorder>
      <MovingBorder color="oklch(0.75 0.18 200)" duration={3} innerClassName="p-5">
        <div className="w-56">
          <h3 className="font-semibold">A card</h3>
          <p className="mt-1 text-muted-foreground text-sm">Any color, any radius.</p>
        </div>
      </MovingBorder>
    </div>
  )
}
