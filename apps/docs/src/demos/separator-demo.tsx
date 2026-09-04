import { Separator } from '@/ui/separator'

export default function SeparatorDemo() {
  return (
    <div>
      <div className="space-y-1">
        <p className="font-medium text-sm">uiness</p>
        <p className="text-muted-foreground text-sm">React UI primitives with a bit of magic.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Components</span>
        <Separator orientation="vertical" />
        <span>GitHub</span>
      </div>
    </div>
  )
}
