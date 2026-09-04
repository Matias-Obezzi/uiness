'use client'

import { MenuIcon, MoreHorizontalIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  type DrawerSide,
  DrawerTitle,
} from '@/ui/drawer'

export type NavbarLayout = 'bar' | 'drawer' | 'tabs'
export type NavbarBreakpoint = 'sm' | 'md' | 'lg'
export type NavbarMobile = 'drawer' | 'tabs' | 'none'

const fromBreakpoint: Record<NavbarBreakpoint, string> = {
  sm: 'hidden sm:flex',
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
}
const belowBreakpoint: Record<NavbarBreakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
}

interface NavbarContextValue {
  layout: NavbarLayout
  breakpoint: NavbarBreakpoint
  /** Close whichever menu the link lives in. */
  closeMenu?: () => void
}

const NavbarContext = React.createContext<NavbarContextValue>({ layout: 'bar', breakpoint: 'md' })

const breakpointPx: Record<NavbarBreakpoint, number> = { sm: 640, md: 768, lg: 1024 }

/** Close a mobile menu when the viewport grows past the breakpoint. */
function useCloseAbove(breakpoint: NavbarBreakpoint, close: () => void) {
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(`(min-width: ${breakpointPx[breakpoint]}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) close()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint, close])
}

function useHideOnScroll(enabled: boolean) {
  const [hidden, setHidden] = React.useState(false)
  React.useEffect(() => {
    if (!enabled) {
      setHidden(false)
      return
    }
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - last
      if (Math.abs(delta) < 8) return
      setHidden(delta > 0 && y > 64)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])
  return hidden
}

export interface NavbarProps extends React.ComponentProps<'header'> {
  /**
   * What happens below the breakpoint: `drawer` collapses the links into a menu button,
   * `tabs` moves them to a bottom bar with icons, `none` leaves them out.
   */
  mobile?: NavbarMobile
  /** Tailwind breakpoint where the desktop bar appears. Default `md`. */
  breakpoint?: NavbarBreakpoint
  /** Stick to the top of the page. Default true. */
  sticky?: boolean
  /** Hide the bar while scrolling down, bring it back on the way up. */
  hideOnScroll?: boolean
  /** Bottom bar slots, including the "More" tab when there are more links. Default 5. */
  maxTabs?: number
  /** Edge the mobile menu opens from. Default bottom. */
  menuSide?: DrawerSide
  menuTitle?: string
  /** Label of the overflow tab in the bottom bar. Default "More". */
  moreLabel?: string
  /** Extra content under the links in the mobile menu, for actions that do not fit the bar. */
  menu?: React.ReactNode
  /** Classes for the inner container, which centers the content. */
  containerClassName?: string
}

function Navbar({
  mobile = 'drawer',
  breakpoint = 'md',
  sticky = true,
  hideOnScroll = false,
  maxTabs = 5,
  menuSide = 'bottom',
  menuTitle = 'Menu',
  moreLabel = 'More',
  menu,
  className,
  containerClassName,
  children,
  ...props
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const hidden = useHideOnScroll(hideOnScroll) && !menuOpen

  const items = React.Children.toArray(children)
  const links = items.find(
    (child): child is React.ReactElement<NavbarLinksProps> =>
      React.isValidElement(child) && child.type === NavbarLinks,
  )
  const hasActions = items.some(
    (child) => React.isValidElement(child) && child.type === NavbarActions,
  )

  const barValue = React.useMemo<NavbarContextValue>(
    () => ({ layout: 'bar', breakpoint }),
    [breakpoint],
  )
  const closeMenu = React.useCallback(() => setMenuOpen(false), [])
  useCloseAbove(breakpoint, closeMenu)
  const drawerValue = React.useMemo<NavbarContextValue>(
    () => ({ layout: 'drawer', breakpoint, closeMenu }),
    [breakpoint, closeMenu],
  )
  const tabsValue = React.useMemo<NavbarContextValue>(
    () => ({ layout: 'tabs', breakpoint }),
    [breakpoint],
  )

  return (
    <>
      <NavbarContext.Provider value={barValue}>
        <header
          data-slot="navbar"
          data-hidden={hidden ? '' : undefined}
          className={cn(
            'z-40 w-full border-b bg-background/80 backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-background/60',
            sticky && 'sticky top-0',
            hidden && '-translate-y-full',
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              'mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6',
              containerClassName,
            )}
          >
            {children}
            {mobile === 'drawer' && links && (
              <button
                type="button"
                data-slot="navbar-menu-button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className={cn(
                  'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-5',
                  belowBreakpoint[breakpoint],
                  !hasActions && 'ml-auto',
                )}
              >
                <MenuIcon />
              </button>
            )}
          </div>
        </header>
      </NavbarContext.Provider>

      {mobile === 'drawer' && links && (
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerContent side={menuSide} className={belowBreakpoint[breakpoint]}>
            <DrawerTitle className="sr-only">{menuTitle}</DrawerTitle>
            <DrawerDescription className="sr-only">Site navigation</DrawerDescription>
            <DrawerBody className="px-3 pt-2 pb-4">
              <NavbarContext.Provider value={drawerValue}>{links}</NavbarContext.Provider>
              {menu && <div className="mt-3 border-t pt-3">{menu}</div>}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {mobile === 'tabs' && links && (
        <NavbarContext.Provider value={tabsValue}>
          {React.cloneElement(links, { maxTabs, menuTitle: moreLabel, menu })}
        </NavbarContext.Provider>
      )}
    </>
  )
}

export interface NavbarBrandProps extends React.ComponentProps<'a'> {
  asChild?: boolean
}

function NavbarBrand({ asChild, className, ...props }: NavbarBrandProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      data-slot="navbar-brand"
      className={cn(
        'flex shrink-0 items-center gap-2 font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-5',
        className,
      )}
      {...props}
    />
  )
}

export interface NavbarLinksProps extends React.ComponentProps<'nav'> {
  /** Set by Navbar in tabs layout. */
  maxTabs?: number
  menuTitle?: string
  menu?: React.ReactNode
}

function NavbarLinks({
  className,
  children,
  maxTabs = 5,
  menuTitle = 'More',
  menu,
  ...props
}: NavbarLinksProps) {
  const { layout, breakpoint } = React.useContext(NavbarContext)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const closeMore = React.useCallback(() => setMoreOpen(false), [])
  useCloseAbove(breakpoint, closeMore)
  const moreValue = React.useMemo<NavbarContextValue>(
    () => ({ layout: 'drawer', breakpoint, closeMenu: closeMore }),
    [breakpoint, closeMore],
  )

  if (layout === 'drawer') {
    return (
      <nav
        data-slot="navbar-links"
        data-layout="drawer"
        aria-label="Primary"
        className={cn('flex flex-col gap-0.5', className)}
        {...props}
      >
        {children}
      </nav>
    )
  }

  if (layout === 'tabs') {
    const all = React.Children.toArray(children)
    const overflow = all.length > maxTabs
    const shown = overflow ? all.slice(0, Math.max(1, maxTabs - 1)) : all
    const rest = overflow ? all.slice(Math.max(1, maxTabs - 1)) : []
    return (
      <>
        <nav
          data-slot="navbar-tabs"
          aria-label="Primary"
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-stretch border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/75',
            belowBreakpoint[breakpoint],
            className,
          )}
          {...props}
        >
          {shown}
          {overflow && (
            <button
              type="button"
              data-slot="navbar-tab"
              aria-label={menuTitle}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={tabClass}
            >
              <span className="relative [&_svg]:size-6">
                <MoreHorizontalIcon />
              </span>
              <span className="truncate">{menuTitle}</span>
            </button>
          )}
        </nav>
        {overflow && (
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
            <DrawerContent className={belowBreakpoint[breakpoint]}>
              <DrawerTitle className="sr-only">{menuTitle}</DrawerTitle>
              <DrawerDescription className="sr-only">More pages</DrawerDescription>
              <DrawerBody className="px-3 pt-2 pb-4">
                <NavbarContext.Provider value={moreValue}>
                  <nav
                    data-slot="navbar-links"
                    data-layout="drawer"
                    aria-label="More"
                    className="flex flex-col gap-0.5"
                  >
                    {rest}
                  </nav>
                </NavbarContext.Provider>
                {menu && <div className="mt-3 border-t pt-3">{menu}</div>}
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </>
    )
  }

  return (
    <nav
      data-slot="navbar-links"
      data-layout="bar"
      aria-label="Primary"
      className={cn('items-center gap-1', fromBreakpoint[breakpoint], className)}
      {...props}
    >
      {children}
    </nav>
  )
}

const tabClass =
  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 font-medium text-[11px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[active]:text-foreground'

export interface NavbarLinkProps extends React.ComponentProps<'a'> {
  asChild?: boolean
  /** Shown in the bottom bar and the menu, optional in the desktop bar. */
  icon?: React.ReactNode
  /** Marks the current page. Router agnostic, you decide. */
  active?: boolean
  /** A count or a dot next to the icon. */
  badge?: React.ReactNode
  /** Show the icon in the desktop bar too. Default false. */
  showIcon?: boolean
}

function NavbarLink({
  asChild,
  icon,
  active,
  badge,
  showIcon = false,
  className,
  children,
  onClick,
  ...props
}: NavbarLinkProps) {
  const { layout, closeMenu } = React.useContext(NavbarContext)
  const Comp = asChild ? Slot.Root : 'a'
  const label = asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children
  const shared = {
    'data-slot': layout === 'tabs' ? 'navbar-tab' : 'navbar-link',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      // Routers call preventDefault on their links, so the menu closes either way.
      closeMenu?.()
    },
    ...props,
  }

  const badgeNode =
    badge === undefined || badge === null || badge === false ? null : (
      <span
        data-slot="navbar-badge"
        className={cn(
          'flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground leading-none',
          badge === true && 'size-2 min-w-0 px-0',
        )}
      >
        {badge === true ? null : badge}
      </span>
    )

  if (layout === 'tabs') {
    return (
      <Comp {...shared} className={cn(tabClass, className)}>
        <span className="relative [&_svg]:size-6">
          {icon}
          {badgeNode && <span className="absolute -top-1 -right-1.5">{badgeNode}</span>}
        </span>
        {label}
      </Comp>
    )
  }

  if (layout === 'drawer') {
    return (
      <Comp
        {...shared}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-base text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent data-[active]:bg-accent [&_svg]:size-5 [&_svg]:text-muted-foreground data-[active]:[&_svg]:text-foreground',
          className,
        )}
      >
        {icon}
        {label}
        {badgeNode && <span className="ml-auto">{badgeNode}</span>}
      </Comp>
    )
  }

  return (
    <Comp
      {...shared}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active]:text-foreground [&_svg]:size-4',
        className,
      )}
    >
      {showIcon && icon}
      {label}
      {badgeNode}
    </Comp>
  )
}

function NavbarActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-actions"
      className={cn('ml-auto flex items-center gap-1', className)}
      {...props}
    />
  )
}

/** Keeps page content clear of the bottom bar. Put it at the end of the page. */
function NavbarSpacer({
  breakpoint = 'md',
  className,
  ...props
}: React.ComponentProps<'div'> & { breakpoint?: NavbarBreakpoint }) {
  return (
    <div
      data-slot="navbar-spacer"
      aria-hidden
      className={cn(
        'h-[calc(3.5rem+env(safe-area-inset-bottom))]',
        belowBreakpoint[breakpoint],
        className,
      )}
      {...props}
    />
  )
}

export { Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarLinks, NavbarSpacer }
