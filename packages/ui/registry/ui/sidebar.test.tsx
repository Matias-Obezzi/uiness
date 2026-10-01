import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import {
  Sidebar,
  SidebarButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarLink,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  type SidebarProviderProps,
  SidebarTrigger,
  SidebarView,
  SidebarViews,
} from './sidebar'

function mockMatchMedia(mobile: boolean) {
  return vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: mobile && query.startsWith('(max-width'),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

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
})

afterEach(() => {
  vi.restoreAllMocks()
  // biome-ignore lint/suspicious/noDocumentCookie: clearing the cookie a test wrote
  document.cookie = 'sidebar_state=; path=/; max-age=0'
})

const spacer = () => {
  const el = document.querySelector<HTMLElement>('[data-slot=sidebar]')
  if (!el) throw new Error('no sidebar')
  return el
}
const panel = () => {
  const el = document.querySelector<HTMLElement>('[data-slot=sidebar-panel]')
  if (!el) throw new Error('no panel')
  return el
}

function App(props: Partial<SidebarProviderProps>) {
  return (
    <SidebarProvider collapsible="hover" {...props}>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarLink href="/" active data-tour="home">
                  Home
                </SidebarLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarLink href="#inbox" badge={3}>
                  Inbox
                </SidebarLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger />
      <input aria-label="Editor" />
    </SidebarProvider>
  )
}

describe('Sidebar', () => {
  it('expands over the page in hover mode without changing the reserved width', () => {
    render(<App />)
    expect(spacer().dataset.state).toBe('collapsed')
    expect(spacer().style.width).toBe('60px')
    expect(panel().style.width).toBe('60px')
    fireEvent.pointerEnter(spacer())
    expect(spacer().dataset.state).toBe('expanded')
    expect(panel().style.width).toBe('240px')
    // The column in the layout keeps its collapsed width, so nothing next to it reflows.
    expect(spacer().style.width).toBe('60px')
    expect(panel().className).toContain('absolute')
    expect(panel().className).toContain('shadow-xl')
    fireEvent.pointerLeave(spacer())
    expect(spacer().dataset.state).toBe('collapsed')
    expect(screen.getByRole('link', { name: /Home/ }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('collapses on a pointer move outside, after a missed leave', () => {
    render(<App />)
    fireEvent.pointerEnter(spacer())
    fireEvent.pointerMove(screen.getByRole('link', { name: /Home/ }))
    expect(spacer().dataset.state).toBe('expanded')
    fireEvent.pointerMove(document.body)
    expect(spacer().dataset.state).toBe('collapsed')
  })

  it('pushes the page in click mode and remembers the state in a cookie', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<App collapsible="click" onOpenChange={onOpenChange} />)
    expect(spacer().dataset.state).toBe('expanded')
    expect(spacer().style.width).toBe('240px')
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(spacer().dataset.state).toBe('collapsed')
    expect(spacer().style.width).toBe('60px')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.cookie).toContain('sidebar_state=false')
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(document.cookie).toContain('sidebar_state=true')
  })

  it('starts from defaultOpen and takes a custom cookie name', async () => {
    const user = userEvent.setup()
    render(<App collapsible="click" defaultOpen={false} cookieName="nav" />)
    expect(spacer().dataset.state).toBe('collapsed')
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(document.cookie).toContain('nav=true')
    expect(document.cookie).not.toContain('sidebar_state')
    // biome-ignore lint/suspicious/noDocumentCookie: clearing the cookie this test wrote
    document.cookie = 'nav=; path=/; max-age=0'
  })

  it('does not write the cookie in hover mode', () => {
    render(<App />)
    fireEvent.pointerEnter(spacer())
    expect(document.cookie).not.toContain('sidebar_state')
  })

  it('toggles with Ctrl+B, except while typing', async () => {
    const user = userEvent.setup()
    render(<App collapsible="click" />)
    await user.keyboard('{Control>}b{/Control}')
    expect(spacer().dataset.state).toBe('collapsed')
    await user.click(screen.getByRole('textbox', { name: 'Editor' }))
    await user.keyboard('{Control>}b{/Control}')
    expect(spacer().dataset.state).toBe('collapsed')
  })

  it('names each group by its label', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Workspace' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows the label in a tooltip on the collapsed rail only', async () => {
    const { unmount } = render(<App collapsible="click" defaultOpen={false} />)
    act(() => screen.getByRole('link', { name: /Inbox/ }).focus())
    expect((await screen.findByRole('tooltip')).textContent).toBe('Inbox')
    unmount()
    render(<App collapsible="click" />)
    act(() => screen.getByRole('link', { name: /Inbox/ }).focus())
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('Sidebar on phones', () => {
  it('renders the children once: in the drawer only while it is open', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()
    render(<App />)
    const anchors = () => document.querySelectorAll('[data-tour=home]')
    expect(anchors()).toHaveLength(1)
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    expect(anchors()).toHaveLength(1)
    expect(drawer.contains(anchors()[0] ?? null)).toBe(true)
    expect(panel().children).toHaveLength(0)

    await user.click(within(drawer).getByRole('link', { name: /Inbox/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(anchors()).toHaveLength(1)
    expect(panel().contains(anchors()[0] ?? null)).toBe(true)
  })

  it('keeps the drawer open for a SidebarButton and its menu', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <SidebarProvider>
        <Sidebar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton>Acme Inc</SidebarButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onSelect}>Globex</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    const button = within(drawer).getByRole('button', { name: 'Acme Inc' })
    expect(button.className).toContain('data-[state=open]:bg-')
    await user.click(button)
    expect(button.dataset.state).toBe('open')
    // The open menu hides the rest from assistive tech, the drawer is still there.
    expect(document.querySelector('[data-slot=drawer-content]')).toBeTruthy()
    await user.click(screen.getByRole('menuitem', { name: 'Globex' }))
    expect(onSelect).toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy()
  })
})

describe('SidebarLink disabled', () => {
  it('stays focusable, blocks navigation and explains why', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    let prevented: boolean | undefined
    const record = (e: MouseEvent) => {
      prevented = e.defaultPrevented
    }
    document.addEventListener('click', record)
    render(
      <SidebarProvider collapsible="none">
        <Sidebar>
          <SidebarLink
            href="/reports"
            disabled
            disabledReason="Requires a paid plan"
            onClick={onClick}
          >
            Reports
          </SidebarLink>
        </Sidebar>
      </SidebarProvider>,
    )
    const link = screen.getByRole('link', { name: /Reports/ })
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.className).not.toContain('pointer-events-none')
    expect(link.getAttribute('href')).toBe('/reports')

    await user.click(link)
    expect(onClick).not.toHaveBeenCalled()
    expect(prevented).toBe(true)
    document.removeEventListener('click', record)

    await user.keyboard('{Escape}')
    act(() => link.blur())
    act(() => link.focus())
    expect((await screen.findByRole('tooltip')).textContent).toBe('Requires a paid plan')
  })
})

describe('SidebarViews', () => {
  function Views({ animate }: { animate?: boolean }) {
    const [view, setView] = useState('main')
    return (
      <SidebarProvider collapsible="none">
        <Sidebar>
          <SidebarViews value={view} onValueChange={setView}>
            <SidebarView name="main">
              <SidebarLink href="/" data-tour="home">
                Home
              </SidebarLink>
              <SidebarLink
                href="/settings"
                onClick={(e) => {
                  e.preventDefault()
                  setView('settings')
                }}
              >
                Settings
              </SidebarLink>
            </SidebarView>
            <SidebarView name="settings" back={{ to: 'main', label: 'All' }}>
              <SidebarLink href="/settings/billing">Billing</SidebarLink>
            </SidebarView>
          </SidebarViews>
        </Sidebar>
        {animate && <span>animated</span>}
      </SidebarProvider>
    )
  }

  it('switches views and goes back from the back row', async () => {
    const user = userEvent.setup()
    render(<Views />)
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Billing' })).toBeNull()

    await user.click(screen.getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('link', { name: 'Billing' })).toBeTruthy()
    // Inactive views are unmounted, so their anchors never exist twice.
    expect(document.querySelector('[data-tour=home]')).toBeNull()
    expect(document.querySelectorAll('[data-slot=sidebar-view]')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Billing' })).toBeNull()
  })

  it('works uncontrolled and calls onValueChange from the back row', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <SidebarProvider collapsible="none">
        <Sidebar>
          <SidebarViews defaultValue="settings" onValueChange={onValueChange}>
            <SidebarView name="main">
              <SidebarLink href="/">Home</SidebarLink>
            </SidebarView>
            <SidebarView name="settings" back={{ to: 'main', label: 'All' }}>
              <SidebarLink href="/billing">Billing</SidebarLink>
            </SidebarView>
          </SidebarViews>
        </Sidebar>
      </SidebarProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(onValueChange).toHaveBeenCalledWith('main')
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
  })

  it('keeps the old view inert while it slides out, then unmounts it', async () => {
    const animations: { onfinish: (() => void) | null; frames: Keyframe[] }[] = []
    HTMLElement.prototype.animate = vi.fn((frames: Keyframe[]) => {
      const a = { onfinish: null as (() => void) | null, cancel() {}, frames }
      animations.push(a)
      return a as unknown as Animation
    })
    const user = userEvent.setup()
    render(<Views />)
    await user.click(screen.getByRole('link', { name: 'Settings' }))

    const leaving = document.querySelector<HTMLElement>('[data-view=main]')
    expect(leaving?.hasAttribute('inert')).toBe(true)
    expect(leaving?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
    // Going deeper: the old view leaves to the left, the new one comes from the right.
    expect(animations.map((a) => a.frames.at(-1)?.transform ?? a.frames[0]?.transform)).toEqual(
      expect.arrayContaining(['translateX(-100%)']),
    )
    // Focus does not get lost with the view that left.
    expect(document.activeElement?.textContent).toBe('All')

    act(() => {
      for (const a of animations) a.onfinish?.()
    })
    expect(document.querySelector('[data-view=main]')).toBeNull()
    // @ts-expect-error restore jsdom, which has no animate
    delete HTMLElement.prototype.animate
  })
})
