import { useState } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/ui/input-otp'
import { Label } from '@/ui/label'

export default function InputOTPDemo() {
  const [code, setCode] = useState('')
  const [done, setDone] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <Label htmlFor="code">Verification code</Label>
      <InputOTP
        id="code"
        value={code}
        onValueChange={(v) => {
          setCode(v)
          setDone(false)
        }}
        onComplete={() => setDone(true)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-muted-foreground text-sm">
        {done ? `Checking ${code}…` : 'Six digits. Try pasting one in.'}
      </p>
    </div>
  )
}
