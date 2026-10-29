import { PluckedText } from '@/components/ui/plucked-text'

export default function PluckedTextDemo() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h3 className="font-bold text-5xl tracking-tight">
        <PluckedText text="Resonance" />
      </h3>
      <p className="text-muted-foreground text-sm">Sweep across the string, or press it.</p>
    </div>
  )
}
