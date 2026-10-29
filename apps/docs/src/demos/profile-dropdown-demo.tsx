import { useState } from 'react'
import {
  ProfileDropdown,
  type ProfileStatus,
  type ProfileTheme,
} from '@/components/ui/profile-dropdown'

const accounts = [
  { id: 'work', name: 'Ines Duarte', email: 'ines@studio.io', avatar: '/img/gallery-1.png' },
  { id: 'personal', name: 'Ines', email: 'ines.d@mail.net' },
]

export default function ProfileDropdownDemo() {
  const [current, setCurrent] = useState('work')
  const [status, setStatus] = useState<ProfileStatus>('online')
  const [theme, setTheme] = useState<ProfileTheme>('system')
  const [signedOut, setSignedOut] = useState(false)
  if (signedOut)
    return (
      <button
        type="button"
        onClick={() => setSignedOut(false)}
        className="text-sm underline underline-offset-4"
      >
        Signed out. Sign back in
      </button>
    )
  return (
    <div className="flex min-h-96 items-start pt-4">
      <ProfileDropdown
        accounts={accounts}
        current={current}
        onAccountChange={setCurrent}
        status={status}
        onStatusChange={setStatus}
        theme={theme}
        onThemeChange={setTheme}
        onSignOut={() => setSignedOut(true)}
      />
    </div>
  )
}
