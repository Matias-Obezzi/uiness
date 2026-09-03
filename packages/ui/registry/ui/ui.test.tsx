import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { Button, buttonVariants } from './button'
import { Checkbox } from './checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Input } from './input'
import { Label } from './label'
import { Switch } from './switch'

describe('cn', () => {
  it('merges conflicting tailwind classes, last wins', () => {
    expect(cn('px-2 py-1', 'px-4', false && 'hidden')).toBe('py-1 px-4')
  })
})

describe('Button', () => {
  it('applies variant and size classes', () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button.className).toContain('bg-destructive')
    expect(button.className).toContain('h-8')
    expect(button.dataset.slot).toBe('button')
  })

  it('renders the child element with asChild', () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link.className).toContain(buttonVariants({ variant: 'default' }).split(' ')[0])
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('Badge', () => {
  it('renders outline variant', () => {
    render(<Badge variant="outline">New</Badge>)
    expect(screen.getByText('New').className).toContain('text-foreground')
  })
})

describe('form controls', () => {
  it('checkbox toggles through a label', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept</Label>
      </div>,
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('data-state')).toBe('unchecked')
    await user.click(screen.getByText('Accept'))
    expect(checkbox.getAttribute('data-state')).toBe('checked')
  })

  it('switch flips state and input forwards props', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Switch aria-label="Wifi" />
        <Input placeholder="Name" aria-invalid />
      </div>,
    )
    const toggle = screen.getByRole('switch', { name: 'Wifi' })
    await user.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByPlaceholderText('Name').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('overlays', () => {
  it('dialog opens from its trigger and exposes title and description', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes here.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe(screen.getByText('Edit profile').id)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('dropdown menu lists its items when opened', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Log out' }).dataset.variant).toBe('destructive')
  })
})
