'use client'

import {
  CheckIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HoldToConfirm } from '@/components/ui/hold-to-confirm'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface ProfileAccount {
  id: string
  name: string
  email: string
  avatar?: string
}

export type ProfileStatus = 'online' | 'away' | 'busy'
export type ProfileTheme = 'light' | 'dark' | 'system'

export interface ProfileDropdownLabels {
  /** The card, read with who is signed in. */
  account: (name: string) => string
  switchAccount: string
  status: string
  statuses: Record<ProfileStatus, string>
  theme: string
  themes: Record<ProfileTheme, string>
  signOut: string
}

export const defaultProfileDropdownLabels: ProfileDropdownLabels = {
  account: (name) => `Account: ${name}`,
  switchAccount: 'Switch account',
  status: 'Status',
  statuses: { online: 'Online', away: 'Away', busy: 'Do not disturb' },
  theme: 'Theme',
  themes: { light: 'Light', dark: 'Dark', system: 'System' },
  signOut: 'Hold to sign out',
}

const dot: Record<ProfileStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  busy: 'bg-rose-500',
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export interface ProfileDropdownProps extends Omit<React.ComponentProps<'button'>, 'children'> {
  accounts: ProfileAccount[]
  /** The account signed in. */
  current: string
  onAccountChange?: (id: string) => void
  status?: ProfileStatus
  onStatusChange?: (status: ProfileStatus) => void
  theme?: ProfileTheme
  onThemeChange?: (theme: ProfileTheme) => void
  onSignOut: () => void
  labels?: Partial<ProfileDropdownLabels>
}

/**
 * An account card that opens into its own menu: the card grows from where it sits into a panel
 * with the other accounts to switch to, a status, the theme, and a sign out you hold so it
 * can't happen by accident.
 */
function ProfileDropdown({
  accounts,
  current,
  onAccountChange,
  status = 'online',
  onStatusChange,
  theme = 'system',
  onThemeChange,
  onSignOut,
  labels: labelsProp,
  className,
  ...props
}: ProfileDropdownProps) {
  const labels = useLabels('profile-dropdown', defaultProfileDropdownLabels, labelsProp)
  const reduced = useReducedMotion()
  const [open, setOpen] = React.useState(false)
  const trigger = React.useRef<HTMLButtonElement>(null)
  // The card's height, measured as it opens, to lay the panel over it.
  const [cardHeight, setCardHeight] = React.useState(0)
  const me = accounts.find((a) => a.id === current) ?? accounts[0]
  if (!me) return null

  const card = (account: ProfileAccount, withStatus: boolean) => (
    <>
      <span className="relative shrink-0">
        <Avatar className="size-9">
          {account.avatar && <AvatarImage src={account.avatar} alt="" />}
          <AvatarFallback>{initials(account.name)}</AvatarFallback>
        </Avatar>
        {withStatus && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-background',
              dot[status],
            )}
          />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium text-sm">{account.name}</span>
        <span className="block truncate text-muted-foreground text-xs">{account.email}</span>
      </span>
    </>
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setCardHeight(trigger.current?.offsetHeight ?? 0)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        ref={trigger}
        data-slot="profile-dropdown"
        aria-label={labels.account(me.name)}
        className={cn(
          'flex w-64 items-center gap-3 rounded-xl border bg-card p-2.5 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:invisible',
          className,
        )}
        {...props}
      >
        {card(me, true)}
        <ChevronsUpDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Over the card, so it seems to grow out of it.
        sideOffset={-cardHeight}
        ref={(el) => {
          if (!el || reduced) return
          const from = trigger.current
          const w = from?.offsetWidth ?? 256
          const h = from?.offsetHeight ?? 60
          el.animate?.(
            [
              { clipPath: `inset(0 calc(100% - ${w}px) calc(100% - ${h}px) 0 round 12px)` },
              { clipPath: 'inset(0 0 0 0 round 12px)' },
            ],
            { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
          )
        }}
        className="w-72 rounded-xl p-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
      >
        <div className="flex items-center gap-3 border-b p-2.5">{card(me, true)}</div>
        {accounts.length > 1 && (
          <div className="border-b p-1.5">
            <p className="px-2 py-1 text-muted-foreground text-xs">{labels.switchAccount}</p>
            {accounts
              .filter((a) => a.id !== me.id)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onAccountChange?.(a.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg p-1.5 outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {card(a, false)}
                </button>
              ))}
          </div>
        )}
        <div className="border-b p-1.5" role="radiogroup" aria-label={labels.status}>
          <p className="px-2 py-1 text-muted-foreground text-xs">{labels.status}</p>
          {(['online', 'away', 'busy'] as const).map((s) => (
            // biome-ignore lint/a11y/useSemanticElements: a row of the menu that acts as a radio
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => onStatusChange?.(s)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11"
            >
              <span aria-hidden="true" className={cn('size-2 rounded-full', dot[s])} />
              <span className="flex-1 text-left">{labels.statuses[s]}</span>
              {status === s && <CheckIcon aria-hidden="true" className="size-4" />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-b px-3.5 py-2.5">
          <span className="text-sm">{labels.theme}</span>
          <SegmentedControl
            size="sm"
            aria-label={labels.theme}
            value={theme}
            onValueChange={(t) => onThemeChange?.(t as ProfileTheme)}
          >
            <SegmentedControlItem value="light" aria-label={labels.themes.light}>
              <SunIcon aria-hidden="true" />
            </SegmentedControlItem>
            <SegmentedControlItem value="dark" aria-label={labels.themes.dark}>
              <MoonIcon aria-hidden="true" />
            </SegmentedControlItem>
            <SegmentedControlItem value="system" aria-label={labels.themes.system}>
              <MonitorIcon aria-hidden="true" />
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
        <div className="p-2">
          <HoldToConfirm size="sm" className="w-full" onConfirm={onSignOut} resetAfter={false}>
            <LogOutIcon aria-hidden="true" />
            {labels.signOut}
          </HoldToConfirm>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ProfileDropdown }
