import { Label } from '@/ui/label'
import { PasswordField } from '@/ui/password-field'

export default function PasswordFieldDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="new-password">New password</Label>
      <PasswordField id="new-password" strength placeholder="At least 12 characters" />
    </div>
  )
}
