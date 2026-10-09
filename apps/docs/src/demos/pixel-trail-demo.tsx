import { PixelTrail } from '@/components/ui/pixel-trail'

export default function PixelTrailDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border bg-background">
      <PixelTrail pixelSize={20} />
      <p className="pointer-events-none relative font-semibold text-3xl tracking-tight">
        Move the pointer here
      </p>
    </div>
  )
}
