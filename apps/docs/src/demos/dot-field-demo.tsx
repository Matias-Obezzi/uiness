import { DotField } from '@/components/ui/dot-field'

export default function DotFieldDemo() {
  return (
    <DotField className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Dot field</h3>
      <p className="max-w-sm text-muted-foreground text-sm">
        Swipe across it, or press to ring it.
      </p>
    </DotField>
  )
}
