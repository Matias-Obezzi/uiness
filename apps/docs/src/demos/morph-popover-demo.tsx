import { MessageSquareIcon } from 'lucide-react'
import { MorphPopover } from '@/components/ui/morph-popover'
import { Textarea } from '@/components/ui/textarea'

export default function MorphPopoverDemo() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center pt-6">
      <MorphPopover
        label="Feedback"
        icon={<MessageSquareIcon aria-hidden="true" />}
        confirmation="Thanks for the feedback!"
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))}
      >
        <Textarea
          name="message"
          aria-label="Your feedback"
          placeholder="What could be better?"
          required
        />
      </MorphPopover>
    </div>
  )
}
