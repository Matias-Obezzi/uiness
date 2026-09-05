'use client'

import { PanelLeftIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerTitle } from '@/ui/drawer'

export type SidebarCollapsible = 'hover' | 'click' | 'none'
export type SidebarBreakpoint = 'sm' | 'md' | 'lg'

const breakpointPx: Record<SidebarBreakpoint, number> = { sm: 640, md: 768, lg: 1024 }
const fromBreakpoint: Record<SidebarBreakpoint, string> = {
  sm: 'hidden sm:flex',
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
}
const belowBreakpoint: Record<SidebarBreakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
}

interface SidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  isMobile: boolean
  collapsible: SidebarCollapsible
  breakpoint: SidebarBreakpoint
  width: number
  collapsedWidth: number
  /** Whether labels show: open on desktop, always inside the mobile drawer. */
  expanded: boolean
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
    const mq = matchMedia(`(max-width: ${breakpointPx[breakpoint] - 1}px)`)
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
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * `hover` expands while the pointer is over it, `click` toggles from `SidebarTrigger`,
   * `none` is always expanded. Default hover.
   */
  collapsible?: SidebarCollapsible
  /** Below this Tailwind breakpoint the sidebar becomes a drawer. Default md. */
  breakpoint?: SidebarBreakpoint
  /** Expanded width in pixels. Default 240. */
  width?: number
  /** Collapsed width in pixels. Default 60. */
  collapsedWidth?: number
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
  children,
}: SidebarProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? collapsible !== 'hover')
  const open = collapsible === 'none' ? true : (openProp ?? uncontrolled)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  const toggle = React.useCallback(() => setOpen(!open), [open, setOpen])
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const isMobile = useIsMobile(breakpoint)
  React.useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile])

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
    }),
    [open, setOpen, toggle, mobileOpen, isMobile, collapsible, breakpoint, width, collapsedWidth],
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export interface SidebarProps extends React.ComponentProps<'aside'> {
  /** Accessible name of the mobile drawer. Default "Menu". */
  label?: string
}

/**
 * The panel itself. On wide screens a sticky column that collapses to icons; below the
 * breakpoint a drawer opened from `SidebarTrigger`. The same children render in both.
 */
function Sidebar({
  label = 'Menu',
  className,
  children,
  onPointerEnter,
  onPointerLeave,
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
  const mobileValue = React.useMemo<SidebarContextValue>(() => ({ ...ctx, expanded: true }), [ctx])
  return (
    <>
      <aside
        data-slot="sidebar"
        data-state={open ? 'expanded' : 'collapsed'}
        data-collapsible={collapsible}
        className={cn(
          'group/sidebar sticky top-0 h-dvh shrink-0 flex-col overflow-hidden border-r bg-background transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          fromBreakpoint[breakpoint],
          className,
        )}
        style={{ width: open ? width : collapsedWidth }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e)
          if (collapsible === 'hover') setOpen(true)
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e)
          if (collapsible === 'hover') setOpen(false)
        }}
        {...props}
      >
        {children}
      </aside>
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent
          side="left"
          showCloseButton={false}
          className={cn('w-72', belowBreakpoint[breakpoint])}
        >
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          <DrawerDescription className="sr-only">Navigation</DrawerDescription>
          <DrawerBody className="group/sidebar flex flex-col px-3 py-4" data-state="expanded">
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
  const { isMobile, setMobileOpen, toggle, collapsible, open } = useSidebar()
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle sidebar"
      aria-expanded={isMobile ? undefined : open}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (isMobile) setMobileOpen(true)
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

/** A small heading for a group of links. Hidden while collapsed. */
function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn(
        'truncate px-3 pt-4 pb-1 font-medium text-muted-foreground text-xs transition-opacity duration-200 group-data-[state=collapsed]/sidebar:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export interface SidebarLinkProps extends React.ComponentProps<'a'> {
  asChild?: boolean
  icon?: React.ReactNode
  active?: boolean
  /** Small text on the right, a count or a shortcut. Hidden while collapsed. */
  badge?: React.ReactNode
}

/** A link with an icon and a label. The label folds away when the sidebar collapses. */
function SidebarLink({
  asChild,
  icon,
  active,
  badge,
  className,
  children,
  onClick,
  ...props
}: SidebarLinkProps) {
  const { setMobileOpen } = useSidebar()
  const Comp = asChild ? Slot.Root : 'a'
  const label = asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children
  return (
    <Comp
      data-slot="sidebar-link"
      data-active={active ? '' : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-3 overflow-hidden rounded-lg px-2 font-medium text-muted-foreground text-sm outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active]:bg-accent data-[active]:text-foreground [&_svg]:size-5 [&_svg]:shrink-0',
        className,
      )}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        setMobileOpen(false)
      }}
      {...props}
    >
      {icon}
      <span
        data-slot="sidebar-label"
        className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap transition-[opacity,translate] duration-200 group-data-[state=collapsed]/sidebar:-translate-x-2 group-data-[state=collapsed]/sidebar:opacity-0"
      >
        <span className="truncate">{label}</span>
        {badge !== undefined && (
          <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
            {badge}
          </span>
        )}
      </span>
    </Comp>
  )
}

/** The page next to the sidebar. */
function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return <main data-slot="sidebar-inset" className={cn('min-w-0 flex-1', className)} {...props} />
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarLink,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
