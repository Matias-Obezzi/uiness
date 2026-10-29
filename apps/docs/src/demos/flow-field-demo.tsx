import { FlowField } from '@/components/ui/flow-field'

export default function FlowFieldDemo() {
  return (
    <FlowField className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Flow field</h3>
      <p className="max-w-sm text-muted-foreground text-sm">
        Move through the streamlines; press to scatter them.
      </p>
    </FlowField>
  )
}
