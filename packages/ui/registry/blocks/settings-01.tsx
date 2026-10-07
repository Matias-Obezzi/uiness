'use client'

import { BellIcon, CheckIcon, type LucideIcon, TriangleAlertIcon, UserIcon } from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoldToConfirm } from '@/components/ui/hold-to-confirm'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface SettingsProfile {
  name: string
  email: string
  bio: string
  avatar?: string
}

export interface SettingsNotification {
  id: string
  label: string
  description?: string
  enabled: boolean
}

export interface Settings01Labels {
  sections: string
  profile: string
  profileDescription: string
  name: string
  email: string
  bio: string
  save: string
  saved: string
  notifications: string
  notificationsDescription: string
  danger: string
  dangerDescription: string
  deleteAccount: string
  deleted: string
}

export interface Settings01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  title?: React.ReactNode
  profile?: SettingsProfile
  /** Called with the edited profile. Return a promise to keep the button busy until it settles. */
  onSaveProfile?: (profile: SettingsProfile) => unknown
  notifications?: SettingsNotification[]
  /** Called each time a switch flips. */
  onNotificationChange?: (id: string, enabled: boolean) => void
  /** Runs once the delete button has been held. `null` hides the danger zone. */
  onDeleteAccount?: (() => unknown) | null
  labels?: Partial<Settings01Labels>
}

const defaultLabels: Settings01Labels = {
  sections: 'Settings sections',
  profile: 'Profile',
  profileDescription: 'How others see you across the workspace.',
  name: 'Name',
  email: 'Email',
  bio: 'Bio',
  save: 'Save changes',
  saved: 'Saved',
  notifications: 'Notifications',
  notificationsDescription: 'What we tell you about, and when.',
  danger: 'Danger zone',
  dangerDescription:
    'Deleting your account removes your plans, tasks and history. It cannot be undone.',
  deleteAccount: 'Hold to delete account',
  deleted: 'Account deleted',
}

const defaultProfile: SettingsProfile = {
  name: 'Ana Ruiz',
  email: 'ana@example.com',
  bio: 'Planning the week so the team does not have to.',
  avatar: '/img/gallery-1-tiny.png',
}

const defaultNotifications: SettingsNotification[] = [
  {
    id: 'digest',
    label: 'Weekly digest',
    description: 'A summary of the week ahead, every Monday at 8.',
    enabled: true,
  },
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'When someone mentions you in a task or a comment.',
    enabled: true,
  },
  {
    id: 'product',
    label: 'Product updates',
    description: 'New features, at most once a month.',
    enabled: false,
  },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

/**
 * An account settings page: profile details with a save that waits for you, notification
 * switches that apply as they flip, and a danger zone whose delete button has to be held.
 * The section list sits beside the sections when there is room and above them when not.
 */
function Settings01({
  title = 'Settings',
  profile: initialProfile = defaultProfile,
  onSaveProfile,
  notifications: initialNotifications = defaultNotifications,
  onNotificationChange,
  onDeleteAccount = () => {},
  labels: labelsProp,
  className,
  ...props
}: Settings01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = React.useId()
  const [profile, setProfile] = React.useState(initialProfile)
  // What was last saved: the form is dirty against it, not against the first props.
  const [baseline, setBaseline] = React.useState(initialProfile)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [notifications, setNotifications] = React.useState(initialNotifications)
  const dirty =
    profile.name !== baseline.name ||
    profile.email !== baseline.email ||
    profile.bio !== baseline.bio

  const sections: { id: string; label: string; icon: LucideIcon }[] = [
    { id: `${id}-profile`, label: labels.profile, icon: UserIcon },
    { id: `${id}-notifications`, label: labels.notifications, icon: BellIcon },
    ...(onDeleteAccount
      ? [{ id: `${id}-danger`, label: labels.danger, icon: TriangleAlertIcon }]
      : []),
  ]

  const edit =
    (key: keyof SettingsProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false)
      setProfile((current) => ({ ...current, [key]: e.target.value }))
    }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSaveProfile?.(profile)
      setBaseline(profile)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const flip = (target: string, enabled: boolean) => {
    setNotifications((list) => list.map((n) => (n.id === target ? { ...n, enabled } : n)))
    onNotificationChange?.(target, enabled)
  }

  return (
    <section
      data-slot="block-settings-01"
      aria-labelledby={`${id}-title`}
      className={cn('@container w-full', className)}
      {...props}
    >
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 @3xl:grid-cols-[12rem_1fr] @3xl:gap-12">
        <div>
          <h2 id={`${id}-title`} className="text-heading">
            {title}
          </h2>
          <nav aria-label={labels.sections} className="mt-4 @3xl:sticky @3xl:top-6">
            <ul className="flex gap-1 overflow-x-auto @3xl:flex-col">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <section.icon className="size-4" />
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex min-w-0 flex-col gap-10">
          <form
            id={`${id}-profile`}
            aria-labelledby={`${id}-profile-title`}
            onSubmit={save}
            className="scroll-mt-6 rounded-xl border bg-card"
          >
            <div className="p-6">
              <h3 id={`${id}-profile-title`} className="text-subheading">
                {labels.profile}
              </h3>
              <p className="mt-1 text-muted-foreground text-sm">{labels.profileDescription}</p>
              <div className="mt-6 flex items-center gap-4">
                <Avatar className="size-14">
                  {profile.avatar && <AvatarImage src={profile.avatar} alt="" />}
                  <AvatarFallback>{initials(profile.name || '?')}</AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-6 grid gap-4 @xl:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-name`}>{labels.name}</Label>
                  <Input
                    id={`${id}-name`}
                    value={profile.name}
                    onChange={edit('name')}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-email`}>{labels.email}</Label>
                  <Input
                    id={`${id}-email`}
                    type="email"
                    value={profile.email}
                    onChange={edit('email')}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-2 @xl:col-span-2">
                  <Label htmlFor={`${id}-bio`}>{labels.bio}</Label>
                  <Textarea id={`${id}-bio`} value={profile.bio} onChange={edit('bio')} rows={3} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              {saved && !dirty && (
                <span
                  role="status"
                  className="flex items-center gap-1 text-muted-foreground text-sm"
                >
                  <CheckIcon className="size-4" />
                  {labels.saved}
                </span>
              )}
              <Button type="submit" loading={saving} disabled={!dirty && !saving}>
                {labels.save}
              </Button>
            </div>
          </form>

          <section
            id={`${id}-notifications`}
            aria-labelledby={`${id}-notifications-title`}
            className="scroll-mt-6 rounded-xl border bg-card p-6"
          >
            <h3 id={`${id}-notifications-title`} className="text-subheading">
              {labels.notifications}
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">{labels.notificationsDescription}</p>
            <ul className="mt-4 divide-y">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-6 py-4 last:pb-0">
                  <div>
                    <Label htmlFor={`${id}-n-${n.id}`}>{n.label}</Label>
                    {n.description && (
                      <p id={`${id}-n-${n.id}-d`} className="mt-1 text-muted-foreground text-sm">
                        {n.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    id={`${id}-n-${n.id}`}
                    checked={n.enabled}
                    onCheckedChange={(enabled) => flip(n.id, enabled)}
                    aria-describedby={n.description ? `${id}-n-${n.id}-d` : undefined}
                    className="mt-0.5"
                  />
                </li>
              ))}
            </ul>
          </section>

          {onDeleteAccount && (
            <section
              id={`${id}-danger`}
              aria-labelledby={`${id}-danger-title`}
              className="scroll-mt-6 rounded-xl border border-destructive/40 p-6"
            >
              <h3 id={`${id}-danger-title`} className="text-destructive text-subheading">
                {labels.danger}
              </h3>
              <p className="mt-1 max-w-prose text-muted-foreground text-sm">
                {labels.dangerDescription}
              </p>
              <HoldToConfirm
                className="mt-4"
                onConfirm={onDeleteAccount}
                confirmedLabel={labels.deleted}
              >
                {labels.deleteAccount}
              </HoldToConfirm>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}

export { Settings01 }
