import { InkBackground } from '@/components/ui/ink-background'

export default function InkBackgroundDemo() {
  return (
    <InkBackground
      text="Write in water"
      className="flex h-80 w-full items-end justify-center rounded-xl border p-6 text-center"
    >
      <p className="text-muted-foreground text-sm">Stir the words; press to drop ink.</p>
    </InkBackground>
  )
}
