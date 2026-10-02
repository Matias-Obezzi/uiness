import {
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  SunIcon,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
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
import { isNew, nav, pageHref } from '~/lib/nav'
import { site } from '~/lib/site'
import { useTheme } from '~/lib/theme'
import { Logo } from './logo'
import { NewBadge } from './new-badge'

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold">
      <Logo className="size-5 shrink-0" />
      {site.name}
    </Link>
  )
}

const OPEN_KEY = 'uiness-sidebar-open'

function readOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** The sections the header links to, by their sidebar title, with a shorter label where needed. */
const headerSections = [
  { label: 'Packages', section: 'Packages' },
  { label: 'Components', section: 'Components' },
  { label: 'Blocks', section: 'Blocks' },
  { label: 'D&D', section: 'Drag and drop' },
  { label: 'Motion', section: 'Motion' },
]

/** A section's first page, in the order the sidebar shows it. */
const sectionHref = (title: string) => {
  const first = nav.find((s) => s.title === title)?.pages[0]
  return first ? pageHref(first) : '/docs'
}

/** The section holding the page being read, if any. */
const sectionOf = (pathname: string) =>
  nav.find((s) =>
    s.pages.some((p) => pageHref(p) === pathname.replace(/\/$/, '') || pageHref(p) === pathname),
  )?.title

function SidebarSection({
  section,
  open,
  onToggle,
  onNavigate,
}: {
  section: (typeof nav)[number]
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const listId = useId()
  const fresh = section.pages.filter((p) => isNew(p)).length
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className="group flex w-full items-center gap-2 rounded-md py-1 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ChevronRightIcon
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast,150ms)',
            open && 'rotate-90',
          )}
        />
        <span className="flex-1">{section.title}</span>
        {!open && (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums">
            {fresh > 0 && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
            {section.pages.length}
          </span>
        )}
      </button>
      {/* Rows from 0fr to 1fr animate the height to whatever the list needs. */}
      <div
        id={listId}
        className={cn(
          'grid transition-[grid-template-rows] duration-(--duration-normal,200ms) ease-(--easing-standard,ease-out) motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        inert={!open}
      >
        <ul className="ml-[0.4375rem] flex min-h-0 flex-col gap-0.5 overflow-hidden border-l">
          {section.pages.map((p, i) => (
            <li
              key={p.slug}
              className={cn(i === 0 && 'mt-1.5', i === section.pages.length - 1 && 'mb-1')}
            >
              <NavLink
                to={pageHref(p)}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    '-ml-px flex items-center gap-2 border-l py-1 pl-4 text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'border-foreground font-medium text-foreground',
                  )
                }
              >
                {p.title}
                {isNew(p) && <NewBadge />}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Sections fold so the list stays short: the one holding the current page opens, the rest
 * stay as the reader left them. The page being read is scrolled into view in the sidebar,
 * which matters when arriving from a link straight to a page far down the list.
 */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<Record<string, boolean>>(readOpen)
  const current = sectionOf(pathname)

  const save = (next: Record<string, boolean>) => {
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next))
    } catch {}
  }

  // Arriving at a page opens its section, wherever the reader came from.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a change of page should open it
  useEffect(() => {
    if (current && !open[current]) save({ ...open, [current]: true })
  }, [current])

  // Bring the current link into view inside the sidebar, without moving the page itself.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new page is the trigger
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const nav = ref.current
      const link = nav?.querySelector<HTMLElement>('[aria-current="page"]')
      const scroller = nav?.closest<HTMLElement>('[data-sidebar-scroll]')
      if (!link || !scroller) return
      const box = scroller.getBoundingClientRect()
      const at = link.getBoundingClientRect()
      if (at.top >= box.top + 24 && at.bottom <= box.bottom - 24) return
      scroller.scrollTop += at.top - box.top - box.height / 2 + at.height / 2
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return (
    <nav ref={ref} aria-label="Documentation" className="flex flex-col gap-3 text-sm">
      {nav.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          open={open[section.title] ?? section.title === current}
          onToggle={() =>
            save({ ...open, [section.title]: !(open[section.title] ?? section.title === current) })
          }
          onNavigate={onNavigate}
        />
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
                  <span className="flex items-center gap-2 font-medium">
                    {p.title}
                    {isNew(p) && <NewBadge />}
                  </span>
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
  const currentSection = sectionOf(pathname)

  useCommandShortcut(() => setSearchOpen((o) => !o))

  // The same pages are served from more than one place (GitHub Pages keeps the old registry
  // URL alive), so every page names its address on the main site as the one to index.
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.append(link)
    }
    link.href = `${site.url}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-(--z-sticky,40) border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
          <Wordmark />
          <nav aria-label="Sections" className="hidden items-center gap-5 text-sm lg:flex">
            {headerSections.map(({ label, section }) => (
              <NavLink
                key={section}
                to={sectionHref(section)}
                className={cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  currentSection === section && 'text-foreground',
                )}
              >
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/themes"
              className={({ isActive }) =>
                cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              Themes
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
          <DrawerBody className="py-6" data-sidebar-scroll>
            <NavLink
              to="/themes"
              onClick={() => setMenuOpen(false)}
              className="mb-4 flex items-center gap-2 font-medium text-sm"
            >
              <PaletteIcon className="size-4" /> Themes
            </NavLink>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {inDocs ? (
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 sm:px-6">
          <aside
            data-sidebar-scroll
            className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto overscroll-contain py-8 md:block"
          >
            <SidebarNav />
          </aside>
          <main
            className={cn(
              'w-full min-w-0 flex-1 py-8 lg:py-10',
              // Blocks are whole page sections: they get the full width to show it.
              pathname.startsWith('/docs/blocks/') ? 'max-w-none' : 'max-w-3xl',
            )}
          >
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
