import { TopoBackground } from '@/components/ui/topo-background'

export default function TopoBackgroundDemo() {
  return (
    <TopoBackground className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Topography</h3>
      <p className="max-w-sm text-muted-foreground text-sm">
        A hill rises under the pointer; a press ripples.
      </p>
    </TopoBackground>
  )
}
