import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ColorPicker, contrastRatio, formatColor, parseColor } from './color-picker'

describe('color math', () => {
  it('reads every supported syntax', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseColor('#00ff0080')?.a).toBeCloseTo(0.5, 2)
    expect(parseColor('rgb(0 128 255 / 50%)')).toEqual({ r: 0, g: 128, b: 255, a: 0.5 })
    expect(parseColor('rgba(0, 128, 255, 0.25)')?.a).toBe(0.25)
    const green = parseColor('hsl(120 100% 50%)')
    expect(green && formatColor(green, 'hex')).toBe('#00ff00')
    const blue = parseColor('hsla(240, 100%, 50%, 1)')
    expect(blue && formatColor(blue, 'hex')).toBe('#0000ff')
    expect(parseColor('not a color')).toBeNull()
    expect(parseColor('rgb(1 2)')).toBeNull()
  })

  it('round trips through oklch', () => {
    const red = { r: 255, g: 0, b: 0, a: 1 }
    const written = formatColor(red, 'oklch')
    expect(written).toMatch(/^oklch\(0\.628 0\.258 29\.2\d*\)$/)
    const back = parseColor(written)
    expect(back && formatColor(back, 'hex')).toBe('#ff0000')
  })

  it('writes alpha only when there is some', () => {
    expect(formatColor({ r: 0, g: 0, b: 0, a: 1 }, 'rgb')).toBe('rgb(0 0 0)')
    expect(formatColor({ r: 0, g: 0, b: 0, a: 0.5 }, 'hsl')).toBe('hsl(0 0% 0% / 0.5)')
    expect(formatColor({ r: 255, g: 255, b: 255, a: 0.5 }, 'hex')).toBe('#ffffff80')
  })

  it('computes the WCAG contrast ratio', () => {
    const black = { r: 0, g: 0, b: 0, a: 1 }
    const white = { r: 255, g: 255, b: 255, a: 1 }
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5)
    // Half transparent black over white is a mid grey.
    expect(contrastRatio({ ...black, a: 0.5 }, white)).toBeLessThan(5)
  })
})

async function open() {
  await userEvent.click(screen.getByRole('button'))
  return screen.findByRole('slider', { name: 'Saturation and brightness' })
}

describe('ColorPicker', () => {
  it('opens a picker from the swatch', async () => {
    render(<ColorPicker defaultValue="#ff0000" />)
    expect(screen.getByRole('button').textContent).toContain('#ff0000')
    await open()
    expect(screen.getByRole('slider', { name: 'Hue' })).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Opacity' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Color value' })).toBeTruthy()
  })

  it('moves saturation and brightness from the keyboard', async () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />)
    const area = await open()
    area.focus()
    await userEvent.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith('#ffffff')
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(area.getAttribute('aria-valuetext')).toBe('Saturation 0%, brightness 90%')
  })

  it('moves the hue with the slider keys', async () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />)
    await open()
    screen.getByRole('slider', { name: 'Hue' }).focus()
    await userEvent.keyboard('{End}')
    // 360° is red again.
    expect(onValueChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Home}{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith('#ff0400')
  })

  it('switches format and writes the value in it', async () => {
    const onValueChange = vi.fn()
    const onFormatChange = vi.fn()
    render(
      <ColorPicker
        defaultValue="#ff0000"
        onValueChange={onValueChange}
        onFormatChange={onFormatChange}
      />,
    )
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'rgb' }))
    expect(onFormatChange).toHaveBeenLastCalledWith('rgb')
    expect(onValueChange).toHaveBeenLastCalledWith('rgb(255 0 0)')
    expect(screen.getByRole('button', { name: 'rgb' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'hsl' }))
    expect(onValueChange).toHaveBeenLastCalledWith('hsl(0 100% 50%)')
  })

  it('takes a typed color and flags one it cannot read', async () => {
    const onValueChange = vi.fn()
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} />)
    await open()
    const input = screen.getByRole('textbox', { name: 'Color value' })
    await userEvent.clear(input)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await userEvent.type(input, 'oklch(0.7 0.1 200)')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(onValueChange.mock.lastCall?.[0]).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('saves the current color and removes a saved one with Delete', async () => {
    const onSwatchesChange = vi.fn()
    render(
      <ColorPicker
        defaultValue="#ff0000"
        defaultSwatches={['#000000']}
        onSwatchesChange={onSwatchesChange}
      />,
    )
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Save this color' }))
    expect(onSwatchesChange).toHaveBeenLastCalledWith(['#000000', '#ff0000'])
    expect(
      (screen.getByRole('button', { name: 'Save this color' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    screen.getByRole('button', { name: '#000000' }).focus()
    await userEvent.keyboard('{Delete}')
    expect(onSwatchesChange).toHaveBeenLastCalledWith(['#ff0000'])
  })

  it('applies a saved swatch', async () => {
    const onValueChange = vi.fn()
    render(
      <ColorPicker defaultValue="#ff0000" swatches={['#123456']} onValueChange={onValueChange} />,
    )
    await open()
    await userEvent.click(screen.getByRole('button', { name: '#123456' }))
    expect(onValueChange).toHaveBeenLastCalledWith('#123456')
  })

  it('shows the contrast against a background', async () => {
    render(<ColorPicker defaultValue="#000000" contrastWith="#ffffff" />)
    await open()
    expect(screen.getByText('21.00:1')).toBeTruthy()
    expect(screen.getByText('AAA').parentElement?.textContent).toContain('Passes')
  })

  it('leaves out alpha when asked and fills a hidden input', async () => {
    const { container } = render(
      <ColorPicker defaultValue="#ff000080" alpha={false} name="brand" />,
    )
    expect(container.querySelector<HTMLInputElement>('input[name="brand"]')?.value).toBe('#ff0000')
    await open()
    expect(screen.queryByRole('slider', { name: 'Opacity' })).toBeNull()
  })

  it('starts in the format of the value it is given', () => {
    render(<ColorPicker defaultValue="oklch(0.5 0.1 250)" />)
    expect(screen.getByRole('button').textContent).toMatch(/^oklch\(/)
  })
})
