import { BackgroundPaths } from '@/components/ui/background-paths'

export default function BackgroundPathsDemo() {
  return (
    <BackgroundPaths className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Flowing paths</h3>
      <p className="max-w-sm text-muted-foreground text-sm">Move the pointer through the ribbon.</p>
    </BackgroundPaths>
  )
}
