import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PencilIcon, SquareIcon } from 'lucide-react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AttractButton, fieldAngle } from './attract-button'
import { BellButton } from './bell-button'
import { DetentDial } from './detent-dial'
import { GradientButton } from './gradient-button'
import { LiquidSlider } from './liquid-slider'
import { itemAt, MarkingMenu } from './marking-menu'
import { MorphPopover } from './morph-popover'
import { MorphicNavbar } from './morphic-navbar'
import { ParticleButton } from './particle-button'
import { ProfileDropdown } from './profile-dropdown'
import { PullCord } from './pull-cord'
import { ScrollIndex } from './scroll-index'
import { StackPanel } from './stack-panel'
import { TearButton } from './tear-button'
import { nearestEdge, Toolbar } from './toolbar'
import { WheelPicker } from './wheel-picker'

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
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext
})
afterEach(() => {
  vi.useRealTimers()
})

describe('GradientButton and AttractButton', () => {
  it('are buttons', () => {
    const onClick = vi.fn()
    render(
      <>
        <GradientButton variant="emerald" onClick={onClick}>
          Upgrade
        </GradientButton>
        <AttractButton>Get started</AttractButton>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }))
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Get started' })).toBeTruthy()
  })

  it('points filings along a bar magnet’s field', () => {
    // Along the magnet's axis the field runs along it; beside its middle, the other way.
    expect(fieldAngle(2, 0)).toBeCloseTo(0)
    expect(Math.abs(fieldAngle(0, 2))).toBeCloseTo(Math.PI)
  })
})

describe('BellButton', () => {
  it('toggles the subscription', () => {
    const onSubscribedChange = vi.fn()
    render(<BellButton onSubscribedChange={onSubscribedChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(onSubscribedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Subscribed' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
  })
})

describe('ParticleButton', () => {
  it('shows it working, then done, then is ready again', async () => {
    vi.useFakeTimers()
    let finish = () => {}
    render(
      <ParticleButton onAction={() => new Promise<void>((r) => (finish = r))}>
        Publish
      </ParticleButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(screen.getByRole('button').textContent).toContain('Working…')
    await act(async () => finish())
    expect(screen.getByRole('button').textContent).toContain('Done')
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy()
  })

  it('says when it fails', async () => {
    render(
      <ParticleButton onAction={() => Promise.reject(new Error('no'))}>Publish</ParticleButton>,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    })
    expect(screen.getByRole('button').textContent).toContain('Something went wrong')
  })
})

describe('TearButton', () => {
  it('tears off while a key is held, and mends when let go early', () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    render(<TearButton onConfirm={onConfirm}>Cancel order</TearButton>)
    const stub = screen.getByRole('button', { name: 'Cancel order' })
    fireEvent.keyDown(stub, { key: ' ' })
    act(() => vi.advanceTimersByTime(330))
    fireEvent.keyUp(stub, { key: ' ' })
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.keyDown(stub, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(800))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('Confirmed')).not.toHaveLength(0)
  })
})

describe('PullCord', () => {
  it('flips when pulled far enough, or from the keyboard', () => {
    const onCheckedChange = vi.fn()
    render(<PullCord onCheckedChange={onCheckedChange} />)
    const bead = screen.getByRole('switch', { name: 'Light' })
    fireEvent.pointerDown(bead, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(bead, { pointerId: 1, clientX: 0, clientY: 20 })
    fireEvent.pointerUp(bead, { pointerId: 1 })
    expect(onCheckedChange).not.toHaveBeenCalled()
    fireEvent.pointerDown(bead, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(bead, { pointerId: 1, clientX: 0, clientY: 60 })
    fireEvent.pointerUp(bead, { pointerId: 1 })
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(bead, { detail: 0 })
    expect(bead.getAttribute('aria-checked')).toBe('false')
  })
})

describe('DetentDial and LiquidSlider', () => {
  it('step from notch to notch on the keyboard', () => {
    const onValueChange = vi.fn()
    render(
      <DetentDial label="Volume" min={0} max={10} defaultValue={3} onValueChange={onValueChange} />,
    )
    const dial = screen.getByRole('slider', { name: 'Volume' })
    fireEvent.keyDown(dial, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenLastCalledWith(4)
    fireEvent.keyDown(dial, { key: 'End' })
    expect(dial.getAttribute('aria-valuenow')).toBe('10')
  })

  it('fill like a glass from the keyboard', () => {
    render(<LiquidSlider label="Water" defaultValue={40} />)
    const glass = screen.getByRole('slider', { name: 'Water' })
    fireEvent.keyDown(glass, { key: 'ArrowUp' })
    expect(glass.getAttribute('aria-valuetext')).toBe('45%')
    expect(glass.getAttribute('aria-orientation')).toBe('vertical')
  })
})

describe('WheelPicker', () => {
  it('moves the choice with the keyboard', () => {
    const onValueChange = vi.fn()
    const options = ['09', '10', '11', '12'].map((h) => ({ value: h, label: h }))
    render(
      <WheelPicker
        label="Hour"
        options={options}
        defaultValue="10"
        onValueChange={onValueChange}
      />,
    )
    const wheel = screen.getByRole('listbox', { name: 'Hour' })
    expect(screen.getByRole('option', { selected: true }).textContent).toBe('10')
    fireEvent.keyDown(wheel, { key: 'ArrowDown' })
    expect(onValueChange).toHaveBeenLastCalledWith('11')
    fireEvent.keyDown(wheel, { key: 'Home' })
    expect(onValueChange).toHaveBeenLastCalledWith('09')
  })
})

describe('MarkingMenu', () => {
  it('maps directions to items, the first straight up', () => {
    expect(itemAt(0, -40, 4)).toBe(0)
    expect(itemAt(40, 0, 4)).toBe(1)
    expect(itemAt(0, 40, 4)).toBe(2)
    expect(itemAt(3, 3, 4)).toBeNull()
  })

  it('opens from the keyboard and picks with the arrows', () => {
    const onSelect = vi.fn()
    render(
      <MarkingMenu
        aria-label="Shapes"
        onSelect={onSelect}
        items={[
          { id: 'square', label: 'Square' },
          { id: 'circle', label: 'Circle' },
          { id: 'line', label: 'Line' },
        ]}
      />,
    )
    fireEvent.keyDown(screen.getByRole('button', { name: 'Shapes' }), { key: 'Enter' })
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowRight' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('circle')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('picks by a flick before the ring opens', () => {
    const onSelect = vi.fn()
    render(
      <MarkingMenu
        aria-label="Shapes"
        onSelect={onSelect}
        items={[
          { id: 'up', label: 'Up' },
          { id: 'down', label: 'Down' },
        ]}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Shapes' })
    fireEvent.pointerDown(trigger, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(trigger, { pointerId: 1, clientX: 100, clientY: 160 })
    expect(onSelect).toHaveBeenCalledWith('down')
  })
})

describe('Toolbar', () => {
  const tools = [
    { id: 'select', label: 'Select', icon: <SquareIcon />, shortcut: 'v' },
    {
      id: 'draw',
      label: 'Draw',
      icon: <PencilIcon />,
      variants: [
        { id: 'pen', label: 'Pen', icon: <PencilIcon />, shortcut: 'p' },
        { id: 'marker', label: 'Marker', icon: <PencilIcon />, shortcut: 'm' },
      ],
    },
  ]

  it('finds the nearest edge', () => {
    expect(nearestEdge(10, 200, 400, 400)).toBe('left')
    expect(nearestEdge(200, 390, 400, 400)).toBe('bottom')
  })

  it('picks tools by click and by shortcut, variants included', () => {
    const onValueChange = vi.fn()
    render(
      <div style={{ position: 'relative' }}>
        <Toolbar tools={tools} onValueChange={onValueChange} />
      </div>,
    )
    expect(screen.getByRole('toolbar', { name: 'Tools' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pen' }))
    expect(onValueChange).toHaveBeenLastCalledWith('pen')
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(onValueChange).toHaveBeenLastCalledWith('marker')
    expect(screen.getByRole('button', { name: 'Marker' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('moves to another edge from the grip', () => {
    const onEdgeChange = vi.fn()
    render(<Toolbar tools={tools} onEdgeChange={onEdgeChange} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Move the toolbar/ }), {
      key: 'ArrowLeft',
      shiftKey: true,
    })
    expect(onEdgeChange).toHaveBeenCalledWith('left')
  })
})

describe('ProfileDropdown', () => {
  it('switches accounts, sets the status and holds to sign out', async () => {
    const user = userEvent.setup()
    const onAccountChange = vi.fn()
    const onStatusChange = vi.fn()
    render(
      <ProfileDropdown
        current="ana"
        accounts={[
          { id: 'ana', name: 'Ana Silva', email: 'ana@work.io' },
          { id: 'home', name: 'Ana', email: 'ana@home.net' },
        ]}
        onAccountChange={onAccountChange}
        onStatusChange={onStatusChange}
        onSignOut={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Account: Ana Silva' }))
    await user.click(screen.getByRole('radio', { name: 'Away' }))
    expect(onStatusChange).toHaveBeenCalledWith('away')
    expect(screen.getByRole('button', { name: /Hold to sign out/ })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /ana@home\.net/ }))
    expect(onAccountChange).toHaveBeenCalledWith('home')
  })
})

describe('MorphPopover', () => {
  it('opens into its form, sends it and shows the confirmation', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MorphPopover label="Feedback" onSubmit={onSubmit} confirmation="Thanks!">
        <textarea name="message" aria-label="Message" />
      </MorphPopover>,
    )
    await user.click(screen.getByRole('button', { name: 'Feedback' }))
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Message' }))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Lovely')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    const sent = onSubmit.mock.calls[0]?.[0] as FormData | undefined
    expect(sent?.get('message')).toBe('Lovely')
    expect(screen.getByRole('status').textContent).toContain('Thanks!')
  })

  it('closes with Escape back to the button', async () => {
    const user = userEvent.setup()
    render(
      <MorphPopover label="Feedback" onSubmit={() => {}}>
        <input aria-label="Name" />
      </MorphPopover>,
    )
    await user.click(screen.getByRole('button', { name: 'Feedback' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Feedback' })).toBeTruthy()
  })
})

describe('StackPanel', () => {
  it('drills into a page and back, focus following', async () => {
    const user = userEvent.setup()
    render(
      <StackPanel
        pages={[
          { id: 'settings', title: 'Settings', rows: [{ id: 'wifi', label: 'Wi-Fi', to: 'wifi' }] },
          { id: 'wifi', title: 'Wi-Fi', content: <p>Networks</p> },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Wi-Fi' }))
    expect(screen.getByRole('heading', { name: 'Wi-Fi' })).toBe(document.activeElement)
    expect(screen.getByText('Networks')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Back to Settings' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Wi-Fi' }))
  })
})

describe('MorphicNavbar', () => {
  it('marks the current link and changes on click', () => {
    const onValueChange = vi.fn()
    render(
      <MorphicNavbar
        onValueChange={onValueChange}
        items={[
          { id: 'home', label: 'Home' },
          { id: 'work', label: 'Work' },
        ]}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Work' }))
    expect(onValueChange).toHaveBeenCalledWith('work')
    expect(screen.getByRole('button', { name: 'Work' }).getAttribute('aria-current')).toBe('true')
  })
})

describe('ScrollIndex', () => {
  it('finds the headings and marks the one being read', () => {
    const page = document.createElement('div')
    page.innerHTML = '<h2 id="intro">Intro</h2><h2 id="usage">Usage</h2>'
    document.body.appendChild(page)
    render(<ScrollIndex />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Intro', 'Usage'])
    // In jsdom every heading is at the top, so the last one counts as being read.
    expect(links[1]?.getAttribute('aria-current')).toBe('location')
    page.remove()
  })
})
