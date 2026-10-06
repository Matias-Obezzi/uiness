import { LayersIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/ui/bento-grid'

// The same grid twice on one screen: across the preview it has three columns, in a narrow
// column it stacks, because each one measures its own width and not the screen's.
export default function BentoGridColumn() {
  const cards = (
    <>
      <BentoCard
        span={2}
        icon={<LayersIcon />}
        title="Registry"
        description="The source lands in your project."
      />
      <BentoCard icon={<ZapIcon />} title="Fast" description="Nothing extra in your bundle." />
      <BentoCard
        span={3}
        icon={<SparklesIcon />}
        title="Motion"
        description="Eighteen pieces, no animation library."
      />
    </>
  )
  return (
    <div className="w-full space-y-6">
      <section className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs">Full width</p>
        <BentoGrid className="auto-rows-[minmax(7rem,auto)]">{cards}</BentoGrid>
      </section>
      <section className="max-w-xs space-y-2">
        <p className="font-medium text-muted-foreground text-xs">In a 20rem column</p>
        <BentoGrid className="auto-rows-[minmax(7rem,auto)]">{cards}</BentoGrid>
      </section>
    </div>
  )
}
