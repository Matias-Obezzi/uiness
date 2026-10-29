import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReceiptPrinter } from '@/components/ui/receipt-printer'

export default function ReceiptPrinterDemo() {
  const [round, setRound] = useState(0)
  const [torn, setTorn] = useState(false)
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ReceiptPrinter
        key={round}
        title="Café Lumen"
        onTear={() => setTorn(true)}
        lines={[
          { label: 'Oat latte', amount: 4.5 },
          { label: 'Almond croissant', amount: 3.8 },
          { label: 'Sparkling water', amount: 2.2 },
          { label: 'Tip', amount: 1.5 },
        ]}
      />
      {torn && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTorn(false)
            setRound(round + 1)
          }}
        >
          Print another
        </Button>
      )}
    </div>
  )
}
