import { ParallaxGrid } from '@/ui/parallax-grid'

const images = Array.from({ length: 12 }, (_, i) => `/img/gallery-${(i % 6) + 1}.png`)

export default function ParallaxGridDemo() {
  return (
    <div className="h-[28rem] w-full overflow-y-auto rounded-xl border p-4 [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_92%,transparent)]">
      <p className="py-10 text-center text-muted-foreground text-sm">Scroll inside this box.</p>
      <ParallaxGrid images={images} columns={3} />
      <p className="py-10 text-center text-muted-foreground text-sm">The columns drift apart.</p>
    </div>
  )
}
