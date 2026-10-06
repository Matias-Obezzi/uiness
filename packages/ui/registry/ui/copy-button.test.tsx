import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LabelsProvider } from '@/lib/labels'
import { CopyButton } from './copy-button'

const clipboard = (writeText: (text: string) => Promise<void>) =>
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Clicks go through fireEvent: user-event installs its own clipboard over the stub.
const press = async (el: HTMLElement) => {
  await act(async () => {
    fireEvent.click(el)
  })
}

describe('CopyButton', () => {
  it('copies the value, confirms it and calls onCopy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    clipboard(writeText)
    const onCopy = vi.fn()
    render(<CopyButton value="pnpm dlx shadcn add" onCopy={onCopy} />)
    const button = screen.getByRole('button', { name: 'Copy' })
    await press(button)
    expect(writeText).toHaveBeenCalledWith('pnpm dlx shadcn add')
    expect(onCopy).toHaveBeenCalledWith('pnpm dlx shadcn add')
    expect(button.dataset.state).toBe('copied')
    expect(screen.getByRole('status').textContent).toBe('Copied')
  })

  it('reads the value from a function at click time', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    clipboard(writeText)
    let n = 0
    render(<CopyButton value={async () => `call ${++n}`} />)
    await press(screen.getByRole('button'))
    expect(writeText).toHaveBeenLastCalledWith('call 1')
  })

  it('goes back to rest after the timeout', async () => {
    vi.useFakeTimers()
    clipboard(vi.fn().mockResolvedValue(undefined))
    render(<CopyButton value="x" timeout={500} />)
    const button = screen.getByRole('button')
    await press(button)
    expect(button.dataset.state).toBe('copied')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(button.dataset.state).toBe('idle')
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('shows and reports a refused copy', async () => {
    const error = new Error('denied')
    clipboard(vi.fn().mockRejectedValue(error))
    const onCopy = vi.fn()
    const onCopyError = vi.fn()
    render(<CopyButton value="x" onCopy={onCopy} onCopyError={onCopyError} />)
    const button = screen.getByRole('button')
    await press(button)
    expect(button.dataset.state).toBe('error')
    expect(onCopy).not.toHaveBeenCalled()
    expect(onCopyError).toHaveBeenCalledWith(error)
    expect(screen.getByRole('status').textContent).toBe('Copy failed')
  })

  it('takes its name from children when it has them', () => {
    render(<CopyButton value="x">Copy link</CopyButton>)
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy()
  })

  it('keeps the tooltip open with "Copied" after a copy', async () => {
    clipboard(vi.fn().mockResolvedValue(undefined))
    render(<CopyButton value="x" tooltip />)
    await press(screen.getByRole('button', { name: 'Copy' }))
    expect((await screen.findByRole('tooltip')).textContent).toBe('Copied')
  })
})

describe('CopyButton labels', () => {
  it('takes its words from the labels prop and the provider', async () => {
    clipboard(vi.fn().mockResolvedValue(undefined))
    render(
      <LabelsProvider labels={{ 'copy-button': { copy: 'Copiar', copied: 'Copiado' } }}>
        <CopyButton value="x" />
        <CopyButton value="y" labels={{ copy: 'Copiar enlace' }} />
      </LabelsProvider>,
    )
    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeTruthy()
    await press(screen.getByRole('button', { name: 'Copiar' }))
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Copiado')
  })

  it('still prefers the single label props', () => {
    render(
      <LabelsProvider labels={{ 'copy-button': { copy: 'Copiar' } }}>
        <CopyButton value="x" label="Copy the id" />
      </LabelsProvider>,
    )
    expect(screen.getByRole('button', { name: 'Copy the id' })).toBeTruthy()
  })
})
