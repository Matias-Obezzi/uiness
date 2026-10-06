import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { GalleryGrid } from './gallery-grid'

const images = [
  { src: '/a.png', thumbnail: '/a-small.png', alt: 'A cat', width: 800, height: 600 },
  { src: '/b.png', alt: 'A dog' },
]

describe('GalleryGrid', () => {
  // It goes on landings: no client code, no viewer and no dialog library comes with it.
  it('is a server component without the lightbox', () => {
    const source = readFileSync(join(__dirname, 'gallery-grid.tsx'), 'utf-8')
    expect(source).not.toMatch(/^['"]use client['"]/m)
    expect(source).not.toMatch(/from 'radix-ui'|components\/ui\/(gallery|image)'/)
    const el = document.createElement('div')
    el.innerHTML = renderToString(<GalleryGrid images={images} />)
    const img = el.querySelector('img')
    expect(img?.getAttribute('src')).toBe('/a-small.png')
    expect(img?.getAttribute('alt')).toBe('A cat')
    expect(img?.getAttribute('loading')).toBe('lazy')
    expect(img?.getAttribute('width')).toBe('800')
    expect(el.querySelector('button')).toBeNull()
  })

  it('draws the pictures with the image component it is given', () => {
    const renderImage = vi.fn(({ src, alt, className }) => (
      <img data-own src={`${src}?w=400`} alt={alt} className={className} />
    ))
    render(<GalleryGrid images={images} zoom={false} renderImage={renderImage} />)
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ index: 1, src: '/b.png', alt: 'A dog', image: images[1] }),
    )
    const own = screen.getByAltText('A cat')
    expect(own.getAttribute('src')).toBe('/a-small.png?w=400')
    expect(own.className).toContain('object-cover')
    expect(own.className).not.toContain('scale')
  })

  it('makes a cell a button from getItemProps, with the name on the button', async () => {
    const onClick = vi.fn()
    render(
      <GalleryGrid
        images={images}
        getItemProps={(i, image) =>
          i === 0 ? { onClick, 'aria-label': `Open ${image.alt}` } : undefined
        }
      />,
    )
    const cell = screen.getByRole('button', { name: 'Open A cat' })
    expect(cell.querySelector('img')?.getAttribute('alt')).toBe('')
    await userEvent.click(cell)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByAltText('A dog')).toBeTruthy()
  })
})
