import { Pattern } from '@/ui/pattern'
import { Spotlight } from '@/ui/spotlight'

export default function SpotlightDemo() {
  return (
    <Spotlight className="flex h-72 w-full items-center justify-center rounded-xl border bg-background">
      <Pattern variant="dots" />
      <div className="relative text-center">
        <h2 className="font-bold text-3xl tracking-tight">Move the pointer around</h2>
        <p className="mt-2 text-muted-foreground">The light follows it and fades when it leaves.</p>
      </div>
    </Spotlight>
  )
}
