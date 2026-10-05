import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ScrollFade } from '@/ui/scroll-fade'

const topics = [
  'All',
  'Design',
  'Engineering',
  'Product',
  'Research',
  'Marketing',
  'Sales',
  'Support',
  'Operations',
  'Finance',
  'Legal',
  'People',
]

export default function ScrollFadeHorizontal() {
  const [topic, setTopic] = useState('All')
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <ScrollFade orientation="horizontal" size={32} hideScrollbar>
        <div className="flex w-max gap-2 py-1">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3 text-sm transition-colors',
                topic === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </ScrollFade>
      <p className="text-muted-foreground text-sm">
        Showing <span className="font-medium text-foreground">{topic}</span>. Scroll the row
        sideways: each edge fades only while there is more past it.
      </p>
    </div>
  )
}
