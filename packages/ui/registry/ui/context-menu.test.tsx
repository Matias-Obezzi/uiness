import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type ContextMenuAction,
  ContextMenuArea,
  ContextMenuProvider,
  type ContextMenuTarget,
  defineContextMenus,
  useContextMenu,
  useContextMenuControls,
} from './context-menu'

afterEach(() => {
  vi.useRealTimers()
})

interface File {
  id: string
  name: string
}

const open = vi.fn()
const remove = vi.fn()

const menus = defineContextMenus({
  file: ({ data }: ContextMenuTarget<File>) => [
    { id: 'open', label: `Open ${data.name}`, onSelect: () => open(data.id) },
    'separator',
    { id: 'delete', label: 'Delete', variant: 'destructive', onSelect: () => remove(data.id) },
  ],
  page: () => [{ label: 'Reload', onSelect: () => {} }],
})

const setup = (ui: React.ReactNode, fallback?: string) =>
  render(
    <ContextMenuProvider menus={menus} fallback={fallback}>
      {ui}
    </ContextMenuProvider>,
  )

const items = () => screen.queryAllByRole('menuitem').map((item) => item.textContent)

describe('ContextMenu', () => {
  it('opens the named menu with the data of the element that was right clicked', async () => {
    setup(
      <>
        <ContextMenuArea context="file" data={{ id: 'a', name: 'notes.md' }}>
          notes
        </ContextMenuArea>
        <ContextMenuArea context="file" data={{ id: 'b', name: 'todo.md' }}>
          todo
        </ContextMenuArea>
      </>,
    )
    const shown = fireEvent.contextMenu(screen.getByText('todo'), { clientX: 40, clientY: 60 })
    expect(shown).toBe(false)
    expect(items()).toEqual(['Open todo.md', 'Delete'])
    expect(screen.getByRole('menu').getAttribute('data-slot')).toBe('context-menu')
    const anchor = document.querySelector<HTMLElement>('[data-slot=context-menu-anchor]')
    expect(anchor?.style.left).toBe('40px')
    expect(anchor?.style.top).toBe('60px')

    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(remove).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('moves to the next element right clicked while one is open, and stays open', async () => {
    setup(
      <>
        <ContextMenuArea context="file" data={{ id: 'a', name: 'a.md' }} asChild>
          <button type="button">a</button>
        </ContextMenuArea>
        <ContextMenuArea context="file" data={{ id: 'b', name: 'b.md' }} asChild>
          <button type="button">b</button>
        </ContextMenuArea>
      </>,
    )
    await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByText('a') })
    expect(items()).toEqual(['Open a.md', 'Delete'])
    await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByText('b') })
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(items()).toEqual(['Open b.md', 'Delete'])
    expect(screen.getByRole('menu').contains(document.activeElement)).toBe(true)
  })

  it('lets an element extend the named menu', () => {
    setup(
      <ContextMenuArea
        context="file"
        data={{ id: 'a', name: 'a.md' }}
        extend={(actions) => [
          ...actions.filter((a) => !(a && a !== 'separator' && a.id === 'delete')),
          { label: 'Pin', onSelect: () => {} },
        ]}
      >
        a
      </ContextMenuArea>,
    )
    fireEvent.contextMenu(screen.getByText('a'))
    expect(items()).toEqual(['Open a.md', 'Pin'])
  })

  it('takes actions declared by hand, and drops empty entries and stray separators', () => {
    const canShare = false
    setup(
      <ContextMenuArea
        actions={[
          'separator',
          { type: 'label', label: 'Card' },
          { label: 'Copy', shortcut: '⌘C', onSelect: () => {} },
          'separator',
          canShare && { label: 'Share', onSelect: () => {} },
          'separator',
        ]}
      >
        card
      </ContextMenuArea>,
    )
    fireEvent.contextMenu(screen.getByText('card'))
    expect(items()).toEqual(['Copy⌘C'])
    expect(document.querySelectorAll('[data-slot=dropdown-menu-separator]')).toHaveLength(0)
    expect(screen.getByText('Card')).toBeTruthy()
  })

  it('opens the innermost menu when areas are nested', () => {
    setup(
      <ContextMenuArea actions={[{ label: 'Outer', onSelect: () => {} }]}>
        <ContextMenuArea actions={[{ label: 'Inner', onSelect: () => {} }]}>inside</ContextMenuArea>
      </ContextMenuArea>,
    )
    fireEvent.contextMenu(screen.getByText('inside'))
    expect(items()).toEqual(['Inner'])
  })

  it('leaves the browser menu alone when there is nothing to show', () => {
    setup(
      <>
        <ContextMenuArea actions={[false, 'separator']}>empty</ContextMenuArea>
        <ContextMenuArea context="file" data={{ id: 'a', name: 'a' }} disabled>
          off
        </ContextMenuArea>
        <p>plain</p>
      </>,
    )
    expect(fireEvent.contextMenu(screen.getByText('empty'))).toBe(true)
    expect(fireEvent.contextMenu(screen.getByText('off'))).toBe(true)
    expect(fireEvent.contextMenu(screen.getByText('plain'))).toBe(true)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('shows the fallback menu where no element claimed the click', () => {
    setup(
      <>
        <ContextMenuArea actions={[{ label: 'Mine', onSelect: () => {} }]}>mine</ContextMenuArea>
        <p>plain</p>
      </>,
      'page',
    )
    expect(fireEvent.contextMenu(screen.getByText('plain'))).toBe(false)
    expect(items()).toEqual(['Reload'])
  })

  it('opens under the element when invoked from the keyboard', () => {
    setup(<ContextMenuArea actions={[{ label: 'Go', onSelect: () => {} }]}>key</ContextMenuArea>)
    const el = screen.getByText('key')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 12,
      bottom: 34,
    } as DOMRect)
    fireEvent.contextMenu(el, { clientX: 0, clientY: 0 })
    const anchor = document.querySelector<HTMLElement>('[data-slot=context-menu-anchor]')
    expect(anchor?.style.left).toBe('12px')
    expect(anchor?.style.top).toBe('34px')
  })

  it('opens on a long press on touch screens, unless the finger moves', () => {
    vi.useFakeTimers()
    setup(<ContextMenuArea actions={[{ label: 'Held', onSelect: () => {} }]}>hold</ContextMenuArea>)
    const el = screen.getByText('hold')
    fireEvent.pointerDown(el, { pointerType: 'touch', clientX: 10, clientY: 10 })
    fireEvent.pointerMove(el, { pointerType: 'touch', clientX: 40, clientY: 10 })
    act(() => vi.advanceTimersByTime(800))
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.pointerDown(el, { pointerType: 'touch', clientX: 10, clientY: 10 })
    act(() => vi.advanceTimersByTime(800))
    expect(items()).toEqual(['Held'])
  })

  it('works as a hook, and opens from code with the controls', () => {
    function Row() {
      const menu = useContextMenu({ context: 'file', data: { id: 'r', name: 'row.md' } })
      const controls = useContextMenuControls()
      return (
        <div {...menu}>
          row
          <button
            type="button"
            onClick={(e) =>
              controls.open(e.currentTarget, {
                actions: [{ label: 'From code', onSelect: () => {} }] as ContextMenuAction[],
              })
            }
          >
            more
          </button>
        </div>
      )
    }
    setup(<Row />)
    fireEvent.contextMenu(screen.getByText('row'))
    expect(items()).toEqual(['Open row.md', 'Delete'])
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    fireEvent.click(screen.getByText('more'))
    expect(items()).toEqual(['From code'])
  })

  it('runs handlers the element already had', () => {
    const own = vi.fn()
    setup(
      <ContextMenuArea onContextMenu={own} actions={[{ label: 'X', onSelect: () => {} }]}>
        own
      </ContextMenuArea>,
    )
    fireEvent.contextMenu(screen.getByText('own'))
    expect(own).toHaveBeenCalled()
    expect(items()).toEqual(['X'])
  })

  it('asks for the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ContextMenuArea actions={[]}>x</ContextMenuArea>)).toThrow(
      /ContextMenuProvider/,
    )
    error.mockRestore()
  })
})
