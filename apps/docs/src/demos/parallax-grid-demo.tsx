import { ParallaxGrid } from '@/components/ui/parallax-grid'

const images = Array.from({ length: 12 }, (_, i) => `/img/gallery-${(i % 6) + 1}.png`)

export default function ParallaxGridDemo() {
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region has to take focus to scroll by keyboard
      tabIndex={0}
      aria-label="Gallery"
      className="h-[28rem] w-full overflow-y-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-xl border p-4 [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_92%,transparent)]"
    >
      <p className="py-10 text-center text-muted-foreground text-sm">Scroll inside this box.</p>
      <ParallaxGrid images={images} columns={3} />
      <p className="py-10 text-center text-muted-foreground text-sm">The columns drift apart.</p>
    </section>
  )
}
