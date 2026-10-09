import { FlickeringGrid } from '@/components/ui/flickering-grid'

export default function FlickeringGridDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border bg-background">
      <FlickeringGrid className="[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <p className="relative font-semibold text-3xl tracking-tight">Signal acquired</p>
    </div>
  )
}
