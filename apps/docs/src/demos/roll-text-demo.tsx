import { ArrowUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RollText } from '@/components/ui/roll-text'

export default function RollTextDemo() {
  return (
    <div className="flex flex-col items-center gap-8">
      <a
        href="#roll"
        className="relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-[min(0px,calc((100%_-_44px)/2))] pointer-coarse:after:inset-y-[min(0px,calc((100%_-_44px)/2))] font-semibold text-4xl tracking-tight"
      >
        <RollText text="Hover me" />
      </a>
      <div className="flex flex-wrap justify-center gap-3">
        <Button>
          <RollText text="Get started" />
        </Button>
        <Button variant="outline">
          <RollText text="Read the docs" stagger={15} />
          <ArrowUpRightIcon />
        </Button>
      </div>
    </div>
  )
}
