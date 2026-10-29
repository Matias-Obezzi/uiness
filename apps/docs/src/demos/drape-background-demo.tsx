import { DrapeBackground } from '@/components/ui/drape-background'

export default function DrapeBackgroundDemo() {
  return (
    <DrapeBackground className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center text-primary-foreground">
      <h3 className="font-bold text-3xl tracking-tight">Drape</h3>
      <p className="max-w-sm text-primary-foreground/80 text-sm">Push the curtain aside.</p>
    </DrapeBackground>
  )
}
