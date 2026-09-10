import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { Dropzone, type DropzoneRejection } from './dropzone'

function makeFile(name: string, type: string, size = 8) {
  const file = new File(['x'.repeat(size)], name, { type })
  // jsdom sizes the blob for us, but a huge file would be a huge string.
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/** jsdom has no DataTransfer, so drops carry the shape the component actually reads. */
function dataTransfer(files: File[]) {
  return {
    files,
    items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    types: ['Files'],
    dropEffect: 'none',
  }
}

/** What a spy was last handed, typed, so a missing call reads as an empty list. */
const filesFrom = (spy: Mock): File[] => (spy.mock.lastCall?.[0] ?? []) as File[]
const rejectionsFrom = (spy: Mock): DropzoneRejection[] =>
  (spy.mock.lastCall?.[0] ?? []) as DropzoneRejection[]

const zone = () => document.querySelector('[data-slot=dropzone]') as HTMLElement
const input = () => document.querySelector('[data-slot=dropzone-input]') as HTMLInputElement

const IMAGE = makeFile('shot.png', 'image/png')
const DOC = makeFile('notes.pdf', 'application/pdf')

beforeEach(() => {
  // Previews hold on to object URLs, so the component has to hand them back.
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Dropzone', () => {
  it('renders a prompt and what it will take', () => {
    render(<Dropzone accept="image/png" maxSize={1024} />)
    expect(screen.getByText(/Drop a file here/)).toBeTruthy()
    const hint = document.querySelector('[data-slot=dropzone-hint]')
    expect(hint?.textContent).toContain('image/png')
    expect(hint?.textContent).toContain('1 kB')
    expect(zone().getAttribute('aria-describedby')).toBe(hint?.id)
  })

  it('hands a dropped file over', () => {
    const onFiles = vi.fn()
    render(<Dropzone onFiles={onFiles} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })

    expect(onFiles).toHaveBeenCalledTimes(1)
    expect(filesFrom(onFiles)).toEqual([IMAGE])
  })

  it('stops the browser from opening the file itself', () => {
    render(<Dropzone />)
    // Without preventDefault on dragover the drop never reaches the page at all.
    const over = fireEvent.dragOver(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(over).toBe(false)
    const drop = fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(drop).toBe(false)
  })

  it('turns away a file whose type is not accepted, and says why', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(<Dropzone accept="image/*" onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([DOC]) })

    expect(onFiles).not.toHaveBeenCalled()
    expect(onRejected).toHaveBeenCalledTimes(1)
    const rejections = rejectionsFrom(onRejected)
    expect(rejections).toHaveLength(1)
    expect(rejections[0]?.file).toBe(DOC)
    expect(rejections[0]?.reason).toBe('type')
    expect(rejections[0]?.message).toContain('notes.pdf')
  })

  it('takes a file matched by its extension', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(<Dropzone accept=".pdf,.txt" onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([DOC]) })

    expect(onRejected).not.toHaveBeenCalled()
    expect(filesFrom(onFiles)).toEqual([DOC])
  })

  it('turns away a file over maxSize, and says why', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    const big = makeFile('big.png', 'image/png', 4096)
    render(<Dropzone maxSize={1024} onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([big]) })

    expect(onFiles).not.toHaveBeenCalled()
    expect(rejectionsFrom(onRejected)[0]?.reason).toBe('size')
    expect(rejectionsFrom(onRejected)[0]?.message).toContain('1 kB')
  })

  it('splits a mixed drop into what it took and what it did not', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(<Dropzone multiple accept="image/*" onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE, DOC]) })

    expect(filesFrom(onFiles)).toEqual([IMAGE])
    expect(rejectionsFrom(onRejected)).toHaveLength(1)
    expect(rejectionsFrom(onRejected)[0]?.file).toBe(DOC)
  })

  it('keeps one file when it was not told to take several', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    const second = makeFile('other.png', 'image/png')
    render(<Dropzone onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE, second]) })

    expect(filesFrom(onFiles)).toEqual([IMAGE])
    expect(rejectionsFrom(onRejected)[0]?.reason).toBe('count')
  })

  it('stops at maxFiles', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    const files = [
      makeFile('a.png', 'image/png'),
      makeFile('b.png', 'image/png'),
      makeFile('c.png', 'image/png'),
    ]
    render(<Dropzone multiple maxFiles={2} onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer(files) })

    expect(filesFrom(onFiles)).toHaveLength(2)
    expect(rejectionsFrom(onRejected)).toHaveLength(1)
    expect(rejectionsFrom(onRejected)[0]?.reason).toBe('count')
  })

  it('does not flicker when the pointer crosses into a child', () => {
    render(
      <Dropzone>
        <span data-testid="child">Drop here</span>
      </Dropzone>,
    )
    const child = screen.getByTestId('child')

    fireEvent.dragEnter(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(true)

    // Entering the child fires a leave on the parent. The highlight has to stay put.
    fireEvent.dragEnter(child, { dataTransfer: dataTransfer([IMAGE]) })
    fireEvent.dragLeave(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(true)

    // Only leaving for real drops the highlight.
    fireEvent.dragLeave(child, { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(false)
  })

  it('drops the highlight once the file lands', () => {
    render(<Dropzone />)
    fireEvent.dragEnter(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(true)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(false)
  })

  it('opens the picker when it is clicked', async () => {
    const user = userEvent.setup()
    render(<Dropzone />)
    const click = vi.spyOn(input(), 'click')

    await user.click(zone())

    expect(click).toHaveBeenCalledTimes(1)
  })

  it('opens the picker on enter and on space', async () => {
    const user = userEvent.setup()
    render(<Dropzone />)
    const click = vi.spyOn(input(), 'click')

    zone().focus()
    expect(document.activeElement).toBe(zone())
    await user.keyboard('{Enter}')
    expect(click).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(click).toHaveBeenCalledTimes(2)
  })

  it('keeps the file input out of sight without taking it out of the page', () => {
    render(<Dropzone accept="image/png" multiple />)
    const field = input()
    expect(field.className).toContain('sr-only')
    expect(field.style.display).not.toBe('none')
    expect(field.getAttribute('aria-hidden')).toBeNull()
    expect(field.accept).toBe('image/png')
    expect(field.multiple).toBe(true)
  })

  it('runs files picked from the input through the same checks', () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(<Dropzone accept="image/*" onFiles={onFiles} onRejected={onRejected} />)

    fireEvent.change(input(), { target: { files: [IMAGE] } })
    expect(filesFrom(onFiles)).toEqual([IMAGE])

    fireEvent.change(input(), { target: { files: [DOC] } })
    expect(rejectionsFrom(onRejected)[0]?.reason).toBe('type')
  })

  it('does nothing at all when it is disabled', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(<Dropzone disabled onFiles={onFiles} onRejected={onRejected} />)
    const click = vi.spyOn(input(), 'click')

    expect(zone().getAttribute('aria-disabled')).toBe('true')
    expect(zone().getAttribute('tabindex')).toBe('-1')

    fireEvent.dragEnter(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(zone().hasAttribute('data-over')).toBe(false)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(onFiles).not.toHaveBeenCalled()
    expect(onRejected).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    fireEvent.click(zone())
    expect(click).not.toHaveBeenCalled()
  })

  it('says what happened, out loud', () => {
    render(<Dropzone accept="image/*" />)
    const status = document.querySelector('[data-slot=dropzone-status]') as HTMLElement
    expect(status.getAttribute('aria-live')).toBe('polite')

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(status.textContent).toContain('1 file added')

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([DOC]) })
    expect(status.textContent).toContain('1 file rejected')
    expect(status.textContent).toContain('notes.pdf')
  })

  it('previews the images it took and lets go of the URLs afterwards', () => {
    const { unmount } = render(<Dropzone />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })

    expect(URL.createObjectURL).toHaveBeenCalledWith(IMAGE)
    const thumbnail = screen.getByRole('img', { name: 'shot.png' })
    expect(thumbnail.getAttribute('src')).toBe('blob:preview')

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('revokes the old URL when a new file replaces it', () => {
    render(<Dropzone />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([makeFile('two.png', 'image/png')]) })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('shows the extension instead of a thumbnail for anything that is not an image', () => {
    render(<Dropzone />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([DOC]) })

    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('notes.pdf')).toBeTruthy()
  })

  it('skips the previews when it is told not to show any', () => {
    render(<Dropzone preview={false} />)

    fireEvent.drop(zone(), { dataTransfer: dataTransfer([IMAGE]) })

    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot=dropzone-preview]')).toBeNull()
  })
})
