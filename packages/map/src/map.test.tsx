import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Map, Marker, ZoomControl, zoomsOnWheel } from './index'

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 })
})

describe('Map', () => {
  it('draws OpenStreetMap tiles with their attribution', () => {
    const { container } = render(<Map defaultCenter={[0, 0]} defaultZoom={1} />)
    const srcs = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'))
    expect(srcs).toContain('https://tile.openstreetmap.org/1/0/0.png')
    expect(screen.getByText('OpenStreetMap')).toBeTruthy()
  })

  it('pans and zooms from the keyboard and the zoom buttons', () => {
    const onViewChange = vi.fn()
    render(
      <Map defaultCenter={[0, 0]} defaultZoom={3} onViewChange={onViewChange}>
        <ZoomControl />
      </Map>,
    )
    const map = screen.getByRole('region', { name: 'Map' })
    fireEvent.keyDown(map, { key: '+' })
    expect(onViewChange).toHaveBeenLastCalledWith({ center: [0, 0], zoom: 4 })
    fireEvent.keyDown(map, { key: 'ArrowRight' })
    expect(onViewChange.mock.lastCall?.[0].center[0]).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(onViewChange.mock.lastCall?.[0].zoom).toBe(3)
  })

  it('makes interactive markers buttons', () => {
    const onClick = vi.fn()
    render(
      <Map>
        <Marker lngLat={[0, 0]} label="Null Island" onClick={onClick} />
      </Map>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Null Island' }))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('wheelZoom', () => {
  const wheel = (init: WheelEventInit) => {
    const onViewChange = vi.fn()
    render(<Map defaultCenter={[0, 0]} defaultZoom={3} onViewChange={onViewChange} />)
    const event = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
      ...init,
    })
    screen.getByRole('region', { name: 'Map' }).dispatchEvent(event)
    return { event, onViewChange }
  }

  it('scrolls the page without Ctrl or ⌘, zooms with them', () => {
    const plain = wheel({})
    expect(plain.event.defaultPrevented).toBe(false)
    expect(plain.onViewChange).not.toHaveBeenCalled()
    cleanup()
    const ctrl = wheel({ ctrlKey: true })
    expect(ctrl.event.defaultPrevented).toBe(true)
    expect(ctrl.onViewChange.mock.lastCall?.[0].zoom).toBeGreaterThan(3)
  })

  it('follows the mode like three', () => {
    const plain = { ctrlKey: false, metaKey: false }
    expect(zoomsOnWheel('always', plain)).toBe(true)
    expect(zoomsOnWheel('never', { ctrlKey: true, metaKey: false })).toBe(false)
    expect(zoomsOnWheel('modifier', { ctrlKey: false, metaKey: true })).toBe(true)
  })
})
