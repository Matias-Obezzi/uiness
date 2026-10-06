import {
  BarChart3Icon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  KeyRoundIcon,
  LineChartIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { type MouseEvent, type ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  Sidebar,
  SidebarButton,
  type SidebarCollapsible,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarLink,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarView,
  SidebarViews,
  useSidebar,
} from '@/ui/sidebar'

interface Item {
  id: string
  label: string
  icon: ReactNode
  badge?: number
  disabledReason?: string
}

const workspace: Item[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 12 },
  { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { id: 'team', label: 'Team', icon: <UsersIcon /> },
]

const insights: Item[] = [
  { id: 'reports', label: 'Reports', icon: <BarChart3Icon /> },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <LineChartIcon />,
    disabledReason: 'Requires a paid plan',
  },
]

const settings: Item[] = [
  { id: 'settings/general', label: 'General', icon: <SlidersHorizontalIcon /> },
  { id: 'settings/members', label: 'Members', icon: <UsersIcon /> },
  { id: 'settings/billing', label: 'Billing', icon: <CreditCardIcon /> },
  { id: 'settings/notifications', label: 'Notifications', icon: <BellIcon /> },
  {
    id: 'settings/api',
    label: 'API keys',
    icon: <KeyRoundIcon />,
    disabledReason: 'Only owners can manage keys',
  },
]

const groups = [
  { name: 'Acme Inc', plan: 'Free plan' },
  { name: 'Bramble Labs', plan: 'Pro plan' },
  { name: 'Cobalt Studio', plan: 'Team plan' },
]

const titles = new Map(
  [...workspace, ...insights, ...settings].map((item) => [item.id, item.label] as const),
)

function Mark({ name }: { name: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-semibold text-sidebar-primary-foreground text-xs">
      {name[0]}
    </span>
  )
}

function GroupSelector() {
  const { inDrawer } = useSidebar()
  const [group, setGroup] = useState(groups[0] ?? { name: '', plan: '' })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarButton size="lg" icon={<Mark name={group.name} />} tooltip={group.name}>
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate font-semibold">{group.name}</span>
            <span className="truncate font-normal text-xs opacity-70">{group.plan}</span>
          </span>
          <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
        </SidebarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side={inDrawer ? 'bottom' : 'right'} align="start">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Groups</DropdownMenuLabel>
        {groups.map((g) => (
          <DropdownMenuItem key={g.name} onSelect={() => setGroup(g)}>
            <Mark name={g.name} />
            {g.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PlusIcon /> Create group
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({ onSettings }: { onSettings: () => void }) {
  const { inDrawer } = useSidebar()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarButton
          size="lg"
          tooltip="Sofia Davis"
          icon={
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-medium text-[11px] text-sidebar-accent-foreground">
              SD
            </span>
          }
        >
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate">Sofia Davis</span>
            <span className="truncate font-normal text-xs opacity-70">sofia@acme.com</span>
          </span>
          <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
        </SidebarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side={inDrawer ? 'top' : 'right'} align="end">
        <DropdownMenuItem>
          <UserIcon /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSettings}>
          <SettingsIcon /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const modes: SidebarCollapsible[] = ['hover', 'click', 'none']

export default function SidebarDemo() {
  const [mode, setMode] = useState<SidebarCollapsible>('hover')
  const [page, setPage] = useState('home')
  const onSettings = page.startsWith('settings')

  // Stand-ins for your router: every link goes to a page, the views follow the page.
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    setPage(id)
  }

  const link = (item: Item) => (
    <SidebarMenuItem key={item.id}>
      <SidebarLink
        href={`#${item.id}`}
        icon={item.icon}
        badge={item.badge}
        active={page === item.id}
        disabled={item.disabledReason !== undefined}
        disabledReason={item.disabledReason}
        onClick={go(item.id)}
      >
        {item.label}
      </SidebarLink>
    </SidebarMenuItem>
  )

  return (
    <div className="flex h-[34rem] w-full overflow-hidden rounded-xl border">
      <SidebarProvider key={mode} collapsible={mode} breakpoint="sm">
        <Sidebar className="h-full">
          <SidebarHeader className="h-16">
            <GroupSelector />
          </SidebarHeader>
          <SidebarContent>
            <SidebarViews
              value={onSettings ? 'settings' : 'main'}
              onValueChange={(view) => setPage(view === 'main' ? 'home' : 'settings/general')}
            >
              <SidebarView name="main">
                <SidebarGroup>
                  <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                  <SidebarMenu>
                    {workspace.map(link)}
                    <SidebarMenuItem>
                      <SidebarLink
                        href="#settings"
                        icon={<SettingsIcon />}
                        closeDrawer={false}
                        onClick={go('settings/general')}
                      >
                        Settings
                      </SidebarLink>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Insights</SidebarGroupLabel>
                  <SidebarMenu>{insights.map(link)}</SidebarMenu>
                </SidebarGroup>
              </SidebarView>
              <SidebarView name="settings" back={{ to: 'main', label: 'All' }}>
                <SidebarGroup>
                  <SidebarGroupLabel>Settings</SidebarGroupLabel>
                  <SidebarMenu>{settings.map(link)}</SidebarMenu>
                </SidebarGroup>
              </SidebarView>
            </SidebarViews>
          </SidebarContent>
          <SidebarFooter>
            <UserMenu onSettings={() => setPage('settings/general')} />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className={cn(mode !== 'click' && 'sm:hidden')} />
            <span className="truncate font-medium">{titles.get(page)}</span>
            <div
              role="radiogroup"
              aria-label="Collapsible"
              className="ml-auto hidden rounded-lg bg-muted p-0.5 sm:flex"
            >
              {modes.map((m) => (
                // biome-ignore lint/a11y/useSemanticElements: a segmented control, not a form field
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium text-muted-foreground text-xs capitalize transition-colors',
                    mode === m && 'bg-background text-foreground shadow-sm',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </header>
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-4 lg:grid-cols-3">
            <p className="col-span-full text-muted-foreground text-sm">
              <span className="sm:hidden">
                The same sidebar, in a drawer. Open it from the menu.
              </span>
              <span className="hidden sm:inline">
                {mode === 'hover'
                  ? 'Hover the sidebar: it opens over the page, these cards stay put.'
                  : mode === 'click'
                    ? 'Press the button or Ctrl+B. Collapsed, the icons show their names on hover.'
                    : 'Always open.'}
              </span>
            </p>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                key={i}
                className="h-24 rounded-lg border bg-muted/40"
              />
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
