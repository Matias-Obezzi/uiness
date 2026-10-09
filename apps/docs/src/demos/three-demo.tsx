import { ThreeViewer } from '@/components/ui/three-viewer'

export default function ThreeDemo() {
  return (
    // The viewer has no height of its own: size it, not a box around it.
    <ThreeViewer
      src="/models/chair.glb"
      alt="Sheen modern armchair"
      poster="/models/chair.webp"
      autoRotate
      className="aspect-[4/3] w-full max-w-2xl"
    />
  )
}
