import { Heart, Inbox, Send } from 'lucide-react'
import { Button } from '@/ui/button'
import { Ripple } from '@/ui/ripple'

export default function RippleDemo() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Ripple asChild>
          <Button>
            <Send />
            Send
          </Button>
        </Ripple>
        <Ripple asChild>
          <Button variant="secondary">Secondary</Button>
        </Ripple>
        <Ripple asChild color="var(--primary)" opacity={0.12}>
          <Button variant="outline">Outline</Button>
        </Ripple>
        <Ripple asChild>
          <Button variant="destructive">Delete</Button>
        </Ripple>
        <Ripple asChild center>
          <Button variant="ghost" size="icon" aria-label="Like" className="rounded-full">
            <Heart />
          </Button>
        </Ripple>
      </div>
      <Ripple asChild color="var(--primary)" opacity={0.1} duration={800} fade={600}>
        <button
          type="button"
          className="flex w-full select-none items-center gap-4 rounded-xl border bg-card p-5 text-left text-card-foreground shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Inbox className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Inbox zero</span>
            <span className="text-muted-foreground text-sm">
              Press anywhere on this card, or focus it and hit Enter.
            </span>
          </span>
        </button>
      </Ripple>
    </div>
  )
}
