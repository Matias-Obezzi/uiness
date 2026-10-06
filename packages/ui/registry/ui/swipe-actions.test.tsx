import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchiveIcon, MailOpenIcon, TrashIcon } from 'lucide-react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { type SwipeAction, SwipeActions, SwipeActionsRow } from './swipe-actions'

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

function setup() {
  const archive = vi.fn()
  const remove = vi.fn()
  const read = vi.fn()
  const leading: SwipeAction[] = [
    {
      label: 'Mark as read',
      icon: <MailOpenIcon />,
      tone: 'primary',
      onSelect: read,
      keepRow: true,
    },
  ]
  const trailing: SwipeAction[] = [
    { label: 'Delete', icon: <TrashIcon />, tone: 'destructive', onSelect: remove },
    { label: 'Archive', icon: <ArchiveIcon />, onSelect: archive },
  ]
  render(
    <SwipeActions aria-label="Inbox">
      <SwipeActionsRow label="Lunch on Friday" leading={leading} trailing={trailing}>
        <p>Lunch on Friday</p>
      </SwipeActionsRow>
      <SwipeActionsRow label="Invoice" trailing={trailing}>
        <p>Invoice</p>
      </SwipeActionsRow>
    </SwipeActions>,
  )
  const row = screen.getByText('Lunch on Friday').closest('li') as HTMLLIElement
  Object.defineProperty(row, 'offsetWidth', { configurable: true, value: 400 })
  Object.defineProperty(row, 'offsetHeight', { configurable: true, value: 64 })
  const content = row.querySelector('[data-slot=swipe-actions-content]') as HTMLElement
  return { archive, remove, read, row, content }
}

const swipe = async (el: HTMLElement, from: number, to: number, pause = 0) => {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: from, clientY: 10, pointerType: 'touch' })
  const steps = 6
  for (let i = 1; i <= steps; i++) {
    fireEvent.pointerMove(el, {
      pointerId: 1,
      clientX: from + ((to - from) * i) / steps,
      clientY: 10,
      pointerType: 'touch',
    })
  }
  // A finger that rests before lifting has no speed left to carry the row.
  if (pause) await new Promise((resolve) => setTimeout(resolve, pause))
  fireEvent.pointerUp(el, { pointerId: 1, clientX: to, clientY: 10, pointerType: 'touch' })
}

describe('SwipeActions', () => {
  // The swipe is a shortcut: every action is also in a menu that the keyboard and screen
  // readers reach.
  it('offers every action from a named menu button', async () => {
    const user = userEvent.setup()
    const { archive } = setup()
    const list = screen.getByRole('list', { name: 'Inbox' })
    await user.click(within(list).getByRole('button', { name: 'More actions for Lunch on Friday' }))
    const menu = await screen.findByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((m) => m.textContent),
    ).toEqual(['Mark as read', 'Delete', 'Archive'])
    await user.click(within(menu).getByRole('menuitem', { name: 'Archive' }))
    await waitFor(() => expect(archive).toHaveBeenCalledTimes(1))
  })

  it('snaps open past half the actions and keeps them out of reach while closed', async () => {
    const { row, content } = setup()
    const trailing = row.querySelector('[data-slot=swipe-actions-trailing]') as HTMLElement
    expect(trailing.hasAttribute('inert')).toBe(true)

    await swipe(content, 300, 200, 150)
    expect(content.style.transform).toBe('translate3d(-152px, 0, 0)')
    expect(row.dataset.open).toBe('true')
    expect(trailing.hasAttribute('inert')).toBe(false)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(content.style.transform).toBe('')
  })

  it('springs back from a short swipe, and opens from a short flick', async () => {
    const { content } = setup()
    await swipe(content, 300, 280, 150)
    expect(content.style.transform).toBe('')
    await swipe(content, 300, 260)
    expect(content.style.transform).toBe('translate3d(-152px, 0, 0)')
  })

  it('arms the first action once a swipe passes the full swipe point', () => {
    const { content, row } = setup()
    const deleteButton = () =>
      within(row).getByRole('button', { name: 'Delete', hidden: true }) as HTMLElement
    fireEvent.pointerDown(content, {
      pointerId: 1,
      clientX: 390,
      clientY: 10,
      pointerType: 'touch',
    })
    // The first move only picks the axis.
    fireEvent.pointerMove(content, {
      pointerId: 1,
      clientX: 380,
      clientY: 10,
      pointerType: 'touch',
    })
    fireEvent.pointerMove(content, {
      pointerId: 1,
      clientX: 200,
      clientY: 10,
      pointerType: 'touch',
    })
    expect(deleteButton().dataset.armed).toBeUndefined()
    // Past 60% of the 400px row.
    fireEvent.pointerMove(content, {
      pointerId: 1,
      clientX: 100,
      clientY: 10,
      pointerType: 'touch',
    })
    expect(deleteButton().dataset.armed).toBe('true')
  })

  it('runs the first action on a full swipe', async () => {
    const { content, remove } = setup()
    await swipe(content, 390, 50)
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
  })

  it('leaves vertical moves to the page', () => {
    const { content } = setup()
    fireEvent.pointerDown(content, { pointerId: 1, clientX: 100, clientY: 10 })
    fireEvent.pointerMove(content, { pointerId: 1, clientX: 104, clientY: 60 })
    fireEvent.pointerMove(content, { pointerId: 1, clientX: 180, clientY: 70 })
    fireEvent.pointerUp(content, { pointerId: 1 })
    expect(content.style.transform).toBe('')
  })
})
