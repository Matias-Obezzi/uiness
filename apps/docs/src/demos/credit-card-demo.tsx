import { useState } from 'react'
import { type CardDetails, CreditCardForm } from '@/components/ui/credit-card'

export default function CreditCardDemo() {
  const [details, setDetails] = useState<CardDetails | null>(null)
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CreditCardForm onChange={(_, next) => setDetails(next)} />
      <p className="text-muted-foreground text-sm">
        {details?.valid
          ? `Ready to pay with ${details.brand}.`
          : 'Try 4242 4242 4242 4242 (Visa) or 3782 822463 10005 (Amex).'}
      </p>
    </div>
  )
}
