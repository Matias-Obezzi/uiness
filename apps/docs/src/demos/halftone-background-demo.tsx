import { HalftoneBackground } from '@/components/ui/halftone-background'

export default function HalftoneBackgroundDemo() {
  return (
    <HalftoneBackground
      src="/img/gallery-6.png"
      className="flex h-80 w-full items-center justify-center rounded-xl border p-6 text-center"
    >
      <div className="flex flex-col gap-1 rounded-lg bg-background/85 px-5 py-3">
        <h3 className="font-bold text-3xl tracking-tight">Halftone</h3>
        <p className="max-w-sm text-muted-foreground text-sm">Hover for the loupe.</p>
      </div>
    </HalftoneBackground>
  )
}
