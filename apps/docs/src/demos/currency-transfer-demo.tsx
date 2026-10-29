import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CurrencyTransfer } from '@/components/ui/currency-transfer'

const steps = [
  { label: 'Payment received', detail: 'From your account ending 4821' },
  { label: 'Converted to euros', detail: 'At the rate locked for 30 minutes' },
  { label: 'Sent to the bank', detail: 'Banco Atlântico' },
  { label: 'Delivered', detail: 'Usually within minutes' },
]

export default function CurrencyTransferDemo() {
  const [current, setCurrent] = useState(0)
  // One step every 1.5s, as the transfer goes through.
  useEffect(() => {
    if (current > steps.length) return
    const timer = setTimeout(() => setCurrent(current + 1), 1500)
    return () => clearTimeout(timer)
  }, [current])
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <CurrencyTransfer
        amount={250}
        from="USD"
        to="EUR"
        rate={0.9214}
        steps={steps}
        current={current}
        reference="WX-7Q42-K9LM"
      />
      <Button variant="outline" size="sm" onClick={() => setCurrent(0)}>
        Send again
      </Button>
    </div>
  )
}
