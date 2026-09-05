import { BellIcon, HomeIcon, InboxIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarLink,
  SidebarProvider,
  SidebarTrigger,
} from '@/ui/sidebar'

const links = [
  { label: 'Home', icon: <HomeIcon /> },
  { label: 'Inbox', icon: <InboxIcon />, badge: 12 },
  { label: 'Team', icon: <UsersIcon /> },
  { label: 'Alerts', icon: <BellIcon /> },
]

export default function SidebarDemo() {
  const [active, setActive] = useState('Home')
  return (
    <div className="flex h-[26rem] w-full overflow-hidden rounded-xl border">
      <SidebarProvider collapsible="hover" breakpoint="sm">
        <Sidebar className="h-full">
          <SidebarHeader>
            <span className="inline-block size-6 shrink-0 rounded-full bg-foreground" />
            <span className="truncate font-semibold transition-opacity group-data-[state=collapsed]/sidebar:opacity-0">
              Acme
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            {links.map((l) => (
              <SidebarLink
                key={l.label}
                href="#"
                icon={l.icon}
                badge={l.badge}
                active={active === l.label}
                onClick={(e) => {
                  e.preventDefault()
                  setActive(l.label)
                }}
              >
                {l.label}
              </SidebarLink>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarLink href="#" icon={<SettingsIcon />} onClick={(e) => e.preventDefault()}>
              Settings
            </SidebarLink>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="sm:hidden" />
            <span className="font-medium">{active}</span>
          </header>
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            Hover the sidebar. Narrow the window and it becomes a drawer.
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
