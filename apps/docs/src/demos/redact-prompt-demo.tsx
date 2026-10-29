import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RedactPrompt, redact, restore } from '@/components/ui/redact-prompt'

const terms = ['Marta Gómez', 'Acme']

export default function RedactPromptDemo() {
  const [value, setValue] = useState(
    'Draft a reply to Marta Gómez (marta@acme.io, +34 612 345 678) about the refund to card 4111 1111 1111 1111. Our Acme key is sk-live4f8a9c2b7d1e6f3a.',
  )
  const [reply, setReply] = useState('')
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <RedactPrompt value={value} onValueChange={setValue} terms={terms} />
      <Button
        size="sm"
        className="self-end"
        onClick={() => {
          const { redactions } = redact(value, terms)
          // What a model would answer, using only the placeholders it saw.
          const answer =
            'Hi [TERM_1], the refund to [CARD_1] is on its way. Reply to [EMAIL_1] with any questions.'
          setReply(restore(answer, redactions))
        }}
      >
        Send
      </Button>
      {reply && <p className="rounded-2xl bg-muted px-3.5 py-2 text-sm">{reply}</p>}
    </div>
  )
}
