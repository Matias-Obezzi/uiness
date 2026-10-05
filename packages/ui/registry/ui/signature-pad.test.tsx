import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  SignaturePad,
  type SignaturePadHandle,
  type SignatureStroke,
  signatureToSVG,
} from './signature-pad'

// jsdom has no canvas. A context that records calls is enough to follow the drawing.
const calls: string[] = []
const fakeContext = new Proxy(
  {},
  {
    get: (_, key) =>
      typeof key === 'string' &&
      !['lineWidth', 'strokeStyle', 'fillStyle', 'lineCap', 'lineJoin'].includes(key)
        ? (..._args: unknown[]) => calls.push(key)
        : undefined,
    set: () => true,
  },
)
const originalGetContext = HTMLCanvasElement.prototype.getContext
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => fakeContext,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA'
})
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL
})

function draw(canvas: HTMLElement, points: [number, number][]) {
  const [first, ...rest] = points
  if (!first) return
  let t = 0
  fireEvent.pointerDown(canvas, {
    clientX: first[0],
    clientY: first[1],
    pointerId: 1,
    button: 0,
    pointerType: 'mouse',
  })
  for (const [x, y] of rest) {
    t += 16
    fireEvent.pointerMove(canvas, {
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'mouse',
      timeStamp: t,
    })
  }
  fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: 'mouse' })
}

const canvas = () => screen.getByRole('img')

describe('SignaturePad', () => {
  it('records a stroke from pointer events', () => {
    const onChange = vi.fn()
    render(<SignaturePad onChange={onChange} />)
    expect(canvas().getAttribute('aria-label')).toBe('Signature, empty')
    calls.length = 0
    draw(canvas(), [
      [10, 10],
      [20, 12],
      [40, 20],
      [60, 30],
    ])
    expect(onChange).toHaveBeenCalledTimes(1)
    const strokes: SignatureStroke[] = onChange.mock.lastCall?.[0]
    expect(strokes).toHaveLength(1)
    expect(strokes[0]?.length).toBe(4)
    expect(strokes[0]?.[0]).toMatchObject({ x: 10, y: 10 })
    expect(calls).toContain('quadraticCurveTo')
    expect(canvas().getAttribute('aria-label')).toBe('Signature, 1 stroke')
  })

  it('draws thinner when the pointer moves faster', () => {
    const onChange = vi.fn()
    render(<SignaturePad onChange={onChange} minWidth={0.5} maxWidth={4} />)
    draw(canvas(), [
      [0, 0],
      [2, 0],
      [4, 0],
      [6, 0],
    ])
    draw(canvas(), [
      [0, 50],
      [80, 50],
      [160, 50],
      [240, 50],
    ])
    const [slow, fast] = (onChange.mock.lastCall?.[0] ?? []) as SignatureStroke[]
    const last = (s?: SignatureStroke) => s?.[s.length - 1]?.w ?? 0
    expect(last(fast)).toBeLessThan(last(slow))
    expect(last(fast)).toBeGreaterThanOrEqual(0.5)
  })

  it('undoes and clears from buttons and the keyboard', async () => {
    const onChange = vi.fn()
    render(<SignaturePad onChange={onChange} />)
    const undo = screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement
    expect(undo.disabled).toBe(true)
    draw(canvas(), [
      [0, 0],
      [10, 10],
    ])
    draw(canvas(), [
      [0, 20],
      [10, 30],
    ])
    draw(canvas(), [
      [0, 40],
      [10, 50],
    ])
    await userEvent.click(undo)
    expect(onChange.mock.lastCall?.[0]).toHaveLength(2)
    await userEvent.keyboard('{Control>}z{/Control}')
    expect(onChange.mock.lastCall?.[0]).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange.mock.lastCall?.[0]).toEqual([])
    expect(undo.disabled).toBe(true)
  })

  it('exports PNG and SVG through its handle', () => {
    const ref = createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} color="#112233" />)
    expect(ref.current?.isEmpty()).toBe(true)
    draw(canvas(), [
      [5, 5],
      [15, 8],
      [25, 15],
    ])
    expect(ref.current?.isEmpty()).toBe(false)
    expect(ref.current?.toDataURL()).toMatch(/^data:image\/png/)
    const svg = ref.current?.toSVG({ background: '#fff' }) ?? ''
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(svg).toContain('stroke="#112233"')
    expect(svg).toContain('<rect width="100%" height="100%" fill="#fff"/>')
    expect(svg).toContain('Q')
    act(() => ref.current?.clear())
    expect(ref.current?.isEmpty()).toBe(true)
  })

  it('writes a single tap as a dot in the SVG', () => {
    const svg = signatureToSVG([[{ x: 4, y: 4, t: 0, w: 2 }]], { width: 10, height: 10 })
    expect(svg).toContain('<circle cx="4" cy="4" r="1"')
  })

  it('ignores the pointer when disabled', () => {
    const onChange = vi.fn()
    render(<SignaturePad disabled onChange={onChange} />)
    draw(canvas(), [
      [0, 0],
      [10, 10],
    ])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('carries the signature as a PNG in a hidden input', () => {
    const { container } = render(<SignaturePad name="signature" />)
    const hidden = container.querySelector<HTMLInputElement>('input[name="signature"]')
    expect(hidden?.value).toBe('')
    draw(canvas(), [
      [0, 0],
      [10, 10],
    ])
    expect(hidden?.value).toMatch(/^data:image\/png/)
  })

  it('replays the strokes', async () => {
    const ref = createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} />)
    draw(canvas(), [
      [0, 0],
      [10, 10],
      [20, 10],
    ])
    calls.length = 0
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }))
    await act(() => new Promise((r) => setTimeout(r, 400)))
    expect(calls).toContain('clearRect')
    expect(calls).toContain('quadraticCurveTo')
  })
})
