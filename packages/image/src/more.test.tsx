import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Image } from './image'
import { preloadImage, preloadImages } from './preload'
import type { VariantContext } from './types'
import { grayscale, zoom } from './variants'

const wrapper = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-uiness-image]') as HTMLElement

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('retry', () => {
  it('waits, loads the same URL again, and only reports the last failure', () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const { container } = render(
      <Image src="/flaky.jpg" alt="flaky" retry={2} retryDelay={100} onError={onError} />,
    )
    const img = screen.getByAltText('flaky') as HTMLImageElement
    const setSrc = vi.spyOn(img, 'setAttribute')

    fireEvent.error(img)
    expect(wrapper(container).dataset.status).toBe('loading')
    act(() => vi.advanceTimersByTime(100))
    // The URL is set again as it was, which makes the browser fetch it anew.
    expect(setSrc).toHaveBeenLastCalledWith('src', '/flaky.jpg')

    fireEvent.error(img)
    act(() => vi.advanceTimersByTime(199))
    expect(setSrc).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1))
    expect(setSrc).toHaveBeenCalledTimes(2)

    fireEvent.error(img)
    expect(wrapper(container).dataset.status).toBe('error')
    // onError on the <img> fires per attempt; the status only fails once retries run out.
    expect(onError).toHaveBeenCalledTimes(3)
  })

  it('loads after a retry', () => {
    vi.useFakeTimers()
    const { container } = render(<Image src="/flaky.jpg" alt="flaky" retry={1} retryDelay={10} />)
    const img = screen.getByAltText('flaky')
    fireEvent.error(img)
    act(() => vi.advanceTimersByTime(10))
    fireEvent.load(img)
    expect(wrapper(container).dataset.status).toBe('loaded')
  })

  it('downloads again in progressive mode', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        new Response(new Uint8Array(4), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:retried', revokeObjectURL: () => {} }),
    )
    render(<Image src="/big.jpg" alt="big" progressive retry={1} retryDelay={1} />)
    const img = screen.getByAltText('big')
    await waitFor(() => expect(img.getAttribute('src')).toBe('blob:retried'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('fetchInit', () => {
  it('does not download again when an inline object is passed on every render', async () => {
    const fetchMock = vi.fn(
      () => new Promise<Response>(() => {}), // never settles: a download in flight
    )
    vi.stubGlobal('fetch', fetchMock)
    const { rerender } = render(
      <Image src="/big.jpg" alt="big" progressive fetchInit={{ headers: { a: '1' } }} />,
    )
    rerender(<Image src="/big.jpg" alt="big" progressive fetchInit={{ headers: { a: '1' } }} />)
    rerender(<Image src="/big.jpg" alt="big" progressive fetchInit={{ headers: { a: '1' } }} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('ratio', () => {
  it('reserves the box and lets the image cover it', () => {
    const { container } = render(<Image src="/a.jpg" alt="a" ratio="16 / 9" />)
    expect(wrapper(container).style.aspectRatio).toBe('16 / 9')
    expect(wrapper(container).style.width).toBe('100%')
    const img = screen.getByAltText('a') as HTMLImageElement
    expect(img.style.height).toBe('100%')
    expect(img.style.objectFit).toBe('cover')
  })
})

describe('reduced motion', () => {
  it('settles the moment the image loads, without a transition', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }))
    const { container } = render(
      <Image src="/a.jpg" alt="a" placeholder="data:image/gif;base64,R0lGOD" duration={600} />,
    )
    fireEvent.load(screen.getByAltText('a'))
    // Settled: the placeholder is gone without waiting the 600 ms.
    return waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(1))
  })
})

describe('new variants', () => {
  const ctx = (patch: Partial<VariantContext>): VariantContext => ({
    status: 'loading',
    progress: 0,
    error: null,
    value: 0,
    progressive: false,
    duration: 600,
    easing: 'linear',
    hasPlaceholder: false,
    settled: false,
    objectFit: 'cover',
    ...patch,
  })

  it('zoom settles from a slight zoom to none', () => {
    expect(zoom({ from: 1.2 }).image?.(ctx({}))).toMatchObject({
      opacity: 0,
      transform: 'scale(1.2)',
    })
    expect(zoom().image?.(ctx({ status: 'loaded' }))).toMatchObject({
      opacity: 1,
      transform: 'scale(1)',
    })
    expect(zoom().image?.(ctx({ status: 'loaded', settled: true }))?.transform).toBeUndefined()
  })

  it('grayscale brings the color in after the fade', () => {
    expect(grayscale.image?.(ctx({}))).toMatchObject({ opacity: 0, filter: 'grayscale(1)' })
    expect(grayscale.image?.(ctx({ status: 'loaded' }))).toMatchObject({
      opacity: 1,
      filter: 'grayscale(0)',
    })
  })
})

describe('preloadImage', () => {
  it('resolves once loaded and decoded, rejects on error', async () => {
    const created: HTMLImageElement[] = []
    const Original = window.Image
    vi.stubGlobal(
      'Image',
      class extends Original {
        constructor() {
          super()
          created.push(this)
          Object.defineProperty(this, 'decode', { value: () => Promise.resolve() })
        }
      },
    )
    const ok = preloadImage('/next.jpg', { srcSet: '/next@2x.jpg 2x', sizes: '50vw' })
    const img = created[0] as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/next.jpg')
    expect(img.getAttribute('srcset')).toBe('/next@2x.jpg 2x')
    img.dispatchEvent(new Event('load'))
    await expect(ok).resolves.toBe(img)

    const many = preloadImages(['/a.jpg', { src: '/b.jpg' }])
    for (const extra of created.slice(1)) extra.dispatchEvent(new Event('error'))
    await expect(many).rejects.toThrow('/a.jpg')
  })
})
