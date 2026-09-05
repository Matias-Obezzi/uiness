import { Button } from '@/ui/button'
import { Shimmer } from '@/ui/shimmer'

export default function ShimmerDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Shimmer className="font-bold text-4xl tracking-tight">Shimmering headline</Shimmer>
      <Button variant="outline">
        <Shimmer duration={2}>Generating…</Shimmer>
      </Button>
    </div>
  )
}
