import { ChevronDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const settings = [
  { id: 'comments', label: 'New comments on my posts', on: true },
  { id: 'mentions', label: 'Mentions and replies', on: true },
  { id: 'digest', label: 'Weekly digest', on: false },
]

export default function CollapsibleDemo() {
  const enabled = settings.filter((s) => s.on).length

  return (
    <Collapsible defaultOpen className="w-full max-w-md rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h4 className="font-medium text-sm">Email notifications</h4>
          <Badge variant="secondary">{enabled} on</Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 [&[data-state=open]>svg]:rotate-180"
          >
            <ChevronDownIcon className="transition-transform duration-(--duration-normal,200ms)" />
            <span className="sr-only">Toggle email notifications</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-4 border-t px-4 py-4">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4">
            <Label htmlFor={`collapsible-${s.id}`} className="font-normal">
              {s.label}
            </Label>
            <Switch id={`collapsible-${s.id}`} defaultChecked={s.on} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
