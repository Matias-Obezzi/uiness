import { ThreeViewer } from '@/components/ui/three-viewer'

export default function ThreeDemo() {
  return (
    <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border bg-muted/20">
      <ThreeViewer
        src="/models/chair.glb"
        alt="Sheen modern armchair"
        poster="/models/chair.webp"
        autoRotate
      />
    </div>
  )
}
