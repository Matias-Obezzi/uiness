import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable-panels'

function Example(props: Partial<React.ComponentProps<typeof ResizablePanelGroup>>) {
  return (
    <ResizablePanelGroup {...props}>
      <ResizablePanel defaultSize={30} minSize={20} maxSize={60} collapsible>
        Sidebar
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>Editor</ResizablePanel>
    </ResizablePanelGroup>
  )
}

const panel = (text: string) => screen.getByText(text) as HTMLElement
const grow = (text: string) => Number.parseFloat(panel(text).style.flexGrow)

describe('ResizablePanelGroup', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('lays out the default sizes and shares the rest', () => {
    render(<Example />)
    expect(grow('Sidebar')).toBe(30)
    expect(grow('Editor')).toBe(70)
  })

  it('is a focusable window splitter that names its value', () => {
    render(<Example />)
    const handle = screen.getByRole('separator')
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-valuenow')).toBe('30')
    expect(handle.getAttribute('aria-controls')).toBe(panel('Sidebar').id)
    expect(handle.tabIndex).toBe(0)
  })

  it('resizes from the keyboard within the limits and folds with Enter', async () => {
    const user = userEvent.setup()
    const onLayout = vi.fn()
    render(<Example onLayout={onLayout} />)
    screen.getByRole('separator').focus()
    await user.keyboard('{ArrowRight}')
    expect(grow('Sidebar')).toBe(35)
    expect(onLayout).toHaveBeenLastCalledWith([35, 65])
    await user.keyboard('{End}')
    expect(grow('Sidebar')).toBe(60)
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(grow('Sidebar')).toBe(50)
    await user.keyboard('{Home}')
    // Collapsible, so Home folds it rather than stopping at the minimum.
    expect(grow('Sidebar')).toBe(0)
    expect(panel('Sidebar').dataset.collapsed).toBe('true')
    await user.keyboard('{Enter}')
    expect(grow('Sidebar')).toBe(50)
    await user.keyboard('{Enter}')
    expect(grow('Sidebar')).toBe(0)
  })

  it('goes back to the defaults on a double click', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const handle = screen.getByRole('separator')
    handle.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(grow('Sidebar')).toBe(40)
    await user.dblClick(handle)
    expect(grow('Sidebar')).toBe(30)
  })

  it('follows the pointer', () => {
    render(<Example />)
    for (const text of ['Sidebar', 'Editor']) {
      Object.defineProperty(panel(text), 'offsetWidth', { configurable: true, value: 500 })
    }
    const handle = screen.getByRole('separator')
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 })
    expect(grow('Sidebar')).toBe(40)
    fireEvent.pointerUp(handle, { pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 600, pointerId: 1 })
    expect(grow('Sidebar')).toBe(40)
  })

  it('remembers the layout with autoSaveId', async () => {
    vi.useFakeTimers()
    try {
      const { unmount } = render(<Example autoSaveId="editor" />)
      act(() => {
        screen.getByRole('separator').focus()
      })
      fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' })
      act(() => vi.advanceTimersByTime(200))
      expect(JSON.parse(window.localStorage.getItem('uiness-resizable:editor') ?? '[]')).toEqual([
        35, 65,
      ])
      unmount()
      render(<Example autoSaveId="editor" />)
      expect(grow('Sidebar')).toBe(35)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores a stored layout that does not match', () => {
    window.localStorage.setItem('uiness-resizable:editor', '{"broken":')
    render(<Example autoSaveId="editor" />)
    expect(grow('Sidebar')).toBe(30)
  })
})
