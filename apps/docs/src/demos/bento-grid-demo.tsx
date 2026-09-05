import { ImageIcon, LayersIcon, SparklesIcon, TimerIcon, ZapIcon } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/ui/bento-grid'
import { Pattern } from '@/ui/pattern'

const header = (src: string) => <img src={src} alt="" className="size-full object-cover" />

export default function BentoGridDemo() {
  return (
    <BentoGrid className="w-full">
      <BentoCard
        span={2}
        icon={<ImageIcon />}
        title="Images that load with care"
        description="Blur, pixels, reveals and real download progress."
        header={header('/img/gallery-1.png')}
      />
      <BentoCard
        icon={<SparklesIcon />}
        title="Motion"
        description="Eighteen pieces, no animation library."
        header={
          <div className="relative size-full bg-muted">
            <Pattern variant="dots" size={16} />
          </div>
        }
      />
      <BentoCard
        icon={<ZapIcon />}
        title="Zero dependencies"
        description="The packages carry nothing extra into your bundle."
      />
      <BentoCard
        span={2}
        icon={<LayersIcon />}
        title="A registry, not a dependency"
        description="The source lands in your project. From then on it is yours."
        header={header('/img/gallery-4.png')}
      />
      <BentoCard
        span={3}
        icon={<TimerIcon />}
        title="Scroll-linked"
        description="Progress, parallax and the active section, measured once per frame."
        header={header('/img/gallery-6.png')}
        className="md:min-h-56"
      />
    </BentoGrid>
  )
}
