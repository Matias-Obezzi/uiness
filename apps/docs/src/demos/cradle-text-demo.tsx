import { CradleText } from '@/components/ui/cradle-text'

export default function CradleTextDemo() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h3 className="font-bold text-5xl tracking-tight">
        <CradleText text="Momentum" />
      </h3>
      <p className="text-muted-foreground text-sm">Brush past a letter, or tap one at the end.</p>
    </div>
  )
}
