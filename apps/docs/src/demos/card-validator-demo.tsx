import { useCardInfo } from '@uiness/card-validator/react'
import { useState } from 'react'
import { CreditCardForm } from '@/components/ui/credit-card'

export default function CardValidatorDemo() {
  const [number, setNumber] = useState('')
  const info = useCardInfo(number)
  const facts = info && [info.bank, info.type, info.prepaid && 'prepaid', info.country]
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CreditCardForm
        issuer={info?.issuer ?? info?.bank}
        onChange={(card) => setNumber(card.number)}
      />
      <p className="text-center text-muted-foreground text-sm">
        {facts
          ? facts.filter(Boolean).join(' · ')
          : 'Type the first 6 digits of any card: only those are sent.'}
      </p>
    </div>
  )
}
