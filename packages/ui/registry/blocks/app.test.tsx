import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CommandPalette01 } from './command-palette-01'
import { Notifications01 } from './notifications-01'
import { PageHeader01 } from './page-header-01'

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
  vi.unstubAllGlobals()
})

/** The number a rolling counter reads out, without the digits drawn for the eye. */
const spoken = (el: Element | null | undefined) =>
  el?.querySelector('[data-slot=odometer] > .sr-only')?.textContent

describe('PageHeader01', () => {
  it('renders the title, trail, facts, actions and tabs with counts', async () => {
    const user = userEvent.setup()
    render(<PageHeader01 />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('atlas')
    const section = screen.getByRole('region', { name: 'atlas' })
    expect(section.style.height).toBe('36rem')
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Acme', 'Projects'])
    expect(screen.getByText('acme.com')).toBeTruthy()
    expect(screen.getByText('MIT license')).toBeTruthy()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent?.replace(/\d+$/, ''))).toContain('Issues')
    expect(spoken(screen.getByRole('tab', { name: /Releases/ }))).toBe('28')

    const star = screen.getByRole('button', { name: /Star/ })
    expect(spoken(star)).toBe('1,284')
    await user.click(star)
    expect(star.getAttribute('aria-pressed')).toBe('true')
    expect(spoken(star)).toBe('1,285')
  })

  it('puts the brand it is given in the trail, the description and the facts', () => {
    render(<PageHeader01 brand={{ name: 'Globex', href: '/globex' }} />)
    const trail = within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getAllByRole(
      'link',
    )
    expect(trail[0]?.textContent).toBe('Globex')
    expect(trail[0]?.getAttribute('href')).toBe('/globex')
    expect(screen.getByText(/behind every Globex product/)).toBeTruthy()
    expect(screen.getByText('globex.com')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'atlas' }).textContent).not.toMatch(/acme/i)
  })

  it('lets the content change a count, which the tab rolls to', async () => {
    const user = userEvent.setup()
    render(<PageHeader01 />)
    const issues = screen.getByRole('tab', { name: /Issues/ })
    await user.click(issues)
    expect(issues.getAttribute('aria-selected')).toBe('true')
    expect(spoken(issues)).toBe('6')
    await user.click(screen.getAllByRole('button', { name: 'Close' })[0] as HTMLElement)
    expect(spoken(issues)).toBe('5')
  })

  it('folds into a compact bar once the title scrolls away', () => {
    let report: (entry: Partial<IntersectionObserverEntry>) => void = () => {}
    let options: IntersectionObserverInit | undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
          options = init
          report = (entry) => cb([entry as IntersectionObserverEntry], this as never)
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    render(<PageHeader01 />)
    const section = screen.getByRole('region', { name: 'atlas' })
    // Its own scroll box is what it watches.
    expect(options?.root).toBe(section)
    const bar = document.querySelector('[data-slot=page-header-bar]') as HTMLElement
    const compact = within(bar).getByRole('button', { name: /New issue/, hidden: true })
    expect(compact.closest('[inert]')).toBeTruthy()

    const rootBounds = { top: 100 } as DOMRectReadOnly
    act(() =>
      report({
        isIntersecting: false,
        boundingClientRect: { top: 40 } as DOMRectReadOnly,
        rootBounds,
      }),
    )
    expect(section.hasAttribute('data-folded')).toBe(true)
    expect(compact.closest('[inert]')).toBeNull()

    // Out of view below is not scrolled past.
    act(() =>
      report({
        isIntersecting: false,
        boundingClientRect: { top: 900 } as DOMRectReadOnly,
        rootBounds,
      }),
    )
    expect(section.hasAttribute('data-folded')).toBe(false)
  })

  it('takes its parts from props and leaves scrolling to the page with height null', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const tabs = [
      { id: 'a', label: 'Alpha', count: 1 },
      { id: 'b', label: 'Beta' },
    ]
    const { rerender } = render(
      <PageHeader01
        height={null}
        title="Summit"
        status={null}
        star={null}
        breadcrumbs={[]}
        meta={[]}
        actions={[{ label: 'Deploy', href: '/deploy', primary: true }]}
        tabs={tabs}
        onValueChange={onValueChange}
      >
        {({ tab }) => <p>Showing {tab}</p>}
      </PageHeader01>,
    )
    const section = screen.getByRole('region', { name: 'Summit' })
    expect(section.style.height).toBe('')
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('button', { name: /Star/ })).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Deploy' })[0]?.getAttribute('href')).toBe('/deploy')
    expect(screen.getByText('Showing a')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Beta' }))
    expect(onValueChange).toHaveBeenCalledWith('b')
    expect(screen.getByText('Showing b')).toBeTruthy()

    rerender(
      <PageHeader01 height={null} title="Summit" tabs={[{ id: 'a', label: 'Alpha', count: 9 }]}>
        content
      </PageHeader01>,
    )
    expect(spoken(screen.getByRole('tab', { name: /Alpha/ }))).toBe('9')
  })
})

const now = new Date('2026-10-04T12:00:00')
const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600_000).toISOString()

const feed = [
  {
    id: 'a',
    kind: 'mention' as const,
    actor: 'Maya Okafor',
    title: 'mentioned you',
    time: at(1),
    details: 'Can you look?',
    action: { label: 'Reply', href: '/reply' },
  },
  {
    id: 'b',
    kind: 'deploy' as const,
    title: 'Deployed',
    time: at(2),
    read: true,
    details: 'All green.',
  },
  { id: 'c', kind: 'security' as const, title: 'New sign in', time: at(26) },
  { id: 'd', kind: 'invite' as const, actor: 'Priya N', title: 'invited you', time: at(24 * 5) },
]

const unreadBadge = () => spoken(screen.getByRole('heading', { level: 2 }).parentElement)

describe('Notifications01', () => {
  it('groups by day, counts unread and marks everything read', async () => {
    const user = userEvent.setup()
    const onReadChange = vi.fn()
    render(
      <Notifications01 notifications={feed} now={now} locale="en" onReadChange={onReadChange} />,
    )
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Today',
      'Yesterday',
      'Earlier',
    ])
    expect(unreadBadge()).toBe('3')
    expect(screen.getByText('1 hour ago')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Mark all as read/ }))
    expect(onReadChange).toHaveBeenCalledWith(['a', 'c', 'd'], true)
    expect(unreadBadge()).toBe('0')
    expect(screen.getByRole('button', { name: /Mark all as read/ }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('opens a notification in place, marking it read, and toggles read by hand', async () => {
    const user = userEvent.setup()
    render(<Notifications01 notifications={feed} now={now} />)
    const trigger = screen.getByRole('button', { name: /Maya Okafor mentioned you/ })
    const item = trigger.closest('[data-slot=collapsible]') as HTMLElement
    expect(item.dataset.state).toBe('closed')
    await user.click(trigger)
    expect(item.dataset.state).toBe('open')
    expect(item.hasAttribute('data-read')).toBe(true)
    expect(within(item).getByRole('link', { name: 'Reply' }).getAttribute('href')).toBe('/reply')
    expect(unreadBadge()).toBe('2')

    await user.click(within(item).getByRole('button', { name: 'Mark as unread' }))
    expect(item.hasAttribute('data-read')).toBe(false)
    expect(unreadBadge()).toBe('3')
    // Nothing to open, so it is not a button that pretends to.
    const plain = screen.getByText('New sign in').closest('button') as HTMLButtonElement
    expect(plain.disabled).toBe(true)
  })

  it('filters to unread and mentions, with an empty state', async () => {
    const user = userEvent.setup()
    render(<Notifications01 notifications={feed} now={now} />)
    const filters = screen.getByRole('group', { name: 'Show' })
    await user.click(within(filters).getByRole('button', { name: /Mentions/ }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    await user.click(within(filters).getByRole('button', { name: /Unread/ }))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: /Mark all as read/ }))
    expect(screen.getByText('You are all caught up.')).toBeTruthy()
  })

  it('renders its own feed by default', () => {
    render(<Notifications01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(screen.getByText(/mentioned you in Q4 planning/)).toBeTruthy()
  })
})

const options = () =>
  within(screen.getByRole('dialog'))
    .getAllByRole('option')
    .filter((o) => !o.hidden && !o.closest('[hidden]'))
    .map((o) => o.textContent)

describe('CommandPalette01', () => {
  it('opens with the shortcut, shows recent items and runs the chosen one', async () => {
    const user = userEvent.setup()
    const onRun = vi.fn()
    render(<CommandPalette01 onRun={onRun} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const dialog = await screen.findByRole('dialog')
    const recent = within(dialog).getByRole('group', { name: 'Recent' })
    expect(
      within(recent)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([expect.stringContaining('Create issue'), expect.stringContaining('Projects')])
    // Shortcuts are drawn as key caps.
    const invite = within(dialog)
      .getAllByRole('option')
      .find((o) => o.textContent?.includes('Create project'))
    expect([...(invite?.querySelectorAll('kbd') ?? [])].map((k) => k.textContent)).toEqual([
      '⌘',
      '⇧',
      'P',
    ])

    await user.keyboard('invite')
    expect(within(dialog).queryByRole('group', { name: 'Recent' })).toBeNull()
    expect(options()[0]).toContain('Invite teammate')
    await user.keyboard('{Enter}')
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: 'invite' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Ran “Invite teammate”')).toBeTruthy()

    // The last one run goes to the top of Recent.
    await user.click(screen.getByRole('button', { name: /Search or run a command/ }))
    const again = within(screen.getByRole('dialog')).getByRole('group', { name: 'Recent' })
    expect(within(again).getAllByRole('option')[0]?.textContent).toContain('Invite teammate')
  })

  it('opens nested lists and steps back with Backspace and Escape', async () => {
    const user = userEvent.setup()
    const onRun = vi.fn()
    render(<CommandPalette01 onRun={onRun} defaultOpen />)
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('option', { name: /Change theme/ }))
    expect(within(dialog).getByText('Theme', { selector: 'span' })).toBeTruthy()
    expect(options()).toEqual([
      expect.stringContaining('Light'),
      expect.stringContaining('Dark'),
      expect.stringContaining('Match system'),
    ])
    const input = within(dialog).getByRole('combobox')
    expect(input.getAttribute('placeholder')).toBe('Choose a theme…')

    await user.click(input)
    await user.keyboard('{Backspace}')
    expect(options()).toContain('Create issueC')

    await user.click(within(dialog).getByRole('option', { name: /Change language/ }))
    expect(options()[0]).toContain('English')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(options()).toContain('Create issueC')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onRun).not.toHaveBeenCalled()
  })

  it('takes its own groups and can do without the shortcut', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <CommandPalette01
        hotkey={null}
        maxRecent={0}
        groups={[{ heading: 'Stuff', items: [{ id: 'x', label: 'Do the thing', onSelect }] }]}
      />,
    )
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Search or run a command/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('group', { name: 'Recent' })).toBeNull()
    await user.click(within(dialog).getByRole('option', { name: 'Do the thing' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
