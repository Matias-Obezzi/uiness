import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useCommandShortcut,
} from '@/ui/command'
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerTitle } from '@/ui/drawer'
import { nav, pageHref } from '~/lib/nav'
import { site } from '~/lib/site'
import { useTheme } from '~/lib/theme'

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold">
      <span className="inline-block size-5 rounded-full bg-foreground" aria-hidden />
      {site.name}
    </Link>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6 text-sm">
      {nav.map((section) => (
        <div key={section.title}>
          <p className="mb-2 font-medium">{section.title}</p>
          <ul className="flex flex-col gap-0.5 border-l">
            {section.pages.map((p) => (
              <li key={p.slug}>
                <NavLink
                  to={pageHref(p)}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      '-ml-px block border-l py-1 pl-4 text-muted-foreground transition-colors hover:text-foreground',
                      isActive && 'border-foreground font-medium text-foreground',
                    )
                  }
                >
                  {p.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Search({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search the docs"
      description="Find a page by its name or what it does"
    >
      <CommandInput placeholder="Search docs…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {nav.map((section) => (
          <CommandGroup key={section.title} heading={section.title}>
            {section.pages.map((p) => (
              <CommandItem
                key={p.slug}
                value={p.title}
                keywords={[p.description, p.slug]}
                onSelect={() => {
                  navigate(pageHref(p))
                  onOpenChange(false)
                }}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{p.title}</span>
                  <span className="line-clamp-1 text-muted-foreground text-xs">
                    {p.description}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export function Layout() {
  const { dark, toggle } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const inDocs = pathname.startsWith('/docs')

  useCommandShortcut(() => setSearchOpen((o) => !o))

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
          <Logo />
          <nav className="hidden items-center gap-5 text-sm md:flex">
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              Docs
            </NavLink>
            <NavLink
              to="/docs/components/button"
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                pathname.startsWith('/docs/components') && 'text-foreground',
              )}
            >
              Components
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              className="hidden h-8 w-56 justify-between text-muted-foreground sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <span className="flex items-center gap-2">
                <SearchIcon className="size-3.5" /> Search docs…
              </span>
              <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="GitHub">
              <a href={site.github} target="_blank" rel="noreferrer">
                <GithubIcon />
              </a>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>
      </header>

      <Search open={searchOpen} onOpenChange={setSearchOpen} />

      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent side="left" showCloseButton={false} className="w-72">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Documentation navigation</DrawerDescription>
          <DrawerBody className="py-6">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {inDocs ? (
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 sm:px-6">
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 md:block">
            <SidebarNav />
          </aside>
          <main className="w-full min-w-0 max-w-3xl flex-1 py-8 lg:py-10">
            <Outlet />
          </main>
        </div>
      ) : (
        <main className="flex-1">
          <Outlet />
        </main>
      )}

      <footer className="border-t py-6 text-center text-muted-foreground text-sm">
        Built by Matías Obezzi. Source on{' '}
        <a
          href={site.github}
          className="underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </footer>
    </div>
  )
}
