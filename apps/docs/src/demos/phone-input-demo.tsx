import { useState } from 'react'
import { Label } from '@/ui/label'
import { PhoneInput } from '@/ui/phone-input'

export default function PhoneInputDemo() {
  const [phone, setPhone] = useState('')
  const [complete, setComplete] = useState(false)
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="phone">Phone</Label>
      <PhoneInput
        id="phone"
        defaultCountry="US"
        value={phone}
        onValueChange={(value, details) => {
          setPhone(value)
          setComplete(details.complete)
        }}
      />
      <p className="text-muted-foreground text-sm">
        E.164: <code>{phone || '—'}</code>
        {phone && (complete ? ' · looks complete' : ' · keep typing')}
      </p>
    </div>
  )
}
