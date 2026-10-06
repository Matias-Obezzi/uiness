'use client'

import { ArrowRightIcon, MenuIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { HoverHighlight, HoverHighlightItem } from '@/components/ui/hover-highlight'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** Whose site this is. The same shape as the `brand` of the other blocks. */
export interface NavbarBrand {
  /** The wordmark. */
  name: string
  /** Where the wordmark goes. Default `/`. */
  href?: string
  /** The mark before the name, like `<MountainIcon />` or an `<img>`. Without one it shows the first letter. */
  logo?: React.ReactNode
}

export interface NavbarLink {
  label: string
  href: string
  /** Marks the link as the page you are on. */
  current?: boolean
}

export interface NavbarAction {
  label: string
  href: string
}

export interface Navbar01Props extends React.ComponentProps<'header'> {
  brand?: NavbarBrand
  links?: NavbarLink[]
  /** A quiet text link before the button, often sign in. `null` hides it. */
  secondaryAction?: NavbarAction | null
  /** The button at the end. `null` hides it. */
  primaryAction?: NavbarAction | null
  /** Stick to the top of the scrolling page. Default false. */
  sticky?: boolean
  /** Accessible name of the menu button on narrow widths. */
  menuLabel?: string
}

const defaultBrand: NavbarBrand = { name: 'Acme', href: '#' }

const defaultLinks: NavbarLink[] = [
  { label: 'Product', href: '#' },
  { label: 'Solutions', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Customers', href: '#' },
  { label: 'Changelog', href: '#' },
]

/**
 * A site header: a wordmark, the main links, a sign in link and a button. When its container
 * gets narrow the links fold into a menu button that opens a panel, so it fits a phone as well
 * as a wide page, going by the width it is given rather than the window.
 */
function Navbar01({
  brand = defaultBrand,
  links = defaultLinks,
  secondaryAction = { label: 'Sign in', href: '#' },
  primaryAction = { label: 'Start free', href: '#' },
  sticky = false,
  menuLabel = 'Menu',
  className,
  ...props
}: Navbar01Props) {
  const [open, setOpen] = React.useState(false)
  return (
    <header
      data-slot="block-navbar-01"
      className={cn(
        '@container w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65',
        sticky && 'sticky top-0 z-(--z-sticky,40)',
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <a
          href={brand.href ?? '/'}
          className="group flex shrink-0 items-center gap-2 rounded-md font-semibold text-subheading outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-primary/10 ring-inset transition-transform duration-(--duration-normal,200ms) ease-(--easing-spring,ease-out) group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none [&_svg]:size-4"
          >
            {brand.logo ?? brand.name.charAt(0)}
          </span>
          {brand.name}
        </a>

        {links.length > 0 && (
          <nav aria-label="Main" className="hidden @3xl:block">
            <HoverHighlight highlightClassName="rounded-full bg-accent" duration={200}>
              <ul className="flex items-center">
                {links.map((link) => (
                  <li key={link.label}>
                    <HoverHighlightItem>
                      <a
                        href={link.href}
                        aria-current={link.current ? 'page' : undefined}
                        className="relative block rounded-full px-3.5 py-1.5 text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                      >
                        {link.label}
                      </a>
                    </HoverHighlightItem>
                  </li>
                ))}
              </ul>
            </HoverHighlight>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              className="hidden rounded-md px-3 py-1.5 font-medium text-sm outline-none transition-colors hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 @3xl:inline-block"
            >
              {secondaryAction.label}
            </a>
          )}
          {primaryAction && (
            <Button asChild size="sm" className="group hidden rounded-full @md:inline-flex">
              <a href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRightIcon className="transition-transform duration-(--duration-fast,150ms) group-hover:translate-x-0.5" />
              </a>
            </Button>
          )}
          {links.length + (secondaryAction ? 1 : 0) + (primaryAction ? 1 : 0) > 0 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={menuLabel}
                  className="relative -mr-2 @3xl:hidden"
                >
                  <MenuIcon
                    className={cn(
                      'absolute transition-[transform,opacity] duration-(--duration-normal,200ms) motion-reduce:transition-none',
                      open && 'rotate-90 opacity-0',
                    )}
                  />
                  <XIcon
                    className={cn(
                      'absolute transition-[transform,opacity] duration-(--duration-normal,200ms) motion-reduce:transition-none',
                      !open && '-rotate-90 opacity-0',
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={12}
                aria-label={menuLabel}
                className="w-[min(20rem,calc(100vw-2rem))] p-2"
              >
                {links.length > 0 && (
                  <nav aria-label="Main">
                    <ul className="flex flex-col">
                      {links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            aria-current={link.current ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between rounded-md px-3 py-2.5 font-medium text-body outline-none transition-colors hover:bg-accent focus-visible:bg-accent aria-[current=page]:bg-accent"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
                {(secondaryAction || primaryAction) && (
                  <div
                    className={cn(
                      'flex flex-col gap-2 p-1',
                      links.length > 0 && 'mt-2 border-t pt-3',
                    )}
                  >
                    {secondaryAction && (
                      <Button asChild variant="outline">
                        <a href={secondaryAction.href} onClick={() => setOpen(false)}>
                          {secondaryAction.label}
                        </a>
                      </Button>
                    )}
                    {primaryAction && (
                      <Button asChild>
                        <a href={primaryAction.href} onClick={() => setOpen(false)}>
                          {primaryAction.label}
                          <ArrowRightIcon />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  )
}

export { Navbar01 }
