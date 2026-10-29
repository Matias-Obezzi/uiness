import { useState } from 'react'
import { AmountPad } from '@/components/ui/amount-pad'
import { Button } from '@/components/ui/button'

export default function AmountPadDemo() {
  const [amount, setAmount] = useState(0)
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <AmountPad value={amount} onValueChange={setAmount} currency="USD" />
      <Button className="w-full" disabled={!amount}>
        Send
      </Button>
    </div>
  )
}
