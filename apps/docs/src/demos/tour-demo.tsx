import {
  CreditCardIcon,
  FolderIcon,
  LayoutDashboardIcon,
  PlusIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import { toast } from '@/ui/toast'
import { defineTours, TourProvider, useTour } from '@/ui/tour'

export default function TourDemo() {
  const [admin, setAdmin] = useState(false)

  // Declared once. Steps for admins only use `when`; Billing is only drawn for admins, so
  // its step drops out on its own when the link is not there.
  const tours = defineTours({
    welcome: [
      {
        id: 'hello',
        title: 'Welcome to Acme',
        content: 'A quick look around. It takes less than a minute.',
      },
      {
        id: 'search',
        target: '[data-tour="search"]',
        title: 'Search everything',
        content: 'Projects, people and files, all from one box.',
        side: 'bottom',
        align: 'start',
      },
      {
        id: 'nav',
        target: '[data-tour="nav"]',
        title: 'Find your way',
        content: 'Every part of the workspace lives here.',
        side: 'right',
      },
      {
        id: 'billing',
        target: '[data-tour="billing"]',
        title: 'Billing',
        content: 'Plans and invoices. Only admins see this link.',
        side: 'right',
      },
      {
        id: 'create',
        target: '[data-tour="create"]',
        title: 'Start a project',
        content: 'Give it a name and invite people later.',
        side: 'bottom',
        align: 'end',
      },
      {
        id: 'invite',
        target: '[data-tour="invite"]',
        title: 'Bring your team',
        content: 'Admins can invite people from here.',
        side: 'top',
        when: () => admin,
      },
    ],
  })

  return (
    <TourProvider
      tours={tours}
      onComplete={() => toast('Tour finished')}
      onSkip={({ index, total }) => toast(`Tour skipped at step ${index + 1} of ${total}`)}
    >
      <div className="w-full space-y-4">
        <MockApp admin={admin} />
        <div className="flex flex-wrap items-center justify-center gap-4">
          <StartButton />
          <div className="flex items-center gap-2">
            <Switch id="tour-admin" checked={admin} onCheckedChange={setAdmin} />
            <Label htmlFor="tour-admin">Signed in as admin</Label>
          </div>
        </div>
      </div>
    </TourProvider>
  )
}

function StartButton() {
  const tour = useTour()
  return <Button onClick={() => tour.start('welcome')}>Start tour</Button>
}

function MockApp({ admin }: { admin: boolean }) {
  const links = [
    { label: 'Overview', icon: LayoutDashboardIcon, active: true },
    { label: 'Projects', icon: FolderIcon },
    { label: 'Team', icon: UsersIcon },
  ]
  return (
    <div className="w-full overflow-hidden rounded-xl border bg-background text-sm">
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <span className="font-semibold">Acme</span>
        <div data-tour="search" className="relative ml-2 max-w-64 flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search" placeholder="Search" className="h-8 pl-8" />
        </div>
        <span className="ml-auto grid size-7 place-items-center rounded-full bg-muted font-medium text-xs">
          MO
        </span>
      </header>
      <div className="flex">
        <nav data-tour="nav" className="hidden w-40 shrink-0 space-y-0.5 border-r p-2 sm:block">
          {links.map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-accent font-medium' : 'text-muted-foreground'}`}
            >
              <Icon className="size-4" />
              {label}
            </span>
          ))}
          {admin && (
            <span
              data-tour="billing"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground"
            >
              <CreditCardIcon className="size-4" />
              Billing
            </span>
          )}
        </nav>
        <main className="min-w-0 flex-1 space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-base">Overview</h3>
            <Button data-tour="create" size="sm">
              <PlusIcon />
              New project
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Projects', '12'],
              ['Open tasks', '38'],
              ['Members', '6'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-semibold text-lg tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-3">
            <p className="text-muted-foreground">Working alone? Projects are better together.</p>
            <Button data-tour="invite" variant="outline" size="sm">
              <UserPlusIcon />
              Invite
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
