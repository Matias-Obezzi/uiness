import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { BentoCard, BentoGrid } from './bento-grid'
import { Calendar, type DateRange, dateKey } from './calendar'
import { DatePicker } from './date-picker'
import { LinkPreview } from './link-preview'
import { ParallaxGrid } from './parallax-grid'
import { alignPoints, morphPoints, PathMorph, type Point, toPath } from './path-morph'
import { Sidebar, SidebarContent, SidebarLink, SidebarProvider, SidebarTrigger } from './sidebar'
import { StickyScroll } from './sticky-scroll'
import { Timeline, TimelineItem } from './timeline'

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

const march = new Date(2026, 2, 1) // March 2026, a Sunday
const day = (n: number) => new Date(2026, 2, n)

describe('Calendar', () => {
  it('renders the month with a live caption and picks a day', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Calendar defaultMonth={march} onSelect={onSelect} locale="en-US" today={day(10)} />)
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeTruthy()
    const ten = screen.getByRole('button', { name: 'Tuesday, March 10, 2026' })
    expect(ten.hasAttribute('data-today')).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Thursday, March 12, 2026' }))
    expect(onSelect).toHaveBeenCalledWith(day(12))
    expect(screen.getByRole('button', { name: /March 12/ }).hasAttribute('data-selected')).toBe(
      true,
    )
  })

  it('starts the week on the locale day and can be told otherwise', () => {
    const { rerender } = render(<Calendar defaultMonth={march} locale="en-US" />)
    const heads = () => screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(heads()[0]).toBe('Sun')
    rerender(<Calendar defaultMonth={march} locale="en-US" weekStartsOn={1} />)
    expect(heads()[0]).toBe('Mon')
  })

  it('moves with the keyboard, across months too', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(
      <Calendar
        defaultMonth={march}
        today={day(30)}
        locale="en-US"
        onMonthChange={onMonthChange}
      />,
    )
    const thirty = screen.getByRole('button', { name: /March 30/ })
    thirty.focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement?.getAttribute('data-day')).toBe(dateKey(day(31)))
    await user.keyboard('{ArrowDown}')
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 3, 1))
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-04-07')
    await user.keyboard('{PageUp}')
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-03-07')
    await user.keyboard('{Home}')
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-03-01')
  })

  it('respects min, max and disabled days', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Calendar
        defaultMonth={march}
        min={day(5)}
        max={day(25)}
        disabled={(d) => d.getDay() === 0}
        onSelect={onSelect}
        locale="en-US"
      />,
    )
    const fourth = screen.getByRole('button', { name: /March 4,/ })
    const sunday = screen.getByRole('button', { name: /Sunday, March 8/ })
    expect(fourth.hasAttribute('disabled')).toBe(true)
    expect(sunday.hasAttribute('disabled')).toBe(true)
    await user.click(screen.getByRole('button', { name: /March 26/ }))
    expect(onSelect).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /March 9,/ }))
    expect(onSelect).toHaveBeenCalledWith(day(9))
  })

  it('picks a range in two clicks and orders it', async () => {
    const user = userEvent.setup()
    function Host() {
      const [range, setRange] = useState<DateRange>({})
      return (
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          defaultMonth={march}
          locale="en-US"
        />
      )
    }
    render(<Host />)
    await user.click(screen.getByRole('button', { name: /March 20/ }))
    await user.click(screen.getByRole('button', { name: /March 15/ }))
    const cell = (n: number) =>
      screen.getByRole('button', { name: new RegExp(`March ${n},`) }).closest('td')
    expect(cell(15)?.dataset.range).toBe('start')
    expect(cell(17)?.dataset.range).toBe('middle')
    expect(cell(20)?.dataset.range).toBe('end')
    await user.click(screen.getByRole('button', { name: /March 3,/ }))
    expect(cell(3)?.dataset.range).toBe('start')
    expect(cell(17)?.dataset.range).toBeUndefined()
  })

  it('toggles days in multiple mode', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Calendar mode="multiple" defaultMonth={march} onSelect={onSelect} locale="en-US" />)
    await user.click(screen.getByRole('button', { name: /March 2,/ }))
    await user.click(screen.getByRole('button', { name: /March 4,/ }))
    expect(onSelect).toHaveBeenLastCalledWith([day(2), day(4)])
    await user.click(screen.getByRole('button', { name: /March 2,/ }))
    expect(onSelect).toHaveBeenLastCalledWith([day(4)])
  })

  it('shows two months and moves both', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultMonth={march} numberOfMonths={2} locale="en-US" />)
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeTruthy()
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeTruthy()
  })
})

describe('DatePicker', () => {
  it('opens a calendar, picks a day, closes and shows it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <DatePicker
        onValueChange={onValueChange}
        locale="en-US"
        calendarProps={{ defaultMonth: march }}
        name="due"
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Pick a date' })
    expect(trigger.hasAttribute('data-placeholder')).toBe(true)
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /March 18/ }))
    expect(onValueChange).toHaveBeenCalledWith(day(18))
    expect(screen.queryByRole('grid')).toBeNull()
    expect(trigger.textContent).toContain('Mar 18, 2026')
    expect(document.querySelector<HTMLInputElement>('input[name=due]')?.value).toBe('2026-03-18')
  })

  it('keeps a range open until both ends are picked', async () => {
    const user = userEvent.setup()
    render(<DatePicker mode="range" locale="en-US" calendarProps={{ defaultMonth: march }} />)
    await user.click(screen.getByRole('button', { name: 'Pick a range' }))
    await user.click(screen.getByRole('button', { name: /March 3,/ }))
    expect(screen.getAllByRole('grid').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /March 9,/ }))
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.getByRole('button', { name: 'Pick a range' }).textContent).toContain('Mar 3')
  })
})

describe('Sidebar', () => {
  function App() {
    return (
      <SidebarProvider collapsible="hover">
        <Sidebar>
          <SidebarContent>
            <SidebarLink href="/" active>
              Home
            </SidebarLink>
            <SidebarLink href="/inbox" badge={3}>
              Inbox
            </SidebarLink>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    )
  }

  it('starts collapsed in hover mode and expands under the pointer', () => {
    render(<App />)
    const aside = document.querySelector<HTMLElement>('[data-slot=sidebar]')
    if (!aside) throw new Error('no sidebar')
    expect(aside.dataset.state).toBe('collapsed')
    expect(aside.style.width).toBe('60px')
    fireEvent.pointerEnter(aside)
    expect(aside.dataset.state).toBe('expanded')
    expect(aside.style.width).toBe('240px')
    fireEvent.pointerLeave(aside)
    expect(aside.dataset.state).toBe('collapsed')
    expect(within(aside).getByRole('link', { name: /Home/ }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(within(aside).getByText('3')).toBeTruthy()
  })

  it('toggles from the trigger in click mode', async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider collapsible="click">
        <Sidebar>
          <SidebarLink href="/">Home</SidebarLink>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    )
    const aside = document.querySelector<HTMLElement>('[data-slot=sidebar]')
    expect(aside?.dataset.state).toBe('expanded')
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(aside?.dataset.state).toBe('collapsed')
  })

  it('opens a drawer with the same links on phones', async () => {
    const user = userEvent.setup()
    const mm = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.startsWith('(max-width'),
          media: query,
          onchange: null,
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    )
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    expect(within(drawer).getAllByRole('link')).toHaveLength(2)
    await user.click(within(drawer).getByRole('link', { name: /Inbox/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    mm.mockRestore()
  })
})

describe('BentoGrid', () => {
  it('sizes cards and can make one a link', () => {
    render(
      <BentoGrid>
        <BentoCard
          span={2}
          rows={2}
          title="Big"
          description="Two by two"
          header={<img alt="" src="/a.png" />}
        />
        <BentoCard title="Link" href="/go" />
      </BentoGrid>,
    )
    const big = screen.getByText('Big').closest('[data-slot=bento-card]')
    expect(big?.className).toContain('md:col-span-2')
    expect(big?.className).toContain('md:row-span-2')
    expect(big?.querySelector('[data-slot=bento-header]')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Link' }).getAttribute('href')).toBe('/go')
  })
})

describe('path morph math', () => {
  const square: Point[] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]

  it('aligns the second shape to the first by rotating and reversing', () => {
    const rotated: Point[] = [
      [10, 10],
      [0, 10],
      [0, 0],
      [10, 0],
    ]
    expect(alignPoints(square, rotated)).toEqual(square)
    const reversed = [...square].reverse()
    expect(alignPoints(square, reversed)).toEqual(square)
  })

  it('interpolates points and writes a path', () => {
    const target: Point[] = [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ]
    expect(morphPoints(square, target, 0.5)).toEqual([
      [0, 0],
      [15, 0],
      [15, 15],
      [0, 15],
    ])
    expect(toPath(square, { smooth: false })).toBe('M0.00 0.00L10.00 0.00L10.00 10.00L0.00 10.00Z')
    const curved = toPath(square)
    expect(curved.startsWith('M0.00 0.00C')).toBe(true)
    expect(curved.endsWith('Z')).toBe(true)
    expect(curved.split('C')).toHaveLength(5)
  })

  it('renders the current path and jumps without SVG geometry', () => {
    const paths = ['M0 0L10 0L10 10Z', 'M0 0L20 0L20 20Z']
    const { rerender } = render(<PathMorph paths={paths} index={0} interval={0} />)
    const path = document.querySelector('path')
    expect(path?.getAttribute('d')).toBe(paths[0])
    rerender(<PathMorph paths={paths} index={1} interval={0} />)
    expect(path?.getAttribute('d')).toBe(paths[1])
  })
})

describe('scroll pieces', () => {
  it('deals children into columns', () => {
    render(
      <ParallaxGrid columns={3}>
        {['a', 'b', 'c', 'd', 'e'].map((k) => (
          <span key={k}>{k}</span>
        ))}
      </ParallaxGrid>,
    )
    const columns = document.querySelectorAll('[data-slot=parallax-column]')
    expect(columns).toHaveLength(3)
    expect(columns[0]?.textContent).toBe('ad')
    expect(columns[1]?.textContent).toBe('be')
    expect(columns[2]?.textContent).toBe('c')
  })

  it('renders sections and a panel per item', () => {
    render(
      <StickyScroll
        items={[
          { title: 'One', content: <p>Panel one</p> },
          { title: 'Two', content: <p>Panel two</p> },
        ]}
      />,
    )
    expect(document.querySelectorAll('[data-slot=sticky-scroll-section]')).toHaveLength(2)
    const panels = document.querySelectorAll('[data-slot=sticky-scroll-content]')
    expect(panels).toHaveLength(2)
    expect(panels[0]?.getAttribute('data-state')).toBe('active')
    expect(panels[1]?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders timeline entries with their dots', () => {
    render(
      <Timeline>
        <TimelineItem date="2026" title="Launch">
          <p>Body</p>
        </TimelineItem>
      </Timeline>,
    )
    expect(screen.getByRole('heading', { name: 'Launch' })).toBeTruthy()
    expect(document.querySelector('[data-slot=timeline-dot]')).toBeTruthy()
    expect(
      document.querySelector<HTMLElement>('[data-slot=timeline-progress]')?.style.height,
    ).toMatch(/%$/)
  })
})

describe('LinkPreview', () => {
  it('shows the preview on hover with the given image', async () => {
    const user = userEvent.setup()
    render(
      <LinkPreview href="https://example.com" image="/shot.png" openDelay={0} closeDelay={0}>
        Example
      </LinkPreview>,
    )
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    await user.hover(link)
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-slot=link-preview-content] img')?.getAttribute('src'),
      ).toBe('/shot.png'),
    )
  })
})
