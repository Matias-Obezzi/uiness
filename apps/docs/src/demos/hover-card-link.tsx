import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

export default function HoverCardLink() {
  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger
        href="#release"
        className="font-medium text-sm underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground"
      >
        Release notes 4.2
      </HoverCardTrigger>
      <HoverCardContent arrow className="w-80 p-0">
        <img src="/img/gallery-5.png" alt="" className="h-32 w-full rounded-t-lg object-cover" />
        <div className="space-y-1 p-4">
          <p className="font-medium text-sm">Release notes 4.2</p>
          <p className="text-muted-foreground text-sm">
            Faster builds, a new tree view and pagination that fits on phones.
          </p>
          <p className="pt-1 text-muted-foreground text-xs">uiness.dev · 3 min read</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
