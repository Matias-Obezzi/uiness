import { SwooshText } from '@/components/ui/swoosh-text'

export default function SwooshTextDemo() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h3 className="text-6xl sm:text-7xl">
        <SwooshText text="ZINC" />
      </h3>
      <p className="text-muted-foreground text-sm">Move the light across the letters.</p>
    </div>
  )
}
