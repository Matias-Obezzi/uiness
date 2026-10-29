import { ArrowRightIcon } from 'lucide-react'
import { AttractButton } from '@/components/ui/attract-button'

export default function AttractButtonDemo() {
  return (
    <AttractButton>
      Start building
      <ArrowRightIcon aria-hidden="true" />
    </AttractButton>
  )
}
