import { Label } from '@/components/ui/label'
import { PasswordField } from '@/components/ui/password-field'

const rules = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'Not your username', test: (p: string) => !!p && !p.toLowerCase().includes('otto') },
]

export default function PasswordFieldRules() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="rules-password">Password for otto</Label>
      <PasswordField id="rules-password" rules={rules} />
    </div>
  )
}
