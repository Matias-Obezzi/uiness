'use client'

import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  InboxIcon,
  KeyboardIcon,
  LanguagesIcon,
  LifeBuoyIcon,
  type LucideIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserPlusIcon,
} from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  useCommandShortcut,
} from '@/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/ui/dialog'

export interface CommandPaletteItem {
  /** Unique across the palette, nested pages included. Recent items are kept by it. */
  id: string
  label: string
  icon?: LucideIcon
  /** More words it is found by. */
  keywords?: string[]
  /** Key caps on the right, like `['⌘', 'N']` or `['G', 'D']`. Shown, not bound. */
  shortcut?: string[]
  /** A quiet word on the right, like the current value of a setting. */
  hint?: string
  /** Go here when chosen. */
  href?: string
  onSelect?: () => void
  /** Open this list instead of running anything, like Theme → Light, Dark, System. */
  page?: CommandPalettePage
}

export interface CommandPaletteGroup {
  heading: string
  items: CommandPaletteItem[]
}

export interface CommandPalettePage {
  title: string
  placeholder?: string
  groups: CommandPaletteGroup[]
}

export interface CommandPaletteLabels {
  trigger: string
  placeholder: string
  empty: string
  recent: string
  /** The crumb for the first page. */
  home: string
  back: string
  navigate: string
  select: string
  close: string
  /** `{label}` is replaced. */
  ran: string
  dialogTitle: string
  dialogDescription: string
}

export interface CommandPalette01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode | null
  title?: React.ReactNode
  description?: React.ReactNode | null
  groups?: CommandPaletteGroup[]
  /** Ids shown under Recent before anything has been run. */
  defaultRecent?: string[]
  /** How many recent items to keep. Default 3; 0 turns the group off. */
  maxRecent?: number
  /** The letter that opens the palette with ⌘ or Ctrl. Default `k`. `null` turns it off. */
  hotkey?: string | null
  /** Called after any item runs, nested ones included. */
  onRun?: (item: CommandPaletteItem) => void
  defaultOpen?: boolean
  labels?: Partial<CommandPaletteLabels>
}

const option = (
  id: string,
  label: string,
  icon: LucideIcon,
  extra: Partial<CommandPaletteItem> = {},
): CommandPaletteItem => ({ id, label, icon, ...extra })

const defaultGroups: CommandPaletteGroup[] = [
  {
    heading: 'Go to',
    items: [
      option('home', 'Dashboard', HomeIcon, { shortcut: ['G', 'D'] }),
      option('inbox', 'Inbox', InboxIcon, { shortcut: ['G', 'I'], keywords: ['notifications'] }),
      option('projects', 'Projects', FolderIcon, { shortcut: ['G', 'P'] }),
      option('settings', 'Settings', SettingsIcon, {
        shortcut: ['G', 'S'],
        keywords: ['preferences'],
      }),
    ],
  },
  {
    heading: 'Actions',
    items: [
      option('new-issue', 'Create issue', PlusIcon, { shortcut: ['C'], keywords: ['new', 'bug'] }),
      option('new-project', 'Create project', FolderPlusIcon, { shortcut: ['⌘', '⇧', 'P'] }),
      option('invite', 'Invite teammate', UserPlusIcon, { keywords: ['member', 'people'] }),
      option('copy-link', 'Copy link to page', CopyIcon, { shortcut: ['⌘', '⇧', 'C'] }),
    ],
  },
  {
    heading: 'Preferences',
    items: [
      option('theme', 'Change theme', PaletteIcon, {
        keywords: ['dark', 'light', 'appearance'],
        page: {
          title: 'Theme',
          placeholder: 'Choose a theme…',
          groups: [
            {
              heading: 'Theme',
              items: [
                option('theme-light', 'Light', SunIcon),
                option('theme-dark', 'Dark', MoonIcon),
                option('theme-system', 'Match system', MonitorIcon, { hint: 'Current' }),
              ],
            },
          ],
        },
      }),
      option('language', 'Change language', LanguagesIcon, {
        hint: 'English',
        page: {
          title: 'Language',
          placeholder: 'Search languages…',
          groups: [
            {
              heading: 'Language',
              items: [
                option('lang-en', 'English', LanguagesIcon, { hint: 'Current' }),
                option('lang-es', 'Español', LanguagesIcon, { keywords: ['spanish'] }),
                option('lang-de', 'Deutsch', LanguagesIcon, { keywords: ['german'] }),
                option('lang-pt', 'Português', LanguagesIcon, { keywords: ['portuguese'] }),
                option('lang-ja', '日本語', LanguagesIcon, { keywords: ['japanese'] }),
              ],
            },
          ],
        },
      }),
    ],
  },
  {
    heading: 'Help',
    items: [
      option('shortcuts', 'Keyboard shortcuts', KeyboardIcon, { shortcut: ['?'] }),
      option('docs', 'Documentation', BookOpenIcon),
      option('support', 'Contact support', LifeBuoyIcon),
    ],
  },
]

const defaultLabels: CommandPaletteLabels = {
  trigger: 'Search or run a command…',
  placeholder: 'Type a command or search…',
  empty: 'Nothing matches. Try another word.',
  recent: 'Recent',
  home: 'Home',
  back: 'Back',
  navigate: 'to move',
  select: 'to choose',
  close: 'to close',
  ran: 'Ran “{label}”',
  dialogTitle: 'Command palette',
  dialogDescription: 'Search for a page or an action, and press Enter to run it.',
}

/** Every item by id, nested pages included, so recent items can be found wherever they live. */
function index(groups: CommandPaletteGroup[], into = new Map<string, CommandPaletteItem>()) {
  for (const group of groups) {
    for (const item of group.items) {
      into.set(item.id, item)
      if (item.page) index(item.page.groups, into)
    }
  }
  return into
}

function Keys({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      {keys.map((key, i) => (
        <kbd
          // biome-ignore lint/suspicious/noArrayIndexKey: the same key can appear twice in a chord
          key={i}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 bg-background px-1 font-medium font-sans text-[0.6875rem] text-muted-foreground leading-none"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}

const isMac = () =>
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
const subscribeNever = () => () => {}

/**
 * A keyboard first action surface. ⌘K (Ctrl+K elsewhere) opens a search over pages and
 * actions in groups, with the last few used on top. Some items open a list of their own,
 * like Theme → Light, Dark, System: Backspace on an empty search or Escape steps back out,
 * and the crumbs above the search say where you are. Shortcuts are drawn as key caps.
 */
function CommandPalette01({
  eyebrow = 'Command palette',
  title = 'Everything, one shortcut away',
  description = 'Jump anywhere and run anything without leaving the keyboard. Try it below, or press the shortcut anywhere on this page.',
  groups = defaultGroups,
  defaultRecent = ['new-issue', 'projects'],
  maxRecent = 3,
  hotkey = 'k',
  onRun,
  defaultOpen = false,
  labels: labelsProp,
  className,
  ...props
}: CommandPalette01Props) {
  const labels = { ...defaultLabels, ...labelsProp }
  const headingId = React.useId()
  const [open, setOpen] = React.useState(defaultOpen)
  const [search, setSearch] = React.useState('')
  const [stack, setStack] = React.useState<CommandPalettePage[]>([])
  const [direction, setDirection] = React.useState<1 | -1>(1)
  const [recent, setRecent] = React.useState(defaultRecent.slice(0, maxRecent))
  const [ran, setRan] = React.useState<string | null>(null)
  // Assumed on the server and while hydrating, so the first render matches the HTML.
  const mac = React.useSyncExternalStore(subscribeNever, isMac, () => true)

  const byId = React.useMemo(() => index(groups), [groups])
  const page = stack[stack.length - 1]
  const shown = page ? page.groups : groups
  const recentItems = recent
    .map((id) => byId.get(id))
    .filter((item): item is CommandPaletteItem => !!item)

  useCommandShortcut(
    () => {
      if (hotkey) setOpen((o) => !o)
    },
    { key: hotkey ?? 'k' },
  )

  const reset = () => {
    setStack([])
    setSearch('')
  }
  const push = (next: CommandPalettePage) => {
    setDirection(1)
    setStack((s) => [...s, next])
    setSearch('')
  }
  const pop = () => {
    setDirection(-1)
    setStack((s) => s.slice(0, -1))
    setSearch('')
  }

  const choose = (item: CommandPaletteItem) => {
    if (item.page) return push(item.page)
    item.onSelect?.()
    onRun?.(item)
    if (maxRecent > 0)
      setRecent((r) => [item.id, ...r.filter((id) => id !== item.id)].slice(0, maxRecent))
    setRan(labels.ran.replace('{label}', item.label))
    setOpen(false)
    reset()
    if (item.href) window.location.assign(item.href)
  }

  const renderItem = (item: CommandPaletteItem, prefix = '') => {
    const Icon = item.icon
    return (
      <CommandItem
        key={prefix + item.id}
        value={item.label}
        keywords={item.keywords}
        onSelect={() => choose(item)}
        className="h-10 gap-3 rounded-lg px-2.5"
      >
        {prefix ? (
          <ClockIcon aria-hidden />
        ) : Icon ? (
          <Icon aria-hidden />
        ) : (
          <span aria-hidden className="size-4" />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.hint && <span className="text-muted-foreground text-xs">{item.hint}</span>}
        {item.shortcut && <Keys keys={item.shortcut} />}
        {item.page && <ChevronRightIcon aria-hidden className="text-muted-foreground" />}
      </CommandItem>
    )
  }

  const shortcutKeys = [mac ? '⌘' : 'Ctrl', (hotkey ?? 'k').toUpperCase()]

  return (
    <section
      data-slot="block-command-palette-01"
      aria-labelledby={headingId}
      className={cn('@container relative isolate w-full overflow-hidden', className)}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(50%_60%_at_50%_0%,var(--color-muted),transparent)]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center @3xl:py-24">
        {eyebrow != null && (
          <p className="mb-3 text-eyebrow text-muted-foreground uppercase">{eyebrow}</p>
        )}
        <h2 id={headingId} className="text-balance text-title">
          {title}
        </h2>
        {description != null && (
          <p className="mt-4 max-w-xl text-pretty text-lead text-muted-foreground">{description}</p>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="group/trigger mt-10 flex h-12 w-full max-w-md items-center gap-3 rounded-xl border bg-background px-4 text-left text-muted-foreground shadow-sm outline-none transition-[box-shadow,border-color] hover:border-foreground/20 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <SearchIcon aria-hidden className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm">{labels.trigger}</span>
          {hotkey && <Keys keys={shortcutKeys} className="hidden @xs:flex" />}
        </button>

        <p aria-live="polite" className="mt-4 min-h-5 text-caption text-muted-foreground">
          {ran}
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-muted-foreground">
          <li className="flex items-center gap-2">
            <Keys keys={['↑', '↓']} /> {labels.navigate}
          </li>
          <li className="flex items-center gap-2">
            <Keys keys={['↵']} /> {labels.select}
          </li>
          <li className="flex items-center gap-2">
            <Keys keys={['⌫']} /> {labels.back}
          </li>
        </ul>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(e) => {
            // Escape steps out of a nested list first, and closes from the top.
            if (stack.length > 0) {
              e.preventDefault()
              pop()
            }
          }}
          className="top-[12%] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">{labels.dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">{labels.dialogDescription}</DialogDescription>
          <Command
            label={labels.dialogTitle}
            value={search}
            onValueChange={setSearch}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && search === '' && stack.length > 0) {
                e.preventDefault()
                pop()
              }
            }}
            className="rounded-none bg-background"
          >
            {stack.length > 0 && (
              <div className="flex items-center gap-1 border-b px-3 pt-3 pb-2 text-xs">
                <button
                  type="button"
                  onClick={pop}
                  aria-label={labels.back}
                  className="mr-1 flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ArrowLeftIcon aria-hidden className="size-3.5" />
                </button>
                {[labels.home, ...stack.map((p) => p.title)].map((crumb, i, all) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a crumb is its depth
                  <React.Fragment key={i}>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5',
                        i === all.length - 1
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {crumb}
                    </span>
                    {i < all.length - 1 && (
                      <ChevronRightIcon aria-hidden className="size-3 text-muted-foreground/60" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            <CommandInput
              autoFocus
              placeholder={page?.placeholder ?? labels.placeholder}
              className="text-base"
            />
            <CommandList
              key={stack.length}
              className={cn(
                'max-h-[min(24rem,55vh)] p-2 duration-(--duration-normal,200ms) ease-(--easing-emphasized,ease-out) motion-reduce:animate-none',
                direction === 1
                  ? 'animate-in fade-in-0 slide-in-from-right-2'
                  : 'animate-in fade-in-0 slide-in-from-left-2',
              )}
            >
              <CommandEmpty>{labels.empty}</CommandEmpty>
              {!page && !search && recentItems.length > 0 && (
                <>
                  <CommandGroup heading={labels.recent}>
                    {recentItems.map((item) => renderItem(item, 'recent:'))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {shown.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.items.map((item) => renderItem(item))}
                </CommandGroup>
              ))}
            </CommandList>
            <div className="flex items-center justify-between gap-4 border-t bg-muted/40 px-3 py-2 text-[0.6875rem] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Keys keys={['↑', '↓']} />
                  {labels.navigate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Keys keys={['↵']} />
                  {labels.select}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Keys keys={[stack.length > 0 ? '⌫' : 'esc']} />
                {stack.length > 0 ? labels.back : labels.close}
              </span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export { CommandPalette01 }
