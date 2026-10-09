import { ChevronRightIcon, MenuIcon, PaletteIcon, SearchIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useCommandShortcut,
} from '@/components/ui/command'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { ScrollFade } from '@/components/ui/scroll-fade'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { isNew, nav, pageHref } from '~/lib/nav'
import { site } from '~/lib/site'
import { useTheme } from '~/lib/theme'
import { setCustomizerOpen } from '~/lib/theme-choice'
import { siteChrome } from '~/lib/themes'
import { CustomizeDrawer } from './customize-drawer'
import { GithubIcon } from './github-icon'
import { Logo } from './logo'
import { NewBadge, NewDot } from './new-badge'
import { PageAside } from './page-aside'

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

/** A focus ring drawn inside, so the clipped folds never cut it. */
const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset'

/**
 * The links of a section or a group, along one guide line under the icon or the chevron. The
 * line darkens at the page being read. Titles stay on one line, new pages get a dot.
 */
function PageList({ pages, onNavigate }: { pages: Page[]; onNavigate?: () => void }) {
  return (
    <ul className="ml-2 border-l">
      {pages.map((p) => (
        <li key={p.slug}>
          <NavLink
            to={pageHref(p)}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                '-ml-px flex h-7 items-center gap-2 rounded-r-md border-transparent border-l pr-2 pl-[15px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground',
                focusRing,
                isActive && 'border-foreground font-medium text-foreground hover:border-foreground',
              )
            }
          >
            <span className="truncate">{p.title}</span>
            {isNew(p) && <NewDot />}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

/** Opens and closes what follows a heading, animating the height from 0 to whatever it needs. */
function Collapse({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      className={cn(
        'grid transition-[grid-template-rows] duration-(--duration-normal,200ms) ease-(--easing-standard,ease-out) motion-reduce:transition-none',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
      inert={!open}
    >
      {/* Open, it clips rather than hides: a hidden box is a scroller of its own, and the
          sticky group headings inside would stick to it instead of to the sidebar. Closed, it
          hides, since what a clip cuts off still counts towards the sidebar's scroll height. */}
      <div className={cn('min-h-0', open ? 'overflow-clip' : 'overflow-hidden')}>{children}</div>
    </div>
  )
}

/**
 * A group inside a long section: a chevron, the name and how many pages it holds. Its heading
 * sticks under the section's while the reader scrolls through it.
 */
function SidebarGroup({
  title,
  pages,
  open,
  onToggle,
  onNavigate,
}: {
  title: string
  pages: Page[]
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const listId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        data-scroll-fade-sticky
        className={cn(
          'group sticky top-8 z-(--z-raised,10) flex h-7 w-full items-center gap-2 rounded-md bg-background text-left text-muted-foreground transition-colors hover:text-foreground aria-expanded:text-foreground',
          focusRing,
        )}
      >
        <span className="flex w-4 shrink-0 justify-center">
          <ChevronRightIcon
            aria-hidden
            className="size-3.5 text-muted-foreground transition-transform duration-(--duration-fast,150ms) group-aria-expanded:rotate-90 motion-reduce:transition-none"
          />
        </span>
        <span className="truncate">{title}</span>
        <span className="rounded-sm bg-muted px-1 text-[11px] text-muted-foreground tabular-nums leading-4">
          {pages.length}
          <span className="sr-only"> pages</span>
        </span>
      </button>
      <Collapse id={listId} open={open}>
        <div className="pt-0.5 pb-2">
          <PageList pages={pages} onNavigate={onNavigate} />
        </div>
      </Collapse>
    </div>
  )
}

/**
 * A section of the sidebar: its icon, title and page count. The heading sticks to the top of
 * the sidebar while its pages scroll by. The long sections are split into groups that fold
 * on their own, so opening Components shows ten headings rather than a hundred links.
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
  const listId = useId()
  const open = isOpen(section.title)
  const Icon = section.icon
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => onToggle(section.title)}
        data-scroll-fade-sticky
        className={cn(
          'sticky top-0 z-[calc(var(--z-raised,10)+1)] flex h-8 w-full items-center gap-2 rounded-md bg-background text-left font-medium text-foreground',
          focusRing,
        )}
      >
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{section.title}</span>
        <span className="pr-1 font-normal text-muted-foreground text-xs tabular-nums">
          {section.pages.length}
          <span className="sr-only"> pages</span>
        </span>
      </button>
      <Collapse id={listId} open={open}>
        <div className="pt-0.5 pb-3">
          {section.groups ? (
            section.groups.map((group) => {
              const key = `${section.title}/${group.title}`
              return (
                <SidebarGroup
                  key={key}
                  title={group.title}
                  pages={group.pages}
                  open={isOpen(key)}
                  onToggle={() => onToggle(key)}
                  onNavigate={onNavigate}
                />
              )
            })
          ) : (
            <PageList pages={section.pages} onNavigate={onNavigate} />
          )}
        </div>
      </Collapse>
    </div>
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
function SidebarNav({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
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
  const mounted = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new page is the trigger
  useLayoutEffect(() => {
    const reveal = (behavior: ScrollBehavior) => {
      const nav = ref.current
      const link = nav?.querySelector<HTMLElement>('[aria-current="page"]')
      const scroller = nav?.closest<HTMLElement>('[data-sidebar-scroll]')
      if (!link || !scroller) return
      const box = scroller.getBoundingClientRect()
      const at = link.getBoundingClientRect()
      // The sticky headings cover the top, so the link has to be clear of them too.
      if (at.top >= box.top + 96 && at.bottom <= box.bottom - 48) return
      const top = scroller.scrollTop + at.top - box.top - box.height / 2 + at.height / 2
      scroller.scrollTo({ top, behavior })
    }
    // Mounting, the sidebar or the menu's copy of it: it sits on the link before the first
    // paint instead of jumping there once shown.
    if (!mounted.current) {
      mounted.current = true
      reveal('instant')
    }
    // Then, and on every new page, wait for a section that opens to finish, and glide to the
    // link rather than jump. Already in view, nothing moves.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(() => reveal(reduce ? 'instant' : 'smooth'), 220)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <nav
      ref={ref}
      aria-label="Documentation"
      className={cn('flex flex-col gap-1 text-sm', className)}
    >
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
          <CommandGroup
            key={section.title}
            heading={
              <span className="flex items-center gap-2">
                <section.icon aria-hidden className="size-3.5" />
                {section.title}
              </span>
            }
          >
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
  const mainRef = useRef<HTMLElement>(null)
  // Blocks are whole page sections: they get the full width to show it.
  const blocks = pathname.startsWith('/docs/blocks/')
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
          <ScrollFade asChild size={48}>
            {/* The padding goes inside: on the scroller it would hold the sticky headings
                that far from the top, with links showing above them. */}
            <DrawerBody data-sidebar-scroll>
              <div className="py-6">
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
              </div>
            </DrawerBody>
          </ScrollFade>
        </DrawerContent>
      </Drawer>

      {inDocs ? (
        <div
          className={cn(
            'mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 sm:px-6',
            // Room for the right column without narrowing the block.
            blocks && '2xl:max-w-[96rem]',
          )}
        >
          <ScrollFade asChild size={48}>
            <aside
              data-sidebar-scroll
              className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto overscroll-contain md:block"
            >
              <SidebarNav className="py-8" />
            </aside>
          </ScrollFade>
          <main
            ref={mainRef}
            className={cn(
              'w-full min-w-0 flex-1 py-8 lg:py-10',
              blocks ? 'max-w-none' : 'max-w-3xl',
            )}
          >
            <Outlet />
          </main>
          <PageAside main={mainRef} wide={blocks} />
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
