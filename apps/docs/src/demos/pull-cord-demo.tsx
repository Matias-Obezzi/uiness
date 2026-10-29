import { useState } from 'react'
import { PullCord } from '@/components/ui/pull-cord'
import { cn } from '@/lib/utils'

export default function PullCordDemo() {
  const [on, setOn] = useState(false)
  return (
    <div
      className={cn(
        'flex w-full max-w-xs flex-col items-center rounded-2xl pt-0 pb-6 transition-colors duration-500',
        on ? 'bg-amber-100 dark:bg-amber-400/15' : 'bg-muted/40',
      )}
    >
      {/* The lamp shade the cord hangs from. */}
      <div
        aria-hidden="true"
        className={cn(
          'h-10 w-28 rounded-b-[3rem] transition-[background-color,box-shadow] duration-500',
          on
            ? 'bg-amber-300 shadow-[0_20px_60px_10px_rgb(251_191_36/0.5)]'
            : 'bg-muted-foreground/30',
        )}
      />
      <PullCord checked={on} onCheckedChange={setOn} className="-mt-1" />
      <p className="text-muted-foreground text-sm">Pull the cord</p>
    </div>
  )
}
