import { Button } from '@/components/ui/button'
import { ShapeHero } from '@/components/ui/shape-hero'

export default function ShapeHeroDemo() {
  return (
    <ShapeHero className="flex h-96 w-full flex-col items-center gap-3 rounded-xl border px-6 pt-12 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Build with blocks</h3>
      <p className="max-w-sm text-muted-foreground text-sm">Grab a shape and throw it.</p>
      <Button className="relative z-10">Get started</Button>
    </ShapeHero>
  )
}
