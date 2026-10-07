import { Button } from '@/components/ui/button'
import { SmoothCursor } from '@/components/ui/smooth-cursor'

export default function SmoothCursorDemo() {
  return (
    <div className="relative flex min-h-72 w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border bg-muted/20 p-8">
      <SmoothCursor scope="parent" />

      <div className="text-center">
        <h3 className="font-semibold text-lg">Smooth Spring Cursor</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Follows with realistic spring physics, rotates into turns, and grows over buttons.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button>Hover button</Button>
        <Button variant="outline">Interactive element</Button>
      </div>
    </div>
  )
}
