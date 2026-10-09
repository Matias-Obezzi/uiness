import { ArrowUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RollText } from '@/components/ui/roll-text'

export default function RollTextDemo() {
  return (
    <div className="flex flex-col items-center gap-8">
      <a href="#roll" className="font-semibold text-4xl tracking-tight">
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
