import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Gallery, Lightbox } from './gallery'

const images = [
  { src: '/a.png', alt: 'A cat' },
  { src: '/b.png', alt: 'A dog' },
  { src: '/c.png', alt: 'A bird' },
]

describe('Gallery', () => {
  // The cell is a button and the picture inside it has an empty alt on purpose: the name lives
  // on the button, so a screen reader reads it once instead of twice.
  it('renders one named cell per image', () => {
    render(<Gallery images={images} />)
    expect(screen.getByRole('button', { name: 'Open A cat' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open A dog' })).toBeTruthy()
    expect(screen.getAllByRole('button').length).toBe(images.length)
  })

  it('falls back to a position when an image has no alt', () => {
    render(<Gallery images={[{ src: '/x.png' }]} />)
    expect(screen.getByRole('button', { name: 'Open image 1' })).toBeTruthy()
  })

  it('opens the lightbox on the image that was picked', async () => {
    render(<Gallery images={images} />)
    expect(screen.queryByRole('dialog')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Open A dog' }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByLabelText('Close')).toBeTruthy()
    expect(screen.getByAltText('A dog')).toBeTruthy()
  })

  // A grid of pictures that only opens under a mouse is a grid a keyboard user cannot read.
  it('opens from the keyboard alone', async () => {
    render(<Gallery images={images} />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open A cat' }))

    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('moves to the next image with the arrow keys', async () => {
    render(<Gallery images={images} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open A cat' }))
    await screen.findByRole('dialog')
    expect(screen.getByAltText('A cat')).toBeTruthy()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByAltText('A dog')).toBeTruthy()
  })

  it('closes on escape', async () => {
    render(<Gallery images={images} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open A cat' }))
    await screen.findByRole('dialog')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Gallery grid', () => {
  const grid = (container: HTMLElement) =>
    container.querySelector('[data-slot="gallery-grid"]') as HTMLElement
  const root = (container: HTMLElement) =>
    container.querySelector('[data-slot="gallery"]') as HTMLElement

  // Columns follow the gallery's own width, so it is a size container and every breakpoint
  // given gets a class that reads its count; one left out has none, and the one below holds.
  it('sets columns per container breakpoint', () => {
    const { container } = render(<Gallery images={images} columns={{ base: 1, sm: 2, lg: 4 }} />)
    expect(root(container).className).toContain('@container')
    const style = root(container).style
    expect(style.getPropertyValue('--gallery-cols-base')).toBe('repeat(1, minmax(0, 1fr))')
    expect(style.getPropertyValue('--gallery-cols-sm')).toBe('repeat(2, minmax(0, 1fr))')
    expect(style.getPropertyValue('--gallery-cols-md')).toBe('')
    expect(style.getPropertyValue('--gallery-cols-lg')).toBe('repeat(4, minmax(0, 1fr))')
    const classes = grid(container).className
    expect(classes).toContain('grid-cols-(--gallery-cols-base)')
    expect(classes).toContain('@sm:grid-cols-(--gallery-cols-sm)')
    expect(classes).not.toContain('--gallery-cols-md')
    expect(classes).toContain('@3xl:grid-cols-(--gallery-cols-lg)')
  })

  it('keeps a number as the old shorthand: fewer when narrow, all of them when wide', () => {
    const { container } = render(<Gallery images={images} columns={4} />)
    const style = root(container).style
    expect(style.getPropertyValue('--gallery-cols-base')).toBe('repeat(2, minmax(0, 1fr))')
    expect(style.getPropertyValue('--gallery-cols-md')).toBe('repeat(4, minmax(0, 1fr))')
  })

  it('takes gap, aspect, radius and zoom', () => {
    const { container } = render(
      <Gallery images={images} gap="1.5rem" aspect="4 / 3" radius="0px" zoom={1.1} />,
    )
    expect(grid(container).style.gap).toBe('1.5rem')
    const cell = screen.getByRole('button', { name: 'Open A cat' })
    expect(cell.style.aspectRatio).toBe('4 / 3')
    expect(cell.style.borderRadius).toBe('0px')
    expect(cell.className).not.toContain('rounded-lg')
    expect(root(container).style.getPropertyValue('--gallery-zoom')).toBe('1.1')
  })

  it('follows the theme radius by default and zooms a little', () => {
    const { container } = render(<Gallery images={images} />)
    expect(screen.getByRole('button', { name: 'Open A cat' }).className).toContain('rounded-lg')
    expect(root(container).style.getPropertyValue('--gallery-zoom')).toBe('1.03')
  })

  it('does not zoom with zoom off', () => {
    const { container } = render(<Gallery images={images} zoom={false} />)
    expect(root(container).style.getPropertyValue('--gallery-zoom')).toBe('')
    expect(container.querySelector('img')?.className).not.toContain('scale')
  })

  // With nothing to open, the cells are pictures: no buttons on the tab order, and each image
  // carries its own alt now that no button does.
  it('renders plain pictures when it does not open', () => {
    render(<Gallery images={images} openOnClick={false} />)
    expect(screen.queryAllByRole('button').length).toBe(0)
    expect(screen.getByAltText('A cat')).toBeTruthy()
  })

  it('calls onImageClick, and stays shut when that prevents the default', async () => {
    const onImageClick = vi.fn((_: number, event: React.MouseEvent) => event.preventDefault())
    render(<Gallery images={images} onImageClick={onImageClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open A dog' }))
    expect(onImageClick).toHaveBeenCalledWith(1, expect.anything())
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('gives every cell its own key, even when two share a picture', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const twins = [{ src: '/same.png' }, { src: '/same.png' }, { src: '/other.png' }]
    render(<Gallery images={twins} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open image 1' }))
    await screen.findByRole('dialog')
    expect(screen.getAllByRole('button', { name: /Show image/ }).length).toBe(3)
    const duplicate = error.mock.calls.some((call) => String(call[0]).includes('same key'))
    error.mockRestore()
    expect(duplicate).toBe(false)
  })
})

describe('Lightbox', () => {
  async function openOn(name: string) {
    await userEvent.click(screen.getByRole('button', { name }))
    return screen.findByRole('dialog')
  }
  const stage = () => document.querySelector('[data-slot="lightbox-stage"]') as HTMLElement

  it('closes on a tap on the backdrop', async () => {
    render(<Gallery images={images} />)
    await openOn('Open A cat')
    fireEvent.pointerDown(stage(), { clientX: 20, clientY: 300 })
    fireEvent.pointerUp(stage(), { clientX: 22, clientY: 301 })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  // The tap is decided on the way up, so a drag that merely ends on the backdrop is a drag.
  it('stays open for a swipe that ends on the backdrop', async () => {
    render(<Gallery images={images} />)
    await openOn('Open A cat')
    fireEvent.pointerDown(stage(), { clientX: 20, clientY: 300 })
    fireEvent.pointerUp(stage(), { clientX: 60, clientY: 310 })
    expect(screen.queryByRole('dialog')).toBeTruthy()

    fireEvent.pointerDown(screen.getByAltText('A cat'), { clientX: 200, clientY: 300 })
    fireEvent.pointerUp(stage(), { clientX: 200, clientY: 300 })
    expect(screen.queryByRole('dialog')).toBeTruthy()
  })

  it('can be told not to close on the backdrop', async () => {
    function Controlled() {
      const [open, setOpen] = React.useState(true)
      const [index, setIndex] = React.useState(0)
      return (
        <Lightbox
          images={images}
          index={index}
          onIndexChange={setIndex}
          open={open}
          onOpenChange={setOpen}
          closeOnBackdrop={false}
        />
      )
    }
    render(<Controlled />)
    await screen.findByRole('dialog')
    fireEvent.pointerDown(stage(), { clientX: 20, clientY: 300 })
    fireEvent.pointerUp(stage(), { clientX: 20, clientY: 300 })
    expect(screen.queryByRole('dialog')).toBeTruthy()
  })

  // There is no Dialog.Trigger here, so without help focus would land on the body.
  it('gives focus back to the thumbnail of the image last shown', async () => {
    render(<Gallery images={images} />)
    await openOn('Open A cat')
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open A dog' })),
    )
  })

  it('gives focus back to what opened it when used on its own', async () => {
    function Standalone() {
      const [open, setOpen] = React.useState(false)
      const [index, setIndex] = React.useState(0)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            View photos
          </button>
          <Lightbox
            images={images}
            index={index}
            onIndexChange={setIndex}
            open={open}
            onOpenChange={setOpen}
          />
        </>
      )
    }
    render(<Standalone />)
    await openOn('View photos')
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'View photos' })),
    )
  })

  it('portals into the container it is given', async () => {
    const frame = document.createElement('div')
    document.body.appendChild(frame)
    render(<Gallery images={images} container={frame} />)
    const dialog = await openOn('Open A cat')
    expect(frame.contains(dialog)).toBe(true)
    frame.remove()
  })
})
