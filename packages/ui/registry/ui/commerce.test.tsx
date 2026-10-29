import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AmountPad, press } from './amount-pad'
import { BoardingPass } from './boarding-pass'
import { CartButton } from './cart-button'
import { CurrencyTransfer } from './currency-transfer'
import { LocationPicker } from './location-picker'
import { ReceiptPrinter } from './receipt-printer'
import { SaveButton } from './save-button'
import { SeatMap, strandedSeats } from './seat-map'
import { SlideToConfirm } from './slide-to-confirm'
import { nearestFree, SlotPicker } from './slot-picker'
import { TeamSelector } from './team-selector'
import { dayPart, offsetOf, TimezonePlanner } from './timezone-planner'
import { TipSelector, tipFor } from './tip-selector'
import { UndoButton } from './undo-button'

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
  Element.prototype.hasPointerCapture ??= () => false
})
afterEach(() => {
  vi.useRealTimers()
})

describe('AmountPad', () => {
  it('builds the amount key by key, keeping to the currency’s decimals', () => {
    let typed = ''
    for (const k of ['0', '1', '2', '.', '5', '0', '7', 'back']) typed = press(typed, k, 2, 7)
    expect(typed).toBe('12.5')
    expect(press('', '.', 2, 7)).toBe('0.')
    expect(press('1234567', '8', 2, 7)).toBe('1234567')
    expect(press('5', '.', 0, 7)).toBe('5')
  })

  it('takes typing while focused and shows the amount in the currency', () => {
    const onValueChange = vi.fn()
    render(<AmountPad onValueChange={onValueChange} locale="en-US" />)
    const pad = screen.getByRole('group', { name: 'Keypad' })
    for (const key of ['4', '2', '.', '5']) fireEvent.keyDown(pad, { key })
    expect(onValueChange).toHaveBeenLastCalledWith(42.5)
    expect(screen.getByRole('status', { name: 'Amount' }).textContent).toBe('$42.5')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onValueChange).toHaveBeenLastCalledWith(42)
  })
})

describe('SlideToConfirm', () => {
  it('confirms once the keyboard takes it to the end', async () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm onConfirm={onConfirm}>Slide to pay</SlideToConfirm>)
    const slider = screen.getByRole('slider', { name: 'Slide to pay' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider.getAttribute('aria-valuenow')).toBe('25')
    expect(onConfirm).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.keyDown(slider, { key: 'End' })
    })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(slider.getAttribute('aria-valuetext')).toBe('Confirmed')
  })
})

describe('SaveButton', () => {
  it('saves to the last collection, moves it from the strip and takes it out', async () => {
    const user = userEvent.setup()
    function Host() {
      const [value, setValue] = React.useState<string | null>(null)
      return (
        <SaveButton
          collections={[
            { id: 'read', name: 'Read later' },
            { id: 'trips', name: 'Trips' },
          ]}
          value={value}
          onValueChange={setValue}
        />
      )
    }
    render(<Host />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      screen.getByRole('button', { name: 'Saved to Read later' }).getAttribute('aria-pressed'),
    ).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Trips' }))
    expect(screen.getByRole('button', { name: 'Saved to Trips' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Saved to Trips' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })
})

describe('CartButton', () => {
  it('opens into a stepper, with a bin at one', async () => {
    const user = userEvent.setup()
    function Host() {
      const [quantity, setQuantity] = React.useState(0)
      return <CartButton item="Latte" quantity={quantity} onQuantityChange={setQuantity} />
    }
    render(<Host />)
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('group', { name: 'Quantity of Latte' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Add one' }))
    expect(screen.getByRole('status').textContent).toContain('2 in cart')
    await user.click(screen.getByRole('button', { name: 'Remove one' }))
    await user.click(screen.getByRole('button', { name: 'Remove from cart' }))
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })
})

describe('UndoButton', () => {
  it('can be taken back in time, and goes through once the time is up', () => {
    vi.useFakeTimers()
    const onCommit = vi.fn()
    const onUndo = vi.fn()
    render(
      <UndoButton onCommit={onCommit} onUndo={onUndo} duration={3000}>
        Archive
      </UndoButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))
    expect(screen.getByRole('button', { name: /Undo, 3s left/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Undo/ }))
    expect(onUndo).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button').textContent).toContain('Archive')
  })
})

describe('TipSelector', () => {
  it('works out the tip, or what makes the total whole', () => {
    expect(tipFor(42.3, 18, false)).toBeCloseTo(7.61)
    expect(tipFor(42.3, 18, true)).toBeCloseTo(7.7)
  })

  it('steps with the keyboard and reports the tip and total', () => {
    const onTipChange = vi.fn()
    render(<TipSelector subtotal={50} defaultValue={18} onTipChange={onTipChange} />)
    const tape = screen.getByRole('slider', { name: 'Tip' })
    fireEvent.keyDown(tape, { key: 'ArrowRight' })
    expect(tape.getAttribute('aria-valuenow')).toBe('19')
    expect(onTipChange).toHaveBeenLastCalledWith(9.5, 59.5)
    fireEvent.click(screen.getByRole('switch', { name: 'Round up the total' }))
    expect(onTipChange).toHaveBeenLastCalledWith(10, 60)
  })
})

describe('SeatMap', () => {
  const rows = [
    { id: 'A', seats: [false, false, false, null, false, true] },
    { id: 'B', seats: [true, false, false, false, null, false] },
  ]

  it('finds the seats a choice would strand', () => {
    expect(strandedSeats(rows, ['A1', 'A3'])).toEqual(['A2'])
    // A5 sits between an aisle and a taken seat already: no choice of ours strands it.
    expect(strandedSeats(rows, [])).toEqual([])
  })

  it('takes a run of seats by dragging along a row and warns of a stranded one', () => {
    const onValueChange = vi.fn()
    render(<SeatMap rows={rows} onValueChange={onValueChange} />)
    const seat = (name: RegExp) => screen.getByRole('button', { name })
    fireEvent.pointerDown(seat(/Row B, seat 2,/), { pointerId: 1 })
    fireEvent.pointerEnter(seat(/Row B, seat 3,/), { pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(['B2', 'B3'])
    expect(screen.getByRole('status').textContent).toBe('Seat B4 would be left on its own.')
    expect((seat(/Row B, seat 1,/) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('SlotPicker', () => {
  const bookings = [{ start: 600, end: 660, title: 'Standup' }]

  it('finds the nearest free start', () => {
    expect(nearestFree(630, 30, bookings, 480, 1200, 15)).toBe(660)
    expect(nearestFree(605, 30, bookings, 480, 1200, 15)).toBe(570)
  })

  it('hops over a booking with the keyboard and resizes with Shift', () => {
    const onValueChange = vi.fn()
    render(
      <SlotPicker
        bookings={bookings}
        defaultValue={{ start: 570, end: 600 }}
        onValueChange={onValueChange}
        locale="en-US"
      />,
    )
    const meeting = screen.getByRole('slider')
    fireEvent.keyDown(meeting, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 660, end: 690 })
    fireEvent.keyDown(meeting, { key: 'ArrowRight', shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith({ start: 660, end: 705 })
  })
})

describe('TimezonePlanner', () => {
  it('knows zone offsets and parts of the day', () => {
    const day = new Date(Date.UTC(2026, 0, 15, 12))
    expect(offsetOf('UTC', day)).toBe(0)
    expect(offsetOf('Asia/Tokyo', day)).toBe(540)
    expect(dayPart(10)).toBe('work')
    expect(dayPart(20)).toBe('awake')
    expect(dayPart(2)).toBe('asleep')
  })

  it('shows the meeting in each zone and who is outside working hours', () => {
    render(
      <TimezonePlanner
        locale="en-US"
        date={new Date(Date.UTC(2026, 0, 15, 12))}
        defaultValue={10 * 60}
        people={[
          { name: 'You', timeZone: 'UTC' },
          { name: 'Kenji', timeZone: 'Asia/Tokyo' },
        ]}
      />,
    )
    expect(screen.getByText('Kenji').parentElement?.textContent).toContain('7:00 PM')
    expect(screen.getByRole('status').textContent).toBe('1 person is outside working hours.')
    const dial = screen.getByRole('slider', { name: 'Meeting time' })
    fireEvent.keyDown(dial, { key: 'PageDown' })
    expect(dial.getAttribute('aria-valuetext')).toBe('Meeting at 9:00 AM')
  })
})

describe('BoardingPass', () => {
  it('rolls a changed field, strikes the old value and says so', () => {
    const pass = {
      from: { code: 'LIS', city: 'Lisbon' },
      to: { code: 'NRT', city: 'Tokyo' },
      passenger: 'Ana Silva',
      flight: 'TP 81',
      boards: '09:40',
      departs: '10:15',
      seat: '23A',
    }
    const { rerender } = render(<BoardingPass {...pass} gate="B12" />)
    rerender(<BoardingPass {...pass} gate="C14" />)
    expect(screen.getByText('B12').tagName).toBe('DEL')
    expect(screen.getByText('Gate changed from B12 to C14')).toBeTruthy()
  })
})

describe('CurrencyTransfer', () => {
  it('converts in place and gives a reference at the end', () => {
    const steps = [{ label: 'Sent' }, { label: 'Converted' }, { label: 'Delivered' }]
    const props = {
      amount: 100,
      from: 'USD',
      to: 'EUR',
      rate: 0.9,
      steps,
      locale: 'en-US',
      reference: 'TX-42',
    }
    const { rerender } = render(<CurrencyTransfer {...props} current={0} />)
    expect(screen.getByText('1 USD = 0.9 EUR')).toBeTruthy()
    expect(screen.getByText('Sent').textContent).toContain('in progress')
    rerender(<CurrencyTransfer {...props} current={3} />)
    expect(screen.getByText('TX-42')).toBeTruthy()
    expect(screen.getByText('Delivered').textContent).toContain('done')
  })
})

describe('TeamSelector', () => {
  it('steps with the buttons and the keys, within its limits', () => {
    const onValueChange = vi.fn()
    render(<TeamSelector defaultValue={1} max={3} onValueChange={onValueChange} />)
    const count = screen.getByRole('spinbutton', { name: 'Seats' })
    expect(
      (screen.getByRole('button', { name: 'Remove a seat' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Add a seat' }))
    fireEvent.keyDown(count, { key: 'End' })
    expect(count.getAttribute('aria-valuenow')).toBe('3')
    expect(onValueChange).toHaveBeenLastCalledWith(3)
  })
})

describe('LocationPicker', () => {
  it('looks the address up once the map stops', async () => {
    vi.useFakeTimers()
    const resolve = vi.fn(() => '12 Rua Augusta')
    render(<LocationPicker defaultCenter={[-9.14, 38.71]} resolve={resolve} />)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    expect(resolve).toHaveBeenCalledWith([-9.14, 38.71])
    expect(screen.getByText('Pickup at 12 Rua Augusta')).toBeTruthy()
  })
})

describe('ReceiptPrinter', () => {
  it('prints line by line, then tears off', () => {
    vi.useFakeTimers()
    const onTear = vi.fn()
    render(
      <ReceiptPrinter
        title="Café"
        locale="en-US"
        onTear={onTear}
        lines={[
          { label: 'Latte', amount: 4.5 },
          { label: 'Croissant', amount: 3 },
        ]}
      />,
    )
    expect(screen.queryByText('Latte')).toBeNull()
    for (let i = 0; i < 5; i++) act(() => vi.advanceTimersByTime(280))
    expect(screen.getByText('$7.50')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tear off' }))
    act(() => vi.advanceTimersByTime(700))
    expect(onTear).toHaveBeenCalled()
  })
})
