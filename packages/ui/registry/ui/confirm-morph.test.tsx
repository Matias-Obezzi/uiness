import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmMorph } from './confirm-morph'

afterEach(() => {
  vi.useRealTimers()
})

const root = () => document.querySelector<HTMLElement>('[data-slot=confirm-morph]') as HTMLElement

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ConfirmMorph', () => {
  it('asks in place before acting, and Cancel goes back', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmMorph onConfirm={onConfirm}>Delete project</ConfirmMorph>)
    await userEvent.click(screen.getByRole('button', { name: 'Delete project' }))
    expect(root().dataset.state).toBe('confirming')
    expect(screen.getByRole('group', { name: 'Are you sure?' })).toBeTruthy()
    // Focus lands on the safe choice, so a second Enter does not confirm.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(root().dataset.state).toBe('idle')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete project' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancels with Escape', async () => {
    render(<ConfirmMorph onConfirm={() => {}}>Delete</ConfirmMorph>)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.keyboard('{Escape}')
    expect(root().dataset.state).toBe('idle')
  })

  it('shows a spinner while the action runs, then the result with Undo', async () => {
    const work = deferred()
    const onUndo = vi.fn()
    render(
      <ConfirmMorph
        onConfirm={() => work.promise}
        onUndo={onUndo}
        pendingLabel="Deleting…"
        successLabel="Deleted"
      >
        Delete
      </ConfirmMorph>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(root().dataset.state).toBe('pending')
    expect(screen.getByRole('status').textContent).toBe('Deleting…')
    // Focus stays in the control while its buttons are gone.
    expect(document.activeElement).toBe(root())

    await act(async () => work.resolve())
    expect(root().dataset.state).toBe('done')
    expect(screen.getByRole('status').textContent).toBe('Deleted')
    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(document.activeElement).toBe(undo)
    await userEvent.click(undo)
    expect(onUndo).toHaveBeenCalledOnce()
    expect(root().dataset.state).toBe('idle')
  })

  it('shows the error state when the action fails', async () => {
    render(
      <ConfirmMorph
        onConfirm={() => Promise.reject(new Error('nope'))}
        errorLabel="Could not delete"
      >
        Delete
      </ConfirmMorph>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(root().dataset.state).toBe('error')
    expect(screen.getByRole('status').textContent).toBe('Could not delete')
  })

  it('returns to rest after resetAfter, but not while hovered', async () => {
    vi.useFakeTimers()
    render(
      <ConfirmMorph onConfirm={() => {}} resetAfter={1000}>
        Delete
      </ConfirmMorph>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(root().dataset.state).toBe('done')

    fireEvent.pointerEnter(root())
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(root().dataset.state).toBe('done')

    fireEvent.pointerLeave(root())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(root().dataset.state).toBe('idle')
  })

  it('does not open while disabled', async () => {
    render(
      <ConfirmMorph onConfirm={() => {}} disabled>
        Delete
      </ConfirmMorph>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(root().dataset.state).toBe('idle')
  })
})
