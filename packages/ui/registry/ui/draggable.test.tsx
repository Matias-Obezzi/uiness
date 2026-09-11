import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Draggable, DraggableHandle, type Point } from './draggable'

const panel = () => document.querySelector('[data-slot=draggable]') as HTMLElement

describe('Draggable', () => {
  it('renders its children and starts where it was put', () => {
    render(
      <Draggable aria-label="Panel">
        <p>Panel body</p>
      </Draggable>,
    )
    expect(screen.getByText('Panel body')).toBeTruthy()
    expect(panel().style.transform).toBe('translate3d(0px, 0px, 0)')
  })

  it('starts from the offset it was given', () => {
    render(<Draggable aria-label="Panel" defaultPosition={{ x: 40, y: 10 }} />)
    expect(panel().style.transform).toBe('translate3d(40px, 10px, 0)')
  })

  it('describes itself as draggable and takes the focus', () => {
    render(<Draggable aria-label="Panel" />)
    const element = screen.getByRole('button', { name: 'Panel' })
    expect(element.getAttribute('aria-roledescription')).toBe('draggable')
    expect(element.getAttribute('tabindex')).toBe('0')
    expect(element.getAttribute('aria-pressed')).toBe('false')
  })

  it('moves a step per arrow key and reports the drop once', async () => {
    const user = userEvent.setup()
    const onDragEnd = vi.fn()
    const onPositionChange = vi.fn()
    render(
      <Draggable
        aria-label="Panel"
        keyboardStep={20}
        onDragEnd={onDragEnd}
        onPositionChange={onPositionChange}
      />,
    )

    const element = screen.getByRole('button', { name: 'Panel' })
    element.focus()
    await user.keyboard(' ')
    expect(element.getAttribute('aria-pressed')).toBe('true')

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}')
    expect(panel().style.transform).toBe('translate3d(40px, 20px, 0)')

    await user.keyboard(' ')
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd).toHaveBeenCalledWith({ x: 40, y: 20 })
    expect(onPositionChange).toHaveBeenCalledTimes(3)
    expect(element.getAttribute('aria-pressed')).toBe('false')
  })

  it('takes a custom keyboard step', async () => {
    const user = userEvent.setup()
    render(<Draggable aria-label="Panel" keyboardStep={5} />)

    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{Enter}')

    expect(panel().style.transform).toBe('translate3d(-5px, 0px, 0)')
  })

  it('only moves along the axis it was locked to', async () => {
    const user = userEvent.setup()
    render(<Draggable aria-label="Panel" axis="x" keyboardStep={20} />)

    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}{ArrowDown}')
    await user.keyboard(' ')

    expect(panel().style.transform).toBe('translate3d(20px, 0px, 0)')
  })

  it('stays inside the box it was given', async () => {
    const user = userEvent.setup()
    render(
      <Draggable
        aria-label="Panel"
        keyboardStep={20}
        bounds={{ x: 0, y: 0, width: 50, height: 50 }}
      />,
    )

    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    await user.keyboard(' ')

    // Five steps of 20 is 100, and the box stops it at 50.
    expect(panel().style.transform).toBe('translate3d(50px, 0px, 0)')
  })

  it('goes back where it was picked up when escape cancels the drag', async () => {
    const user = userEvent.setup()
    const onDragEnd = vi.fn()
    render(
      <Draggable
        aria-label="Panel"
        keyboardStep={20}
        defaultPosition={{ x: 10, y: 10 }}
        onDragEnd={onDragEnd}
      />,
    )

    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(panel().style.transform).toBe('translate3d(30px, 30px, 0)')

    await user.keyboard('{Escape}')

    expect(onDragEnd).not.toHaveBeenCalled()
    expect(panel().style.transform).toBe('translate3d(10px, 10px, 0)')
  })

  it('lets the position be controlled from outside', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
      return (
        <>
          <Draggable
            aria-label="Panel"
            keyboardStep={20}
            position={position}
            onPositionChange={setPosition}
          />
          <p data-testid="position">
            {position.x},{position.y}
          </p>
        </>
      )
    }

    render(<Controlled />)
    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')

    expect(screen.getByTestId('position').textContent).toBe('0,20')
    expect(panel().style.transform).toBe('translate3d(0px, 20px, 0)')
  })

  it('reads the drag out into a live region', async () => {
    const user = userEvent.setup()
    render(<Draggable aria-label="Panel" id="settings" keyboardStep={20} />)

    const live = panel().querySelector('[role=status]') as HTMLElement
    expect(live.getAttribute('aria-live')).toBe('assertive')

    screen.getByRole('button', { name: 'Panel' }).focus()
    await user.keyboard(' ')
    expect(live.textContent).toContain('Picked up settings')

    await user.keyboard('{Escape}')
    expect(live.textContent).toContain('cancelled')
  })

  it('drives the drag from the handle when it is given one', async () => {
    const user = userEvent.setup()
    render(
      <Draggable withHandle keyboardStep={20}>
        <DraggableHandle>Settings</DraggableHandle>
        <p>Body</p>
      </Draggable>,
    )

    // The panel itself is inert; only the bar is a control.
    expect(panel().getAttribute('role')).toBeNull()

    const handle = screen.getByRole('button', { name: 'Settings' })
    handle.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(panel().style.transform).toBe('translate3d(20px, 0px, 0)')
  })

  it('ignores the keyboard entirely when it is disabled', async () => {
    const user = userEvent.setup()
    const onDragEnd = vi.fn()
    render(<Draggable aria-label="Panel" disabled keyboardStep={20} onDragEnd={onDragEnd} />)

    const element = screen.getByRole('button', { name: 'Panel' })
    expect(element.getAttribute('aria-disabled')).toBe('true')
    expect(element.getAttribute('tabindex')).toBe('-1')

    element.focus()
    await user.keyboard(' ')
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onDragEnd).not.toHaveBeenCalled()
    expect(panel().style.transform).toBe('translate3d(0px, 0px, 0)')
  })
})
