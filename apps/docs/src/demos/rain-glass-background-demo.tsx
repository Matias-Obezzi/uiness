import { RainGlassBackground } from '@/components/ui/rain-glass-background'

export default function RainGlassBackgroundDemo() {
  return (
    <RainGlassBackground
      src="/img/gallery-1.png"
      className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]"
    >
      <h3 className="font-bold text-3xl tracking-tight">Rainy window</h3>
      <p className="max-w-sm text-white/85 text-sm">Drag across the glass to wipe the fog.</p>
    </RainGlassBackground>
  )
}
