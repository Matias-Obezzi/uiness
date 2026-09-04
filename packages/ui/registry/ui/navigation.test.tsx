import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeIcon } from 'lucide-react'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Combobox } from './combobox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  commandScore,
  useCommandShortcut,
} from './command'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from './drawer'
import { Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarLinks } from './navbar'
import { ScrollArea } from './scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  window.HTMLElement.prototype.setPointerCapture ??= () => {}
})

describe('Drawer', () => {
  it('opens from the trigger with a handle and closes with Escape', async () => {
    const user = userEvent.setup()
    render(
      <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the list.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    )
    await user.click(screen.getByText('Open'))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog.dataset.side).toBe('bottom')
    expect(within(dialog).getByLabelText('Drag to close')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cycles snap points from the handle and reports the change', async () => {
    const user = userEvent.setup()
    const onSnap = vi.fn()
    render(
      <Drawer defaultOpen>
        <DrawerContent snapPoints={[0.4, 1]} onActiveSnapPointChange={onSnap}>
          <DrawerTitle>Sheet</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.style.height).toBe('100dvh')
    const startOffset = window.innerHeight * 0.6
    expect(dialog.style.transform).toBe(`translate3d(0, ${startOffset}px, 0)`)
    await user.click(screen.getByLabelText('Resize drawer'))
    expect(onSnap).toHaveBeenCalledWith(1)
  })

  it('does not close from Escape when not dismissible and shows no handle on side drawers', async () => {
    const user = userEvent.setup()
    render(
      <Drawer defaultOpen>
        <DrawerContent side="right" dismissible={false}>
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Settings' })
    expect(dialog.dataset.side).toBe('right')
    expect(within(dialog).queryByLabelText('Drag to close')).toBeNull()
    expect(within(dialog).getByText('Close')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('closes after a drag past the threshold', () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer defaultOpen onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle>Sheet</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog')
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      height: 400,
      width: 800,
      top: 0,
      left: 0,
      right: 800,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect)
    fireEvent.pointerDown(dialog, { pointerId: 1, clientX: 100, clientY: 100, button: 0 })
    fireEvent.pointerMove(dialog, { pointerId: 1, clientX: 100, clientY: 120 })
    fireEvent.pointerMove(dialog, { pointerId: 1, clientX: 100, clientY: 400 })
    expect(dialog.hasAttribute('data-dragging')).toBe(true)
    expect(dialog.style.transform).toBe('translate3d(0, 280px, 0)')
    fireEvent.pointerUp(dialog, { pointerId: 1, clientX: 100, clientY: 400 })
    return vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

function SiteNav(props: React.ComponentProps<typeof Navbar>) {
  return (
    <Navbar {...props}>
      <NavbarBrand href="/">Acme</NavbarBrand>
      <NavbarLinks>
        <NavbarLink href="/" icon={<HomeIcon />} active>
          Home
        </NavbarLink>
        <NavbarLink href="/explore" icon={<HomeIcon />} badge={3}>
          Explore
        </NavbarLink>
        <NavbarLink href="/inbox" icon={<HomeIcon />}>
          Inbox
        </NavbarLink>
        <NavbarLink href="/profile" icon={<HomeIcon />}>
          Profile
        </NavbarLink>
        <NavbarLink href="/settings" icon={<HomeIcon />}>
          Settings
        </NavbarLink>
        <NavbarLink href="/help" icon={<HomeIcon />}>
          Help
        </NavbarLink>
      </NavbarLinks>
      <NavbarActions>
        <button type="button">Sign in</button>
      </NavbarActions>
    </Navbar>
  )
}

describe('Navbar', () => {
  it('renders the bar links and opens the mobile menu with the same links', async () => {
    const user = userEvent.setup()
    render(<SiteNav />)
    const bar = screen.getByRole('navigation', { name: 'Primary' })
    expect(bar.dataset.layout).toBe('bar')
    expect(within(bar).getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe(
      'page',
    )
    await user.click(screen.getByLabelText('Open menu'))
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    const links = within(menu).getAllByRole('link')
    expect(links).toHaveLength(6)
    expect(within(menu).getByText('3')).toBeTruthy()
    await user.click(within(menu).getByRole('link', { name: /Inbox/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes the menu even when the link prevents default, as routers do', async () => {
    const user = userEvent.setup()
    render(
      <Navbar>
        <NavbarLinks>
          <NavbarLink href="/inbox" onClick={(e) => e.preventDefault()}>
            Inbox
          </NavbarLink>
        </NavbarLinks>
      </Navbar>,
    )
    await user.click(screen.getByLabelText('Open menu'))
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    await user.click(within(menu).getByRole('link', { name: 'Inbox' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('moves links to a bottom bar with a More tab when there are too many', async () => {
    const user = userEvent.setup()
    render(<SiteNav mobile="tabs" maxTabs={5} />)
    const navs = screen.getAllByRole('navigation', { name: 'Primary' })
    const tabs = navs.find((n) => n.dataset.slot === 'navbar-tabs')
    expect(tabs).toBeTruthy()
    if (!tabs) return
    expect(within(tabs).getAllByRole('link')).toHaveLength(4)
    expect(screen.queryByLabelText('Open menu')).toBeNull()
    await user.click(within(tabs).getByRole('button', { name: 'More' }))
    const more = screen.getByRole('dialog', { name: 'More' })
    expect(
      within(more)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Settings', 'Help'])
  })

  it('hides while scrolling down and comes back on the way up', () => {
    render(<SiteNav hideOnScroll />)
    const header = screen.getByRole('banner')
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    act(() => {
      window.scrollY = 300
      window.dispatchEvent(new Event('scroll'))
    })
    expect(header.hasAttribute('data-hidden')).toBe(true)
    act(() => {
      window.scrollY = 200
      window.dispatchEvent(new Event('scroll'))
    })
    expect(header.hasAttribute('data-hidden')).toBe(false)
  })
})

describe('commandScore', () => {
  it('ranks exact, prefix, substring and scattered matches in that order', () => {
    expect(commandScore('Settings', 'settings')).toBe(1)
    const prefix = commandScore('Settings', 'set')
    const inside = commandScore('User settings', 'sett')
    const scattered = commandScore('Settings', 'stgs')
    expect(prefix).toBeGreaterThan(inside)
    expect(inside).toBeGreaterThan(scattered)
    expect(scattered).toBeGreaterThan(0)
    expect(commandScore('Settings', 'xyz')).toBe(0)
  })

  it('matches keywords and ignores accents', () => {
    expect(commandScore('Profile', 'account', ['account', 'me'])).toBeGreaterThan(0)
    expect(commandScore('Configuración', 'configuracion')).toBe(1)
  })
})

function Palette({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Type a command" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={onSelect}>Home</CommandItem>
          <CommandItem onSelect={onSelect} keywords={['preferences']}>
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={onSelect}>Log out</CommandItem>
          <CommandItem onSelect={onSelect} disabled>
            Delete account
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

describe('Command', () => {
  it('filters items and groups as you type, and shows the empty state', async () => {
    const user = userEvent.setup()
    render(<Palette onSelect={() => {}} />)
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(screen.queryByText('Nothing found.')).toBeNull()
    await user.type(screen.getByRole('combobox'), 'pref')
    const options = screen.getAllByRole('option').filter((o) => !o.hidden)
    expect(options.map((o) => o.textContent)).toEqual(['Settings'])
    const actionsGroup = screen.getByText('Actions').closest<HTMLElement>('[role=group]')
    expect(actionsGroup?.hidden).toBe(true)
    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText('Nothing found.')).toBeTruthy()
  })

  it('moves with the arrows, skips disabled items and selects with Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Palette onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    const selectedText = () =>
      screen.getAllByRole('option').find((o) => o.dataset.selected !== undefined)?.textContent
    expect(selectedText()).toBe('Home')
    await user.click(input)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(selectedText()).toBe('Log out')
    await user.keyboard('{ArrowDown}')
    expect(selectedText()).toBe('Home')
    await user.keyboard('{ArrowUp}')
    expect(selectedText()).toBe('Log out')
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('Log out')
    expect(input.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Log out' }).id,
    )
  })

  it('selects with the mouse', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Palette onSelect={onSelect} />)
    await user.click(screen.getByRole('option', { name: 'Settings' }))
    expect(onSelect).toHaveBeenCalledWith('Settings')
  })

  it('runs the shortcut on mod+k', () => {
    const handler = vi.fn()
    function Host() {
      useCommandShortcut(handler)
      return null
    }
    render(<Host />)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    fireEvent.keyDown(document, { key: 'k' })
    expect(handler).toHaveBeenCalledTimes(2)
  })
})

const frameworks = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro', group: 'Static' },
]

describe('Combobox', () => {
  it('picks one option, closes and can deselect it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Combobox options={frameworks} onValueChange={onValueChange} placeholder="Pick" />)
    const trigger = screen.getByRole('combobox', { name: /Pick/ })
    await user.click(trigger)
    await user.type(screen.getByPlaceholderText('Search…'), 'rem')
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('remix')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger.textContent).toContain('Remix')
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Remix' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('toggles several options when multiple', async () => {
    const user = userEvent.setup()
    function Host() {
      const [value, setValue] = useState<string[]>([])
      return (
        <Combobox
          multiple
          options={frameworks}
          value={value}
          onValueChange={setValue}
          name="fw"
          placeholder="Frameworks"
        />
      )
    }
    render(<Host />)
    const trigger = screen.getByRole('combobox', { name: 'Frameworks' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Next.js' }))
    await user.click(screen.getByRole('option', { name: 'Astro' }))
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(trigger.textContent).toContain('Next.js, Astro')
    expect(document.querySelectorAll('input[name=fw]')).toHaveLength(2)
  })
})

describe('Select and ScrollArea', () => {
  it('renders a select with a placeholder and its items', async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="pear">Pear</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger.textContent).toContain('Pick a fruit')
    await user.click(trigger)
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('wraps children in a viewport and can keep its bars on screen', () => {
    render(
      <ScrollArea className="h-20" type="always">
        <p>Long content</p>
      </ScrollArea>,
    )
    const viewport = screen.getByText('Long content').closest('[data-slot=scroll-area-viewport]')
    expect(viewport).toBeTruthy()
    expect(document.querySelector('[data-slot=scroll-area-scrollbar]')).toBeTruthy()
  })
})
