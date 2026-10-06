import { Button } from '@/ui/button'
import { Shimmer } from '@/ui/shimmer'

export default function ShimmerDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Shimmer className="font-bold text-4xl tracking-tight">Shimmering headline</Shimmer>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline">
          <Shimmer duration={2}>Generating…</Shimmer>
        </Button>
        {/* currentColor is the label color of whatever it sits in, here the primary button's. */}
        <Button>
          <Shimmer
            duration={2}
            color="color-mix(in oklab, currentColor 55%, transparent)"
            highlight="currentColor"
          >
            Thinking…
          </Shimmer>
        </Button>
      </div>
    </div>
  )
}
