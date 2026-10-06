import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MountainIcon } from 'lucide-react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Auth01 } from './auth-01'
import { Cta01 } from './cta-01'
import { Footer01 } from './footer-01'
import { Navbar01 } from './navbar-01'

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
})

/** A promise the test settles by hand, to look at the pending state in between. */
function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('Navbar01', () => {
  it('renders a banner with the wordmark, the main links and both actions', () => {
    const { container } = render(<Navbar01 />)
    const header = screen.getByRole('banner')
    expect(header.dataset.slot).toBe('block-navbar-01')
    expect(header.className).toContain('@container')
    expect(header.className).not.toContain('sticky')
    expect(screen.getByRole('link', { name: 'Acme' }).textContent).toBe('AAcme')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Product', 'Solutions', 'Pricing', 'Customers', 'Changelog'])
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start free' })).toBeTruthy()
    // Container queries, not viewport breakpoints.
    expect(container.innerHTML).not.toMatch(/\s(sm|md|lg):/)
  })

  it('takes custom links, marks the current page, sticks and hides actions with null', () => {
    render(
      <Navbar01
        sticky
        brand={{ name: 'Summit', href: '/', logo: <MountainIcon data-testid="logo" /> }}
        links={[
          { label: 'Features', href: '/features', current: true },
          { label: 'Docs', href: '/docs' },
        ]}
        secondaryAction={null}
        primaryAction={{ label: 'Join', href: '/join' }}
      />,
    )
    const header = screen.getByRole('banner')
    expect(header.className).toContain('sticky')
    expect(header.className).toContain('z-(--z-sticky,40)')
    const wordmark = screen.getByRole('link', { name: 'Summit' })
    expect(wordmark.getAttribute('href')).toBe('/')
    expect(within(wordmark).getByTestId('logo')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Features' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('aria-current')).toBe(false)
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Join' }).getAttribute('href')).toBe('/join')
  })

  it('opens the menu panel from the button, closes it with Escape and after picking a link', async () => {
    const user = userEvent.setup()
    render(<Navbar01 />)
    const button = screen.getByRole('button', { name: 'Menu' })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    const panel = screen.getByRole('dialog', { name: 'Menu' })
    const links = within(panel).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual([
      'Product',
      'Solutions',
      'Pricing',
      'Customers',
      'Changelog',
      'Sign in',
      'Start free',
    ])

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)

    await user.click(button)
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Pricing' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the menu from the keyboard', async () => {
    const user = userEvent.setup()
    render(<Navbar01 menuLabel="Open navigation" />)
    screen.getByRole('button', { name: 'Open navigation' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'Open navigation' })).toBeTruthy()
  })

  it('shows a monogram when the brand has no logo', () => {
    render(<Navbar01 brand={{ name: 'Quill', href: '/' }} links={[]} />)
    expect(screen.getByRole('link', { name: 'Quill' }).textContent).toBe('QQuill')
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('shows the brand it is given in place of the default', () => {
    render(<Navbar01 brand={{ name: 'Globex' }} />)
    const wordmark = screen.getByRole('link', { name: 'Globex' })
    expect(wordmark.getAttribute('href')).toBe('/')
    expect(screen.getByRole('banner').textContent).not.toContain('Acme')
  })
})

describe('Footer01', () => {
  it('renders a contentinfo landmark with brand, socials, columns, signup and legal links', () => {
    render(<Footer01 />)
    const footer = screen.getByRole('contentinfo')
    expect(footer.dataset.slot).toBe('block-footer-01')
    expect(screen.getByRole('link', { name: 'Acme' })).toBeTruthy()
    for (const label of ['GitHub', 'Community', 'RSS feed']) {
      expect(screen.getByRole('link', { name: label })).toBeTruthy()
    }
    const nav = screen.getByRole('navigation', { name: 'Footer' })
    expect(
      within(nav)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['Product', 'Resources', 'Company'])
    expect(within(nav).getAllByRole('link')).toHaveLength(12)
    expect(screen.getByRole('region', { name: 'Notes from the team' })).toBeTruthy()
    expect(screen.getByLabelText('Email address')).toBeTruthy()
    const legal = screen.getByRole('navigation', { name: 'Legal' })
    expect(
      within(legal)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Privacy', 'Terms', 'Cookies'])
    expect(screen.getByText(`© ${new Date().getFullYear()} Acme, Inc.`)).toBeTruthy()
  })

  it('puts the brand it is given in the wordmark, the watermark and the copyright', () => {
    const { container } = render(<Footer01 brand={{ name: 'Globex' }} />)
    expect(screen.getByRole('link', { name: 'Globex' }).getAttribute('href')).toBe('/')
    const watermark = container.querySelector('[aria-hidden].select-none')
    expect(watermark?.textContent).toBe('Globex')
    expect(screen.getByText(`© ${new Date().getFullYear()} Globex`)).toBeTruthy()
    expect(screen.getByRole('contentinfo').textContent).not.toContain('Acme')
  })

  it('uses the legal name for the copyright when there is one', () => {
    render(<Footer01 brand={{ name: 'Globex', legalName: 'Globex Corporation' }} />)
    expect(screen.getByText(`© ${new Date().getFullYear()} Globex Corporation`)).toBeTruthy()
  })

  it('subscribes with a pending state and thanks in place', async () => {
    const user = userEvent.setup()
    const pending = deferred()
    const onSubscribe = vi.fn(() => pending.promise)
    render(<Footer01 onSubscribe={onSubscribe} />)
    await user.type(screen.getByLabelText('Email address'), 'ana@example.com')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    expect(onSubscribe).toHaveBeenCalledWith('ana@example.com')
    expect((screen.getByRole('button', { name: 'Subscribe' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    await act(async () => pending.resolve())
    expect(screen.getByText('You are on the list. Check your inbox to confirm.')).toBeTruthy()
    expect(screen.queryByLabelText('Email address')).toBeNull()
  })

  it('shows the error and keeps the form when subscribing fails', async () => {
    const user = userEvent.setup()
    render(
      <Footer01
        onSubscribe={() => Promise.reject(new Error('nope'))}
        newsletter={{ title: 'Stay close', button: 'Join', error: 'Could not join.' }}
      />,
    )
    await user.type(screen.getByLabelText('Email address'), 'ana@example.com')
    await user.click(screen.getByRole('button', { name: 'Join' }))
    expect(screen.getByRole('alert').textContent).toBe('Could not join.')
    expect(screen.getByLabelText('Email address').getAttribute('aria-invalid')).toBe('true')
  })

  it('takes custom columns and hides the signup and watermark', () => {
    const { container } = render(
      <Footer01
        brand={{ name: 'Summit', href: '/' }}
        socials={[]}
        columns={[{ title: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] }]}
        newsletter={null}
        watermark={false}
        copyright="© Summit"
        legal={[]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Pricing' }).getAttribute('href')).toBe('/pricing')
    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Legal' })).toBeNull()
    expect(screen.getByText('© Summit')).toBeTruthy()
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(1) // only the brand mark
  })
})

describe('Cta01', () => {
  it('renders a labelled section with a heading, both actions and a note', () => {
    const { container } = render(<Cta01 />)
    const section = screen.getByRole('region', { name: 'Your next launch starts here' })
    expect(section.dataset.slot).toBe('block-cta-01')
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start free trial' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Talk to sales' })).toBeTruthy()
    expect(screen.getByText('Free for 14 days. No card needed.')).toBeTruthy()
    expect(container.querySelector('[data-slot=aurora]')).toBeTruthy()
    expect(container.querySelector('[data-slot=sonar]')).toBeTruthy()
    expect(container.innerHTML).not.toMatch(/\s(sm|md|lg):/)
  })

  it('takes custom copy and hides parts with null', () => {
    const { container } = render(
      <Cta01
        icon={null}
        title="Plan next week"
        description="Start with your calendar."
        primaryAction={{ label: 'Start free', href: '/signup' }}
        secondaryAction={null}
        note={null}
      />,
    )
    expect(screen.getByRole('region', { name: 'Plan next week' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start free' }).getAttribute('href')).toBe('/signup')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(container.querySelector('[data-slot=sonar]')).toBeNull()
    expect(screen.queryByText('Free for 14 days. No card needed.')).toBeNull()
  })
})

describe('Auth01', () => {
  it('renders a labelled form with fields, links, providers and the quote panel', () => {
    render(<Auth01 />)
    const section = screen.getByRole('region', { name: 'Welcome back' })
    expect(section.dataset.slot).toBe('block-auth-01')
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeTruthy()
    expect(screen.getByLabelText('Email').getAttribute('type')).toBe('email')
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password')
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Create an account' })).toBeTruthy()
    const aside = screen.getByRole('complementary')
    expect(within(aside).getByText('Rosa Delgado')).toBeTruthy()
    expect(within(aside).getByText('RD')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Acme' })).toBeTruthy()
    expect(screen.getByText(/New to Acme\?/)).toBeTruthy()
  })

  it('puts the brand it is given in the wordmark and the sign up line', () => {
    render(<Auth01 brand={{ name: 'Globex' }} />)
    expect(screen.getByRole('link', { name: 'Globex' }).getAttribute('href')).toBe('/')
    expect(screen.getByText(/New to Globex\?/)).toBeTruthy()
    expect(screen.getByRole('region').textContent).not.toContain('Acme')
  })

  it('submits the values with a pending state', async () => {
    const user = userEvent.setup()
    const pending = deferred()
    const onSubmit = vi.fn(() => pending.promise)
    render(<Auth01 onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('Email'), ' ana@example.com ')
    await user.type(screen.getByLabelText('Password'), 'hunter22')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'hunter22' })
    const button = screen.getByRole('button', { name: 'Signing in…' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toHaveProperty(
      'disabled',
      true,
    )
    await act(async () => pending.resolve())
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveProperty('disabled', false)
  })

  it('shows the thrown message as an alert', async () => {
    const user = userEvent.setup()
    render(
      <Auth01
        onSubmit={() => Promise.reject(new Error('That email and password do not match.'))}
      />,
    )
    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert').textContent).toBe('That email and password do not match.')
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe('true')
  })

  it('reveals the password and reports providers', async () => {
    const user = userEvent.setup()
    const onProvider = vi.fn()
    render(<Auth01 onProvider={onProvider} />)
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text')
    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(onProvider).toHaveBeenCalledWith('google')
  })

  it('takes custom copy and hides parts with null or an empty list', () => {
    render(
      <Auth01
        title="Sign in to Summit"
        forgotPasswordHref={null}
        providers={[]}
        signUp={null}
        testimonial={null}
        labels={{ email: 'Work email', submit: 'Continue' }}
      />,
    )
    expect(screen.getByRole('region', { name: 'Sign in to Summit' })).toBeTruthy()
    expect(screen.getByLabelText('Work email')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Forgot password?' })).toBeNull()
    expect(screen.queryByText('or')).toBeNull()
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1) // the wordmark
  })
})
