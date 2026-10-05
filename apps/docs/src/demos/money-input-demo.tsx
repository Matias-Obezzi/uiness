import { useState } from 'react'
import { Label } from '@/ui/label'
import { MoneyInput } from '@/ui/money-input'

export default function MoneyInputDemo() {
  const [usd, setUsd] = useState<number | null>(1234500)
  const [eur, setEur] = useState<number | null>(null)
  const [yen, setYen] = useState<number | null>(98000)
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="usd">Budget</Label>
        <MoneyInput id="usd" currency="USD" locale="en-US" value={usd} onValueChange={setUsd} />
        <p className="text-muted-foreground text-xs">
          Minor units: <code>{String(usd)}</code>
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="eur">Preis</Label>
        <MoneyInput
          id="eur"
          currency="EUR"
          locale="de-DE"
          value={eur}
          onValueChange={setEur}
          placeholder="0,00"
        />
        <p className="text-muted-foreground text-xs">
          Minor units: <code>{String(eur)}</code>
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="jpy">Fare</Label>
        <MoneyInput id="jpy" currency="JPY" locale="ja-JP" value={yen} onValueChange={setYen} />
        <p className="text-muted-foreground text-xs">
          Minor units: <code>{String(yen)}</code>
        </p>
      </div>
    </div>
  )
}
