import { CausticsBackground } from '@/components/ui/caustics-background'

export default function CausticsBackgroundDemo() {
  return (
    <CausticsBackground className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h3 className="font-bold text-3xl tracking-tight">Pool floor</h3>
      <p className="max-w-sm text-white/85 text-sm">Press to drop a ring into the water.</p>
    </CausticsBackground>
  )
}
