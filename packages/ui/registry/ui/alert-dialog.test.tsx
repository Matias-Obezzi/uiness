import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Confirmer,
  confirm,
} from './alert-dialog'

function Declarative() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the file?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const overlay = () => document.querySelector('[data-slot=alert-dialog-overlay]') as HTMLElement

describe('AlertDialog', () => {
  it('opens as an alertdialog that an outside click does not close', async () => {
    const user = userEvent.setup()
    render(<Declarative />)
    await user.click(screen.getByText('Delete'))
    const dialog = screen.getByRole('alertdialog', { name: 'Delete the file?' })
    expect(dialog.dataset.slot).toBe('alert-dialog-content')
    // Cancel is the safe choice, so it is where focus lands.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(overlay())
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-destructive')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

describe('confirm()', () => {
  it('resolves true from the action and false from cancel', async () => {
    const user = userEvent.setup()
    render(<Confirmer />)
    let result: Promise<boolean> | undefined
    act(() => {
      result = confirm({ title: 'Publish?', description: 'Everyone will see it.' })
    })
    const dialog = await screen.findByRole('alertdialog', { name: 'Publish?' })
    expect(dialog.textContent).toContain('Everyone will see it.')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await expect(result).resolves.toBe(true)

    act(() => {
      result = confirm({ title: 'Leave?', confirmText: 'Leave', cancelText: 'Stay' })
    })
    await screen.findByRole('alertdialog', { name: 'Leave?' })
    await user.click(screen.getByRole('button', { name: 'Stay' }))
    await expect(result).resolves.toBe(false)
  })

  it('resolves false on Escape and gives focus back', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Confirmer />
        <button type="button">Remove</button>
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Remove' })
    trigger.focus()
    let result: Promise<boolean> | undefined
    act(() => {
      result = confirm({ title: 'Remove it?' })
    })
    await screen.findByRole('alertdialog')
    await user.click(overlay())
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    await user.keyboard('{Escape}')
    await expect(result).resolves.toBe(false)
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('queues calls made while one is open', async () => {
    const user = userEvent.setup()
    render(<Confirmer />)
    let first: Promise<boolean> | undefined
    let second: Promise<boolean> | undefined
    act(() => {
      first = confirm({ title: 'First' })
      second = confirm({ title: 'Second' })
    })
    await screen.findByRole('alertdialog', { name: 'First' })
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await expect(first).resolves.toBe(true)
    await screen.findByRole('alertdialog', { name: 'Second' })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await expect(second).resolves.toBe(false)
  })

  it('paints the action for destructive confirms', async () => {
    const user = userEvent.setup()
    render(<Confirmer />)
    let result: Promise<boolean> | undefined
    act(() => {
      result = confirm({ title: 'Delete?', confirmText: 'Delete', variant: 'destructive' })
    })
    await screen.findByRole('alertdialog')
    const action = screen.getByRole('button', { name: 'Delete' })
    expect(action.className).toContain('bg-destructive')
    await user.click(action)
    await expect(result).resolves.toBe(true)
  })

  it('waits for onConfirm, showing it is busy, and stays open when it fails', async () => {
    const user = userEvent.setup()
    render(<Confirmer />)
    let finish: () => void = () => {}
    let fail: () => void = () => {}
    let attempts = 0
    const onConfirm = () =>
      new Promise<void>((resolve, reject) => {
        attempts++
        finish = resolve
        fail = () => reject(new Error('offline'))
      })
    let settled = false
    act(() => {
      void confirm({ title: 'Save?', onConfirm }).then(() => {
        settled = true
      })
    })
    await screen.findByRole('alertdialog')
    const action = screen.getByRole('button', { name: 'Continue' })
    await user.click(action)
    expect(action.getAttribute('aria-busy')).toBe('true')
    expect((action as HTMLButtonElement).disabled).toBe(true)
    await user.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeTruthy()

    await act(async () => fail())
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(action.hasAttribute('aria-busy')).toBe(false)
    expect(settled).toBe(false)

    await user.click(action)
    expect(attempts).toBe(2)
    await act(async () => finish())
    await waitFor(() => expect(settled).toBe(true))
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})
