import { HomeIcon } from 'lucide-react'
import { useState } from 'react'
import { BreadcrumbTrail } from '@/ui/breadcrumb'
import { Slider } from '@/ui/slider'

const items = [
  { label: 'Home', href: '#', icon: <HomeIcon className="size-3.5" /> },
  { label: 'Workspace', href: '#workspace' },
  { label: 'Marketing site', href: '#site' },
  { label: 'Pages', href: '#pages' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Plans and billing FAQ' },
]

export default function BreadcrumbDemo() {
  const [width, setWidth] = useState(100)

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="rounded-lg border border-dashed p-3" style={{ width: `${width}%` }}>
        <BreadcrumbTrail items={items} maxItems={6} />
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <span className="shrink-0" aria-hidden="true">
          Width
        </span>
        <Slider
          aria-label="Width"
          min={35}
          max={100}
          value={[width]}
          onValueChange={([value]) => setWidth(value ?? 100)}
        />
      </div>
    </div>
  )
}
