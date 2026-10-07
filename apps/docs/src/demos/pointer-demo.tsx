import { Pointer } from '@/components/ui/pointer'

export default function PointerDemo() {
  return (
    <div className="relative flex min-h-64 w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border bg-muted/30 p-8">
      <Pointer>
        <div className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground text-xs shadow-lg">
          <span className="size-2 rounded-full bg-emerald-400" />
          Figma Cursor
        </div>
      </Pointer>

      <div className="text-center">
        <h3 className="font-semibold text-lg">Custom Region Cursor</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Move your cursor around this card to see the custom pointer.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <input
          type="text"
          placeholder="Hover here for native text cursor..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}
