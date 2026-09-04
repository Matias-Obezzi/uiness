import { Button } from '@/ui/button'
import { toast } from '@/ui/toast'

export default function ToastCustom() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.custom((t) => (
          <div className="flex items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
            <img src="/img/gallery-3-tiny.png" alt="" className="size-10 rounded-lg object-cover" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Ada shared an album</p>
              <p className="text-muted-foreground">Dusk at the lake, 6 photos</p>
            </div>
            <Button size="sm" onClick={() => toast.dismiss(t.id)}>
              View
            </Button>
          </div>
        ))
      }
    >
      Custom toast
    </Button>
  )
}
