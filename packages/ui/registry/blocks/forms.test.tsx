import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Contact01 } from './contact-01'
import { FileUpload01, type UploadContext } from './file-upload-01'
import { SignIn01 } from './sign-in-01'

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

afterEach(() => {
  vi.useRealTimers()
})

const step = () => document.querySelector<HTMLElement>('[data-slot=block-sign-in-01]')?.dataset.step

describe('SignIn01', () => {
  it('asks for a real address before sending a code', async () => {
    const user = userEvent.setup()
    const onRequestCode = vi.fn()
    render(<SignIn01 onRequestCode={onRequestCode} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sign in to Acme')
    expect(screen.getByRole('link', { name: 'Acme' })).toBeTruthy()
    await user.type(screen.getByLabelText('Work email'), 'ada@{Enter}')
    expect(screen.getByRole('alert').textContent).toMatch(/Enter an email address/)
    expect(screen.getByLabelText('Work email').getAttribute('aria-invalid')).toBe('true')
    expect(onRequestCode).not.toHaveBeenCalled()
    expect(step()).toBe('email')
  })

  it('goes from email to code to signed in, shaking off a wrong code', async () => {
    const user = userEvent.setup()
    const onRequestCode = vi.fn()
    const onVerify = vi.fn(async (_email: string, code: string) => {
      if (code !== '424242') throw new Error('Wrong code.')
    })
    render(<SignIn01 onRequestCode={onRequestCode} onVerify={onVerify} continueHref="/app" />)
    await user.type(screen.getByLabelText('Work email'), 'ada@example.com{Enter}')
    expect(onRequestCode).toHaveBeenCalledWith('ada@example.com')
    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeTruthy()
    expect(screen.getByText(/sent to ada@example.com/)).toBeTruthy()
    const code = screen.getByLabelText('Verification code')
    expect(document.activeElement).toBe(code)

    // Filling the last box checks the code without a press of the button.
    await user.type(code, '111111')
    expect(onVerify).toHaveBeenLastCalledWith('ada@example.com', '111111')
    expect((await screen.findByRole('alert')).textContent).toBe('Wrong code.')
    const fresh = screen.getByLabelText('Verification code') as HTMLInputElement
    expect(fresh.value).toBe('')

    await user.type(fresh, '424242')
    expect(await screen.findByRole('heading', { name: 'You’re in' })).toBeTruthy()
    expect(step()).toBe('done')
    expect(screen.getByText('Signed in as ada@example.com.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Continue to dashboard/ }).getAttribute('href')).toBe(
      '/app',
    )
    await user.click(screen.getByRole('button', { name: 'Sign in with another account' }))
    expect(step()).toBe('email')
  })

  it('goes back to the email and counts down before a resend', async () => {
    vi.useFakeTimers()
    const onRequestCode = vi.fn()
    render(
      <SignIn01
        defaultStep="code"
        defaultEmail="ada@example.com"
        resendAfter={2}
        onRequestCode={onRequestCode}
      />,
    )
    const resend = screen.getByRole('button', { name: 'Resend in 2s' })
    expect(resend.hasAttribute('disabled')).toBe(true)
    act(() => vi.advanceTimersByTime(1000))
    expect(resend.textContent).toBe('Resend in 1s')
    act(() => vi.advanceTimersByTime(1000))
    expect(resend.textContent).toBe('Resend code')
    await act(async () => {
      fireEvent.click(resend)
    })
    expect(onRequestCode).toHaveBeenCalledWith('ada@example.com')
    expect(screen.getByText('A new code is on its way.')).toBeTruthy()
    expect(resend.textContent).toBe('Resend in 2s')

    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(step()).toBe('email')
    expect((screen.getByLabelText('Work email') as HTMLInputElement).value).toBe('ada@example.com')
  })

  it('puts the brand it is given on the mark and in the title', () => {
    const { rerender } = render(<SignIn01 brand={{ name: 'Globex' }} />)
    expect(screen.getByRole('link', { name: 'Globex' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sign in to Globex')
    expect(screen.getByRole('region').textContent).not.toContain('Acme')
    rerender(<SignIn01 brand={{ name: 'Globex' }} labels={{ emailTitle: 'Entrar a {brand}' }} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Entrar a Globex')
  })
})

describe('Contact01', () => {
  it('flags every missing field and sends nothing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Contact01 offices={[]} onSubmit={onSubmit} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Send message/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    const name = screen.getByLabelText('Name')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('Work email').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('How can we help?').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText(/Company/).getAttribute('aria-invalid')).toBeNull()
    expect(document.activeElement).toBe(name)
    expect(screen.getAllByText('This field is required.')).toHaveLength(3)

    await user.type(name, 'A')
    expect(name.getAttribute('aria-invalid')).toBeNull()
    await user.type(screen.getByLabelText('Work email'), 'nope')
    expect(screen.getByText(/Enter an email address/)).toBeTruthy()
    await user.type(screen.getByLabelText('How can we help?'), 'Too short')
    expect(screen.getByText(/at least 20 characters/)).toBeTruthy()
  })

  it('writes the default addresses and description for the brand', () => {
    const { rerender } = render(<Contact01 offices={[]} />)
    expect(screen.getByRole('link', { name: 'sales@acme.com' }).getAttribute('href')).toBe(
      'mailto:sales@acme.com',
    )
    expect(screen.getByText(/A real person at Acme reads/)).toBeTruthy()

    rerender(<Contact01 offices={[]} brand={{ name: 'Globex' }} />)
    expect(screen.getByRole('link', { name: 'sales@globex.com' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'press@globex.com' })).toBeTruthy()
    expect(screen.getByText(/A real person at Globex reads/)).toBeTruthy()
    expect(screen.getByRole('region').textContent).not.toMatch(/acme/i)

    rerender(<Contact01 offices={[]} brand={{ name: 'Globex', domain: 'globex.example' }} />)
    expect(screen.getByRole('link', { name: 'sales@globex.example' })).toBeTruthy()
  })

  it('sends the values and turns into a confirmation', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Contact01 offices={[]} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Work email'), 'ada@example.com')
    await user.type(
      screen.getByLabelText('How can we help?'),
      'We would like a demo for twelve people.',
    )
    await user.click(screen.getByRole('button', { name: /Send message/ }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: '',
      message: 'We would like a demo for twelve people.',
    })
    const done = await screen.findByRole('status')
    expect(done.textContent).toContain('Message sent')
    expect(done.textContent).toContain('Thanks, Ada. We will reply to ada@example.com')
    expect(document.activeElement).toBe(done)
    await user.click(screen.getByRole('button', { name: 'Send another message' }))
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
  })

  it('keeps the message when sending fails', async () => {
    const user = userEvent.setup()
    render(
      <Contact01
        offices={[]}
        channels={[]}
        onSubmit={() => Promise.reject(new Error('Mail server down.'))}
      />,
    )
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Work email'), 'ada@example.com')
    await user.type(screen.getByLabelText('How can we help?'), 'A message long enough to send.')
    await user.click(screen.getByRole('button', { name: /Send message/ }))
    expect((await screen.findByRole('alert')).textContent).toBe('Mail server down.')
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada')
  })

  it('shows each office’s local time, ticking, and whether it is open', () => {
    vi.useFakeTimers()
    // A Wednesday, 10:59:30 in Lisbon (UTC+1 in summer) and 18:59:30 in Tokyo.
    vi.setSystemTime(new Date('2026-07-15T09:59:30Z'))
    render(
      <Contact01
        locale="en-GB"
        channels={[]}
        offices={[
          { city: 'Lisbon', address: 'Rua 1', timeZone: 'Europe/Lisbon' },
          { city: 'Tokyo', address: 'Meguro', timeZone: 'Asia/Tokyo' },
        ]}
      />,
    )
    const times = () =>
      [...document.querySelectorAll('[data-slot=office-time]')].map((t) => t.textContent)
    expect(times()).toEqual(['10:59', '18:59'])
    const lisbon = screen.getByRole('heading', { name: 'Lisbon' }).closest('article') as HTMLElement
    const tokyo = screen.getByRole('heading', { name: 'Tokyo' }).closest('article') as HTMLElement
    expect(within(lisbon).getByText('Open now')).toBeTruthy()
    act(() => vi.advanceTimersByTime(31_000))
    expect(times()).toEqual(['11:00', '19:00'])
    expect(within(tokyo).getByText('Closed')).toBeTruthy()
  })
})

function makeFile(name: string, type: string, size = 8) {
  const file = new File(['x'.repeat(Math.min(size, 64))], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/** jsdom has no DataTransfer, so the drop carries the shape the dropzone reads. */
const drop = (files: File[]) =>
  fireEvent.drop(document.querySelector('[data-slot=dropzone]') as HTMLElement, {
    dataTransfer: { files, types: ['Files'] },
  })

const row = (name: string) =>
  screen.getByText(name, { selector: 'p' }).closest('li') as HTMLLIElement

describe('FileUpload01', () => {
  it('starts with the seeded files in each state and a total', () => {
    render(<FileUpload01 />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(screen.getByRole('region', { name: heading.textContent ?? '' })).toBeTruthy()
    expect(row('brand-guidelines.pdf').dataset.status).toBe('done')
    expect(row('launch-hero.png').dataset.status).toBe('uploading')
    expect(within(row('q3-numbers.xlsx')).getByRole('button', { name: /Retry/ })).toBeTruthy()
    const rejected = row('demo-recording.mov')
    expect(rejected.dataset.status).toBe('rejected')
    expect(within(rejected).getByText('Larger than 10 MB.')).toBeTruthy()
    expect(within(rejected).queryByRole('button', { name: /Retry/ })).toBeNull()
    expect(screen.getByText('1 of 3 uploaded')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Total progress' })).toBeTruthy()
  })

  it('simulates uploads when no upload function is given', async () => {
    vi.useFakeTimers()
    render(<FileUpload01 />)
    await act(async () => vi.advanceTimersByTime(20_000))
    expect(row('launch-hero.png').dataset.status).toBe('done')
    await act(async () => {
      fireEvent.click(within(row('q3-numbers.xlsx')).getByRole('button', { name: /Retry/ }))
    })
    expect(row('q3-numbers.xlsx').dataset.status).toBe('uploading')
    await act(async () => vi.advanceTimersByTime(20_000))
    expect(screen.getByText('All files uploaded')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear finished' }))
    expect(screen.getByText('No files yet.')).toBeTruthy()
  })

  it('sends dropped files through upload, following yielded progress', async () => {
    const onUploaded = vi.fn()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const upload = vi.fn(async function* () {
      yield 0.5
      await gate
      yield 1
    })
    render(<FileUpload01 defaultFiles={[]} upload={upload} onUploaded={onUploaded} />)
    drop([makeFile('notes.pdf', 'application/pdf', 2048)])
    expect(upload).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(within(row('notes.pdf')).getByText('50%')).toBeTruthy())
    await act(async () => release())
    await waitFor(() => expect(row('notes.pdf').dataset.status).toBe('done'))
    expect(onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'notes.pdf', status: 'done' }),
    )
    expect(document.querySelector('[data-slot=file-upload-status]')?.textContent).toBe(
      'notes.pdf: Uploaded',
    )
  })

  it('marks failures, retries them and turns away the wrong type and size', async () => {
    let attempts = 0
    const upload = vi.fn(async (_file: File, { onProgress }: UploadContext) => {
      attempts++
      onProgress(0.4)
      if (attempts === 1) throw new Error('Server said no.')
    })
    render(<FileUpload01 defaultFiles={[]} upload={upload} maxSize={1024} />)
    drop([
      makeFile('a.png', 'image/png', 100),
      makeFile('huge.png', 'image/png', 4096),
      makeFile('run.exe', 'application/x-msdownload', 10),
    ])
    expect(within(row('huge.png')).getByText('Larger than 1 KB.')).toBeTruthy()
    expect(within(row('run.exe')).getByText('This type of file is not allowed.')).toBeTruthy()
    await waitFor(() => expect(within(row('a.png')).getByText('Server said no.')).toBeTruthy())
    fireEvent.click(within(row('a.png')).getByRole('button', { name: /Retry/ }))
    await waitFor(() => expect(row('a.png').dataset.status).toBe('done'))
    expect(upload).toHaveBeenCalledTimes(2)
  })

  it('cancels an upload when its file is removed', async () => {
    let signal!: AbortSignal
    const upload = vi.fn(
      (_file: File, context: UploadContext) =>
        new Promise<void>(() => {
          signal = context.signal
        }),
    )
    render(<FileUpload01 defaultFiles={[]} upload={upload} />)
    drop([makeFile('slow.pdf', 'application/pdf')])
    expect(signal.aborted).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Remove slow.pdf' }))
    expect(signal.aborted).toBe(true)
    expect(screen.queryByText('slow.pdf')).toBeNull()
  })
})
