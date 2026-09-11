import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Avatar, AvatarFallback } from './avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Progress } from './progress'
import { Separator } from './separator'
import { Skeleton } from './skeleton'
import { Textarea } from './textarea'

describe('Alert', () => {
  // An alert nobody is told about is just a coloured box: the role is the whole point.
  it('announces itself', () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something happened.</AlertDescription>
      </Alert>,
    )
    const alert = screen.getByRole('alert')
    expect(alert.dataset.slot).toBe('alert')
    expect(alert.textContent).toContain('Heads up')
    expect(alert.textContent).toContain('Something happened.')
  })

  it('carries its variant into the classes', () => {
    render(<Alert variant="destructive">Broken</Alert>)
    expect(screen.getByRole('alert').className).toContain('destructive')
  })
})

describe('Avatar', () => {
  // jsdom loads no images, so the fallback is what actually renders here, which is the same
  // thing a reader sees on a broken or slow image.
  it('falls back to the initials', () => {
    render(
      <Avatar>
        <AvatarFallback>MO</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText('MO')).toBeTruthy()
  })
})

describe('Card', () => {
  it('renders its parts and keeps the title readable as a heading', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    )
    expect(screen.getByText('Title')).toBeTruthy()
    expect(screen.getByText('Description')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
  })
})

describe('Progress', () => {
  it('reports how far along it is', () => {
    render(<Progress value={40} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('40')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('is indeterminate with no value, rather than silently zero', () => {
    render(<Progress />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBeNull()
  })
})

describe('Separator', () => {
  // Decorative by default: a line between two things is not a landmark, and announcing every
  // one of them turns a page into a list of rules.
  it('is hidden from assistive tech unless asked otherwise', () => {
    const { container } = render(<Separator />)
    const separator = container.querySelector('[data-slot="separator"]')
    // `role="none"` rather than `aria-hidden`: it takes the element out of the accessibility
    // tree just the same, and it is what the primitive underneath does.
    expect(separator?.getAttribute('role')).toBe('none')
  })

  it('becomes a real separator when it is not decorative', () => {
    render(<Separator decorative={false} />)
    expect(screen.getByRole('separator')).toBeTruthy()
  })
})

describe('Skeleton', () => {
  it('renders a placeholder that carries its slot', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />)
    const skeleton = container.querySelector('[data-slot="skeleton"]')
    expect(skeleton).toBeTruthy()
    expect(skeleton?.className).toContain('w-20')
  })
})

describe('Textarea', () => {
  it('takes what is typed into it', async () => {
    render(<Textarea placeholder="Notes" />)
    const field = screen.getByPlaceholderText('Notes')
    await userEvent.type(field, 'hello')
    expect((field as HTMLTextAreaElement).value).toBe('hello')
  })

  it('passes invalid state through for styling and for screen readers', () => {
    render(<Textarea placeholder="Notes" aria-invalid />)
    expect(screen.getByPlaceholderText('Notes').getAttribute('aria-invalid')).toBe('true')
  })
})
