import { ScrollArea } from '@/ui/scroll-area'
import { Separator } from '@/ui/separator'

const tags = Array.from({ length: 24 }, (_, i) => `v1.2.0-beta.${24 - i}`)

export default function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-56 w-56 rounded-lg border">
      <div className="p-4">
        <p className="font-medium text-sm leading-none">Tags</p>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="py-2 text-sm">{tag}</div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
