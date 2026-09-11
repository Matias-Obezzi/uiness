import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Gallery } from './gallery'

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
