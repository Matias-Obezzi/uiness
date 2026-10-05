import { ChevronRightIcon, MenuIcon, PaletteIcon, SearchIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
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
import { Kbd, KbdGroup } from '@/ui/kbd'
import { ThemeSwitch } from '@/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { isNew, nav, pageHref } from '~/lib/nav'
import { site } from '~/lib/site'
import { useTheme } from '~/lib/theme'
import { setCustomizerOpen } from '~/lib/theme-choice'
import { siteChrome } from '~/lib/themes'
import { CustomizeDrawer } from './customize-drawer'
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

type Section = (typeof nav)[number]
type Page = Section['pages'][number]

/** The links of a section or a group, on a line that marks the one being read. */
function PageList({ pages, onNavigate }: { pages: Page[]; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5 border-l">
      {pages.map((p) => (
        <li key={p.slug}>
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
  )
}

/** A heading that folds what follows it, with the count and a dot for new pages while closed. */
function Fold({
  title,
  pages,
  open,
  onToggle,
  level,
  children,
}: {
  title: string
  pages: Page[]
  open: boolean
  onToggle: () => void
  level: 'section' | 'group'
  children: ReactNode
}) {
  const listId = useId()
  const fresh = pages.filter((p) => isNew(p)).length
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className={cn(
          'group flex w-full items-center gap-2 rounded-md py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          level === 'section'
            ? 'font-medium'
            : 'text-muted-foreground text-xs uppercase tracking-wide hover:text-foreground aria-expanded:text-foreground',
        )}
      >
        <ChevronRightIcon
          className={cn(
            'shrink-0 text-muted-foreground transition-transform duration-(--duration-fast,150ms)',
            level === 'section' ? 'size-3.5' : 'size-3',
            open && 'rotate-90',
          )}
        />
        <span className="flex-1">{title}</span>
        {!open && (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums normal-case tracking-normal">
            {fresh > 0 && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
            {pages.length}
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
        {/* Padding goes inside the clipped box: on it, the padding would stay when closed. */}
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              level === 'section' ? 'ml-[0.4375rem] pt-1.5 pb-1' : 'ml-[0.3125rem] pt-1 pb-1.5',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A section of the sidebar. The long ones are split into groups that fold on their own, so
 * opening Components shows a dozen headings rather than a hundred links.
 */
function SidebarSection({
  section,
  isOpen,
  onToggle,
  onNavigate,
}: {
  section: Section
  isOpen: (key: string) => boolean
  onToggle: (key: string) => void
  onNavigate?: () => void
}) {
  return (
    <Fold
      title={section.title}
      pages={section.pages}
      open={isOpen(section.title)}
      onToggle={() => onToggle(section.title)}
      level="section"
    >
      {section.groups ? (
        <div className="flex flex-col gap-0.5 border-l pl-3">
          {section.groups.map((group) => {
            const key = `${section.title}/${group.title}`
            return (
              <Fold
                key={key}
                title={group.title}
                pages={group.pages}
                open={isOpen(key)}
                onToggle={() => onToggle(key)}
                level="group"
              >
                <PageList pages={group.pages} onNavigate={onNavigate} />
              </Fold>
            )
          })}
        </div>
      ) : (
        <PageList pages={section.pages} onNavigate={onNavigate} />
      )}
    </Fold>
  )
}

/** The section and, when it has groups, the group holding the page being read. */
const placeOf = (pathname: string) => {
  const path = pathname.replace(/\/$/, '') || '/'
  for (const section of nav) {
    const page = section.pages.find((p) => pageHref(p) === path)
    if (!page) continue
    const group = section.groups?.find((g) => g.pages.includes(page))
    return [section.title, group && `${section.title}/${group.title}`].filter(
      (key): key is string => Boolean(key),
    )
  }
  return []
}

/**
 * Sections and groups fold so the list stays short: the ones holding the current page open,
 * the rest stay as the reader left them. The page being read is scrolled into view in the
 * sidebar, which matters when arriving from a link straight to a page far down the list.
 */
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<Record<string, boolean>>(readOpen)
  const current = placeOf(pathname)

  const save = (next: Record<string, boolean>) => {
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next))
    } catch {}
  }

  const isOpen = (key: string) => open[key] ?? current.includes(key)

  // Arriving at a page opens its section and group, wherever the reader came from.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a change of page should open it
  useEffect(() => {
    const closed = current.filter((key) => !open[key])
    if (closed.length) save({ ...open, ...Object.fromEntries(closed.map((key) => [key, true])) })
  }, [pathname])

  // Bring the current link into view inside the sidebar, without moving the page itself.
  // Waits for the fold to finish opening, so the link is where it will stay.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new page is the trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      const nav = ref.current
      const link = nav?.querySelector<HTMLElement>('[aria-current="page"]')
      const scroller = nav?.closest<HTMLElement>('[data-sidebar-scroll]')
      if (!link || !scroller) return
      const box = scroller.getBoundingClientRect()
      const at = link.getBoundingClientRect()
      if (at.top >= box.top + 24 && at.bottom <= box.bottom - 24) return
      scroller.scrollTop += at.top - box.top - box.height / 2 + at.height / 2
    }, 220)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <nav ref={ref} aria-label="Documentation" className="flex flex-col gap-3 text-sm">
      {nav.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          isOpen={isOpen}
          onToggle={(key) => save({ ...open, [key]: !isOpen(key) })}
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
      contentClassName={siteChrome}
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
      <div className="flex items-center gap-4 border-t px-3 py-2 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <KbdGroup keys="up" />
          <KbdGroup keys="down" /> to move
        </span>
        <span className="flex items-center gap-1.5">
          <KbdGroup keys="enter" /> to open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>Esc</Kbd> to close
        </span>
      </div>
    </CommandDialog>
  )
}

/** An icon button's name, shown on hover and focus. Part of the site, so it skips the theme. */
function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className={siteChrome}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function Layout() {
  const { theme, setTheme } = useTheme()
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
              <KbdGroup keys="mod+k" />
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
            <Hint label="Source on GitHub">
              <Button variant="ghost" size="icon" asChild aria-label="GitHub">
                <a href={site.github} target="_blank" rel="noreferrer">
                  <GithubIcon />
                </a>
              </Button>
            </Hint>
            <Hint label="Theme the component previews">
              <Button
                variant="ghost"
                size="icon"
                className="sm:w-auto sm:px-3"
                onClick={() => setCustomizerOpen(true)}
              >
                <PaletteIcon />
                <span className="sr-only sm:not-sr-only">Customize</span>
              </Button>
            </Hint>
            {/* A span takes the tooltip's handlers: given to the switch, they would replace its click. */}
            <Hint label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              <span className="inline-flex">
                <ThemeSwitch theme={theme} onThemeChange={setTheme} />
              </span>
            </Hint>
          </div>
        </div>
      </header>

      <Search open={searchOpen} onOpenChange={setSearchOpen} />
      <CustomizeDrawer />

      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent side="left" showCloseButton={false} className={cn(siteChrome, 'w-72')}>
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Documentation navigation</DrawerDescription>
          <DrawerBody className="py-6" data-sidebar-scroll>
            <div className="mb-4 flex items-center justify-between gap-2">
              <NavLink
                to="/themes"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 font-medium text-sm"
              >
                <PaletteIcon className="size-4" /> Themes
              </NavLink>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMenuOpen(false)
                  setCustomizerOpen(true)
                }}
              >
                Customize
              </Button>
            </div>
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
