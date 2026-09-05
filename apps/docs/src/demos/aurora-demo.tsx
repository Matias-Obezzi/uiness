import { Aurora } from '@/ui/aurora'

export default function AuroraDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border bg-background">
      <Aurora />
      <div className="relative text-center">
        <h2 className="font-bold text-3xl tracking-tight">Northern lights</h2>
        <p className="mt-2 text-muted-foreground">Three blobs, blurred and drifting.</p>
      </div>
    </div>
  )
}
