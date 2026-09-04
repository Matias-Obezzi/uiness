import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export default function InputWithLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invalid">With an error</Label>
        <Input id="invalid" aria-invalid defaultValue="not an email" />
      </div>
      <div className="flex gap-2">
        <Input placeholder="Search" />
        <Button variant="secondary">Go</Button>
      </div>
    </div>
  )
}
