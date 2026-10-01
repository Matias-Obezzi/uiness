'use client'

import { ChevronLeftIcon, PanelLeftIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerTitle } from '@/ui/drawer'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export type SidebarCollapsible = 'hover' | 'click' | 'none'
export type SidebarBreakpoint = 'sm' | 'md' | 'lg'

const breakpointPx: Record<SidebarBreakpoint, number> = { sm: 640, md: 768, lg: 1024 }
const fromBreakpoint: Record<SidebarBreakpoint, string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
}
const belowBreakpoint: Record<SidebarBreakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const mobileQuery = (breakpoint: SidebarBreakpoint) =>
  `(max-width: ${breakpointPx[breakpoint] - 1}px)`

const matchesMobile = (breakpoint: SidebarBreakpoint) =>
  typeof matchMedia === 'function' && matchMedia(mobileQuery(breakpoint)).matches

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

function writeCookie(name: string, open: boolean) {
  if (typeof document === 'undefined') return
  // A plain cookie, not storage, so the server can read it and render the right state first.
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not everywhere yet
  document.cookie = `${name}=${open}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/** A duration token from the theme in milliseconds, for animations run from script. */
function tokenMs(el: Element, name: string, fallback: number) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const n = Number.parseFloat(raw)
  if (Number.isNaN(n)) return fallback
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : fallback
}

interface SidebarContextValue {
  /** Expanded on desktop. In hover mode it follows the pointer. */
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  /** The drawer on phones. */
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  /** Below the breakpoint. Known after mount, so do not use it to pick what to render. */
  isMobile: boolean
  collapsible: SidebarCollapsible
  breakpoint: SidebarBreakpoint
  width: number
  collapsedWidth: number
  /** Whether labels show: open on desktop, always inside the mobile drawer. */
  expanded: boolean
  /** True for the copy of the children rendered inside the phone drawer. */
  inDrawer: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('Sidebar parts must be rendered inside <SidebarProvider>')
  return ctx
}

function useIsMobile(breakpoint: SidebarBreakpoint) {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(mobileQuery(breakpoint))
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])
  return mobile
}

export interface SidebarProviderProps {
  /** Expanded or collapsed. Controlled. */
  open?: boolean
  /**
   * Starting state when uncontrolled. Read it from the `cookieName` cookie on the server so the
   * first paint is already right. Default expanded in `click` mode, collapsed in `hover` mode.
   */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * `hover` expands over the page while the pointer is over it, `click` toggles from
   * `SidebarTrigger` and pushes the page, `none` is always expanded. Default hover.
   */
  collapsible?: SidebarCollapsible
  /** Below this Tailwind breakpoint the sidebar becomes a drawer. Default md. */
  breakpoint?: SidebarBreakpoint
  /** Expanded width in pixels. Default 240. */
  width?: number
  /** Collapsed width in pixels. Default 60. */
  collapsedWidth?: number
  /**
   * Cookie that remembers the state in `click` mode, for 7 days. `false` turns it off.
   * Default `sidebar_state`, the same name shadcn uses.
   */
  cookieName?: string | false
  /**
   * Key that toggles the sidebar with Cmd or Ctrl, or the drawer on phones. `false` turns it
   * off. Ignored while typing in a field. Default `b`.
   */
  keyboardShortcut?: string | false
  children: React.ReactNode
}

function SidebarProvider({
  open: openProp,
  defaultOpen,
  onOpenChange,
  collapsible = 'hover',
  breakpoint = 'md',
  width = 240,
  collapsedWidth = 60,
  cookieName = 'sidebar_state',
  keyboardShortcut = 'b',
  children,
}: SidebarProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? collapsible !== 'hover')
  const open = collapsible === 'none' ? true : (openProp ?? uncontrolled)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next)
      onOpenChange?.(next)
      // Hover mode opens and closes under the pointer, there is nothing worth remembering.
      if (cookieName && collapsible === 'click') writeCookie(cookieName, next)
    },
    [openProp, onOpenChange, cookieName, collapsible],
  )
  const toggle = React.useCallback(() => setOpen(!open), [open, setOpen])
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const isMobile = useIsMobile(breakpoint)
  React.useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile])

  React.useEffect(() => {
    if (!keyboardShortcut) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
      if (e.key.toLowerCase() !== keyboardShortcut.toLowerCase()) return
      // Cmd+B is bold in an editor.
      if (isEditable(e.target)) return
      if (matchesMobile(breakpoint)) {
        e.preventDefault()
        setMobileOpen((o) => !o)
      } else if (collapsible === 'click') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keyboardShortcut, breakpoint, collapsible, toggle])

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      mobileOpen,
      setMobileOpen,
      isMobile,
      collapsible,
      breakpoint,
      width,
      collapsedWidth,
      expanded: open,
      inDrawer: false,
    }),
    [open, setOpen, toggle, mobileOpen, isMobile, collapsible, breakpoint, width, collapsedWidth],
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

/** Tells the sidebar when the drawer's copy of the children mounts and unmounts. */
function MountSignal({ onChange }: { onChange: (mounted: boolean) => void }) {
  React.useLayoutEffect(() => {
    onChange(true)
    return () => onChange(false)
  }, [onChange])
  return null
}

export interface SidebarProps extends React.ComponentProps<'aside'> {
  /** Accessible name of the mobile drawer. Default "Menu". */
  label?: string
}

/**
 * The panel itself. On wide screens a sticky column that collapses to icons; below the
 * breakpoint a drawer opened from `SidebarTrigger`. Which one shows is decided by CSS, so the
 * first paint is right without waiting for script.
 *
 * The column reserves its collapsed width in the layout. In hover mode the panel expands over
 * the page instead of pushing it, so nothing next to it reflows; only click mode pushes.
 */
function Sidebar({
  label = 'Menu',
  className,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onFocus,
  onBlur,
  ...props
}: SidebarProps) {
  const ctx = useSidebar()
  const {
    open,
    setOpen,
    collapsible,
    breakpoint,
    width,
    collapsedWidth,
    mobileOpen,
    setMobileOpen,
  } = ctx
  const hover = collapsible === 'hover'
  const reserved =
    collapsible === 'click' ? (open ? width : collapsedWidth) : hover ? collapsedWidth : width
  const mobileValue = React.useMemo<SidebarContextValue>(
    () => ({ ...ctx, expanded: true, inDrawer: true }),
    [ctx],
  )

  // The children live in one place at a time. While the drawer holds them, the column (hidden
  // by CSS on phones anyway) renders nothing, so stateful children and `data-tour` anchors are
  // never duplicated. They mount again in the column after the drawer has fully closed.
  const [drawerMounted, setDrawerMounted] = React.useState(false)

  const panelRef = React.useRef<HTMLDivElement>(null)
  const pointerInside = React.useRef(false)
  const movesInside = React.useRef(new WeakSet<Event>())
  const openedBy = React.useRef<'pointer' | 'focus'>('pointer')

  const collapse = React.useCallback(
    (byPointer: boolean) => {
      const panel = panelRef.current
      if (!hover || !open || !panel || pointerInside.current) return
      // A menu opened from the sidebar, a group selector or the user menu, keeps it open.
      if (panel.querySelector('[aria-expanded="true"]')) return
      // Keyboard focus keeps it open, unless the pointer opened it and has now left: a menu
      // hands focus back to its trigger when it closes, and that must not pin the sidebar.
      const active = document.activeElement
      const focused = active && panel.contains(active) && isFocusVisible(active)
      if (focused && (!byPointer || openedBy.current === 'focus')) return
      setOpen(false)
    },
    [hover, open, setOpen],
  )

  // Pointer leave is not always seen: a menu that closes under the pointer leaves it outside
  // without a leave event. Any move that did not come through the sidebar's React tree (portaled
  // menus included) means the pointer is out.
  React.useEffect(() => {
    if (!hover || !open) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || movesInside.current.has(e)) return
      pointerInside.current = false
      collapse(true)
    }
    document.addEventListener('pointermove', onMove)
    return () => document.removeEventListener('pointermove', onMove)
  }, [hover, open, collapse])

  return (
    <>
      <aside
        data-slot="sidebar"
        data-state={open ? 'expanded' : 'collapsed'}
        data-collapsible={collapsible}
        className={cn(
          'group/sidebar sticky top-0 z-(--z-sticky,40) h-dvh shrink-0 transition-[width] duration-(--duration-slow,300ms) ease-(--easing-sheet,cubic-bezier(0.32,0.72,0,1)) motion-reduce:transition-none',
          // Above a sticky header in the page while it is spread over it.
          hover && 'data-[state=expanded]:z-[calc(var(--z-sticky,40)+1)]',
          fromBreakpoint[breakpoint],
          className,
        )}
        style={{ width: reserved, ...style }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e)
          if (!hover || e.pointerType === 'touch') return
          pointerInside.current = true
          if (open) return
          openedBy.current = 'pointer'
          setOpen(true)
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          if (!hover || e.pointerType === 'touch') return
          pointerInside.current = false
          collapse(true)
        }}
        onPointerMove={(e) => {
          onPointerMove?.(e)
          movesInside.current.add(e.nativeEvent)
        }}
        onFocus={(e) => {
          onFocus?.(e)
          // Keyboard users get the labels too. A click leaves focus behind, so only visible focus.
          if (!hover || open || !isFocusVisible(e.target)) return
          openedBy.current = 'focus'
          setOpen(true)
        }}
        onBlur={(e) => {
          onBlur?.(e)
          const next = e.relatedTarget
          if (next instanceof Node && e.currentTarget.contains(next)) return
          collapse(false)
        }}
        {...props}
      >
        <div
          ref={panelRef}
          data-slot="sidebar-panel"
          data-state={open ? 'expanded' : 'collapsed'}
          data-collapsible={collapsible}
          className={cn(
            'absolute inset-y-0 left-0 flex flex-col overflow-hidden border-(--sidebar-border,var(--border)) border-r bg-(--sidebar,var(--background)) text-(--sidebar-foreground,var(--foreground)) transition-[width,box-shadow] duration-(--duration-slow,300ms) ease-(--easing-sheet,cubic-bezier(0.32,0.72,0,1)) motion-reduce:transition-none',
            hover && open && 'shadow-xl',
          )}
          style={{ width: open ? width : collapsedWidth }}
        >
          {drawerMounted ? null : children}
        </div>
      </aside>
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent
          side="left"
          showCloseButton={false}
          className={cn(
            'w-72 bg-(--sidebar,var(--background)) text-(--sidebar-foreground,var(--foreground))',
            belowBreakpoint[breakpoint],
          )}
        >
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          <DrawerDescription className="sr-only">Navigation</DrawerDescription>
          <DrawerBody
            data-slot="sidebar-drawer"
            data-state="expanded"
            className="group/sidebar flex flex-col px-0 py-1"
          >
            <MountSignal onChange={setDrawerMounted} />
            <SidebarContext.Provider value={mobileValue}>{children}</SidebarContext.Provider>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

/** Opens the drawer on phones. On desktop it toggles the sidebar when `collapsible` is `click`. */
function SidebarTrigger({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const { isMobile, setMobileOpen, toggle, collapsible, open, breakpoint } = useSidebar()
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle sidebar"
      aria-expanded={isMobile ? undefined : open}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (matchesMobile(breakpoint)) setMobileOpen(true)
        else if (collapsible === 'click') toggle()
      }}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-5',
        className,
      )}
      {...props}
    >
      {children ?? <PanelLeftIcon />}
    </button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex h-14 shrink-0 items-center gap-3 px-3', className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn('mt-auto flex shrink-0 flex-col gap-1 px-3 py-3', className)}
      {...props}
    />
  )
}

interface SidebarGroupContextValue {
  labelId: string
  setLabelled: (labelled: boolean) => void
}

const SidebarGroupContext = React.createContext<SidebarGroupContextValue | null>(null)

/**
 * A titled block of navigation. Renders a `<nav>` named by its `SidebarGroupLabel`, so screen
 * readers list each group as a landmark with its title.
 */
function SidebarGroup({ className, children, ...props }: React.ComponentProps<'nav'>) {
  const labelId = React.useId()
  const [labelled, setLabelled] = React.useState(false)
  const value = React.useMemo(() => ({ labelId, setLabelled }), [labelId])
  return (
    <SidebarGroupContext.Provider value={value}>
      <nav
        data-slot="sidebar-group"
        aria-labelledby={labelled && !props['aria-label'] ? labelId : undefined}
        className={cn('flex flex-col', className)}
        {...props}
      >
        {children}
      </nav>
    </SidebarGroupContext.Provider>
  )
}

/** A small heading for a group of links. Hidden while collapsed. Names its `SidebarGroup`. */
function SidebarGroupLabel({ className, id, ...props }: React.ComponentProps<'p'>) {
  const group = React.useContext(SidebarGroupContext)
  React.useLayoutEffect(() => {
    if (!group) return
    group.setLabelled(true)
    return () => group.setLabelled(false)
  }, [group])
  return (
    <p
      data-slot="sidebar-group-label"
      id={group?.labelId ?? id}
      className={cn(
        'truncate px-2 pt-4 pb-1 font-medium text-(--sidebar-foreground,var(--foreground))/60 text-xs transition-opacity duration-(--duration-normal,200ms) group-data-[state=collapsed]/sidebar:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

/** The list of links in a group. */
function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn('flex list-none flex-col gap-1', className)}
      {...props}
    />
  )
}

/** One entry of a `SidebarMenu`, holding a `SidebarLink` or a `SidebarButton`. */
function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" className={cn('relative', className)} {...props} />
}

const itemClass =
  'relative flex h-9 w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg px-2 text-left font-medium text-(--sidebar-foreground,var(--foreground))/75 text-sm outline-none transition-[background-color,color,box-shadow] duration-(--duration-fast,150ms) hover:bg-(--sidebar-accent,var(--accent)) hover:text-(--sidebar-accent-foreground,var(--accent-foreground)) focus-visible:ring-[3px] focus-visible:ring-(--sidebar-ring,var(--ring))/50 data-[active]:bg-(--sidebar-accent,var(--accent)) data-[state=open]:bg-(--sidebar-accent,var(--accent)) data-[active]:text-(--sidebar-accent-foreground,var(--accent-foreground)) data-[state=open]:text-(--sidebar-accent-foreground,var(--accent-foreground)) data-[size=lg]:h-12 data-[size=lg]:px-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:hover:text-(--sidebar-foreground,var(--foreground))/75 [&_svg:not([class*=size-])]:size-5 [&_svg]:shrink-0'

interface SidebarItemOwnProps {
  /** Render your own element, a router link for instance, with the sidebar's look. */
  asChild?: boolean
  icon?: React.ReactNode
  /** Marks the current page or the open section. */
  active?: boolean
  /** Small text on the right, a count or a shortcut. Hidden while collapsed. */
  badge?: React.ReactNode
  /**
   * Shown in a tooltip on the collapsed rail in click mode. Defaults to the children when they
   * are text.
   */
  tooltip?: React.ReactNode
  /**
   * Keeps it focusable and hoverable but inert: `aria-disabled`, and a click does nothing. No
   * `pointer-events: none`, so the reason tooltip still shows.
   */
  disabled?: boolean
  /** Why it is disabled, "Requires a paid plan". Shown in a tooltip on hover, focus and tap. */
  disabledReason?: React.ReactNode
  /** `lg` is 48px tall, for a group selector or a user with an avatar. Default `default`. */
  size?: 'default' | 'lg'
}

type ItemProps = SidebarItemOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
    children?: React.ReactNode
    ref?: React.Ref<HTMLElement>
    [key: `data-${string}`]: unknown
  }

function textOf(node: React.ReactNode): React.ReactNode {
  return typeof node === 'string' || typeof node === 'number' ? node : undefined
}

/** Shared by links and buttons: the look, the folding label, tooltips and disabled behavior. */
function SidebarItem({
  kind,
  slot,
  closeDrawer,
  asChild,
  icon,
  active,
  badge,
  tooltip,
  disabled,
  disabledReason,
  size = 'default',
  className,
  children,
  onClick,
  onAuxClick,
  ...props
}: ItemProps & { kind: 'a' | 'button'; slot: string; closeDrawer: boolean }) {
  const { collapsible, open, inDrawer, setMobileOpen } = useSidebar()
  const [tipOpen, setTipOpen] = React.useState(false)

  const child = asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
  const content = child ? children.props.children : children
  const label = tooltip ?? textOf(content)
  const rail = collapsible === 'click' && !open && !inDrawer
  const reason = disabled ? disabledReason : undefined
  const tip = rail ? (
    reason ? (
      <>
        <span className="block font-medium">{label}</span>
        <span className="block opacity-80">{reason}</span>
      </>
    ) : (
      label
    )
  ) : (
    reason
  )
  // A menu opened from this item takes over, the tooltip would sit on top of it.
  const menuOpen = props['aria-expanded'] === true || props['aria-expanded'] === 'true'
  const showTip = tip !== undefined && tip !== null && tip !== '' && !menuOpen

  const shared = {
    'data-slot': slot,
    'data-active': active ? '' : undefined,
    'data-size': size,
    'aria-disabled': disabled || undefined,
    className: cn(itemClass, className),
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) {
        // Cancelling also keeps the tooltip trigger from closing it, so a tap shows the reason.
        e.preventDefault()
        if (reason) setTipOpen(true)
        return
      }
      onClick?.(e)
      if (closeDrawer && inDrawer) setMobileOpen(false)
    },
    onAuxClick: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) e.preventDefault()
      else onAuxClick?.(e)
    },
    ...props,
  }

  const inner = (
    <>
      {icon}
      <span
        data-slot="sidebar-label"
        className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap transition-[opacity,translate] duration-(--duration-normal,200ms) group-data-[state=collapsed]/sidebar:-translate-x-2 group-data-[state=collapsed]/sidebar:opacity-0"
      >
        {textOf(content) !== undefined ? <span className="truncate">{content}</span> : content}
        {badge !== undefined && badge !== null && (
          <span
            data-slot="sidebar-badge"
            className="ml-auto shrink-0 rounded-full bg-(--sidebar-foreground,var(--foreground))/10 px-1.5 text-[10px] text-(--sidebar-foreground,var(--foreground))/75 tabular-nums"
          >
            {badge}
          </span>
        )}
      </span>
    </>
  )

  let element: React.ReactElement
  if (child)
    element = <Slot.Root {...shared}>{React.cloneElement(children, undefined, inner)}</Slot.Root>
  else if (kind === 'a') element = <a {...(shared as React.ComponentProps<'a'>)}>{inner}</a>
  else
    element = (
      <button type="button" {...(shared as React.ComponentProps<'button'>)}>
        {inner}
      </button>
    )

  return (
    <Tooltip open={showTip && tipOpen} onOpenChange={(o) => setTipOpen(o && showTip)}>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      {showTip && (
        // The drawer is most of a phone's width, there is no room on its right.
        <TooltipContent side={inDrawer ? 'top' : 'right'} sideOffset={8}>
          {tip}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export interface SidebarLinkProps
  extends SidebarItemOwnProps,
    Omit<React.ComponentProps<'a'>, 'children'> {
  children?: React.ReactNode
  /** Close the phone drawer when clicked. Default true. */
  closeDrawer?: boolean
}

/**
 * A link with an icon and a label. The label folds away when the sidebar collapses. Clicking it
 * closes the drawer on phones and does nothing to the desktop sidebar.
 */
function SidebarLink({ active, closeDrawer = true, ...props }: SidebarLinkProps) {
  return (
    <SidebarItem
      kind="a"
      slot="sidebar-link"
      closeDrawer={closeDrawer}
      active={active}
      aria-current={active ? 'page' : undefined}
      {...(props as ItemProps)}
    />
  )
}

export interface SidebarButtonProps
  extends SidebarItemOwnProps,
    Omit<React.ComponentProps<'button'>, 'children' | 'disabled'> {
  children?: React.ReactNode
}

/**
 * A button that looks like `SidebarLink`, for things that are not pages: a group selector or a
 * user menu. Wrap it in `DropdownMenuTrigger asChild`; it is highlighted while its menu is open
 * and never closes the phone drawer.
 */
function SidebarButton(props: SidebarButtonProps) {
  return (
    <SidebarItem
      kind="button"
      slot="sidebar-button"
      closeDrawer={false}
      {...(props as ItemProps)}
    />
  )
}

/** The page next to the sidebar. */
function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return <main data-slot="sidebar-inset" className={cn('min-w-0 flex-1', className)} {...props} />
}

type ViewDirection = 'forward' | 'back'

interface SidebarViewsContextValue {
  value: string
  setValue: (value: string) => void
  leaving: string | null
  direction: ViewDirection
  /** Bumps on every change, so a view knows a transition started. Zero on first render. */
  generation: number
  register: (name: string, parent: string | undefined) => () => void
  finish: (name: string) => void
}

const SidebarViewsContext = React.createContext<SidebarViewsContextValue | null>(null)

function useSidebarViewsContext() {
  const ctx = React.useContext(SidebarViewsContext)
  if (!ctx) throw new Error('<SidebarView> must be rendered inside <SidebarViews>')
  return ctx
}

/** Read and change the current view from anywhere inside `SidebarViews`. */
function useSidebarViews() {
  const { value, setValue } = useSidebarViewsContext()
  return { value, setValue }
}

export interface SidebarViewsProps
  extends Omit<React.ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  /** Name of the view to show. Controlled, from the route for instance. */
  value?: string
  /** View to start on when uncontrolled. */
  defaultValue?: string
  /** Called when a back row asks for another view. Navigate from here when it follows the route. */
  onValueChange?: (value: string) => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]'

/**
 * Stacked menus. One `SidebarView` shows at a time; going to a view that has a `back` to the
 * current one slides left, going back slides right. The view that left is inert while it slides
 * and unmounted after, so its anchors never show up twice.
 */
function SidebarViews({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  className,
  children,
  ...props
}: SidebarViewsProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    },
    [valueProp, onValueChange],
  )

  const parents = React.useRef(new Map<string, string | undefined>())
  const register = React.useCallback((name: string, parent: string | undefined) => {
    parents.current.set(name, parent)
    return () => {
      parents.current.delete(name)
    }
  }, [])
  const depth = (name: string) => {
    let d = 0
    const seen = new Set<string>()
    let parent = parents.current.get(name)
    while (parent !== undefined && !seen.has(parent)) {
      seen.add(parent)
      d++
      parent = parents.current.get(parent)
    }
    return d
  }

  const [shown, setShown] = React.useState({
    value,
    leaving: null as string | null,
    direction: 'forward' as ViewDirection,
    generation: 0,
  })
  // Derived during render so the old view never disappears for a frame before it slides out.
  if (shown.value !== value) {
    setShown({
      value,
      leaving: shown.value,
      direction: depth(value) < depth(shown.value) ? 'back' : 'forward',
      generation: shown.generation + 1,
    })
  }
  const finish = React.useCallback((name: string) => {
    setShown((s) => (s.leaving === name ? { ...s, leaving: null } : s))
  }, [])

  // Focus inside the view that left would be lost to the body. Move it to the new view.
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (shown.generation === 0) return
    const root = ref.current
    const active = document.activeElement
    const left = root?.querySelector('[data-slot=sidebar-view][data-leaving]')
    if (!root || !active || !left?.contains(active)) return
    const view = root.querySelector('[data-slot=sidebar-view]:not([data-leaving])')
    view?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
  }, [shown.generation])

  const ctx = React.useMemo<SidebarViewsContextValue>(
    () => ({
      value: shown.value,
      setValue,
      leaving: shown.leaving,
      direction: shown.direction,
      generation: shown.generation,
      register,
      finish,
    }),
    [shown, setValue, register, finish],
  )

  return (
    <SidebarViewsContext.Provider value={ctx}>
      <div
        ref={ref}
        data-slot="sidebar-views"
        data-direction={shown.leaving ? shown.direction : undefined}
        className={cn('relative flex flex-col', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarViewsContext.Provider>
  )
}

export interface SidebarViewProps extends React.ComponentProps<'div'> {
  name: string
  /** Adds a back row at the top that switches to `to`. Also makes this view deeper than `to`. */
  back?: { to: string; label: React.ReactNode; icon?: React.ReactNode }
}

/** One menu inside `SidebarViews`. Only mounted while it shows or slides out. */
function SidebarView({ name, back, className, children, ...props }: SidebarViewProps) {
  const ctx = useSidebarViewsContext()
  const { register, finish, setValue, direction, generation } = ctx
  const parent = back?.to
  React.useLayoutEffect(() => register(name, parent), [register, name, parent])

  const role = name === ctx.value ? 'active' : name === ctx.leaving ? 'leaving' : null
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!role || generation === 0 || !el) return
    const motion = typeof el.animate === 'function' && !reducedMotion()
    if (!motion) {
      if (role === 'leaving') finish(name)
      return
    }
    const sign = direction === 'forward' ? 1 : -1
    const frames =
      role === 'leaving'
        ? [
            { transform: 'translateX(0)', opacity: 1 },
            { transform: `translateX(${-sign * 100}%)`, opacity: 0 },
          ]
        : [
            { transform: `translateX(${sign * 100}%)`, opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 },
          ]
    const easing =
      getComputedStyle(el).getPropertyValue('--easing-sheet').trim() ||
      'cubic-bezier(0.32, 0.72, 0, 1)'
    const animation = el.animate(frames, {
      duration: tokenMs(el, '--duration-slow', 300),
      easing,
    })
    if (role === 'leaving') animation.onfinish = () => finish(name)
    return () => {
      animation.onfinish = null
      animation.cancel()
    }
  }, [role, generation, direction, finish, name])

  if (!role) return null
  const leaving = role === 'leaving'
  return (
    <div
      ref={ref}
      data-slot="sidebar-view"
      data-view={name}
      data-leaving={leaving ? '' : undefined}
      inert={leaving || undefined}
      aria-hidden={leaving || undefined}
      className={cn(
        'flex w-full flex-col gap-1',
        leaving && 'pointer-events-none absolute inset-x-0 top-0',
        className,
      )}
      {...props}
    >
      {back && (
        <SidebarButton
          data-slot="sidebar-view-back"
          icon={back.icon ?? <ChevronLeftIcon />}
          onClick={() => setValue(back.to)}
        >
          {back.label}
        </SidebarButton>
      )}
      {children}
    </div>
  )
}

export {
  Sidebar,
  SidebarButton,
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
  useSidebarViews,
}
