import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Image } from './image'
import { fitRect } from './overlays'
import type { VariantContext } from './types'
import { useImageLoad } from './use-image-load'
import { blur, reveal } from './variants'

const getWrapper = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-uiness-image]') as HTMLElement

const ctx = (patch: Partial<VariantContext>): VariantContext => ({
  status: 'loading',
  progress: 0,
  error: null,
  value: 0,
  progressive: false,
  duration: 600,
  easing: 'linear',
  hasPlaceholder: true,
  settled: false,
  objectFit: 'cover',
  ...patch,
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('<Image>', () => {
  it('goes loading -> loaded and drops the placeholder once settled', () => {
    vi.useFakeTimers()
    const onStatusChange = vi.fn()
    const { container } = render(
      <Image
        src="/photo.jpg"
        alt="photo"
        placeholder="data:image/gif;base64,R0lGOD"
        variant="blur"
        duration={100}
        onStatusChange={onStatusChange}
      />,
    )
    const wrapper = getWrapper(container)
    const img = screen.getByAltText('photo') as HTMLImageElement

    expect(wrapper.dataset.status).toBe('loading')
    expect(container.querySelectorAll('img')).toHaveLength(2)
    expect(img.style.opacity).toBe('0')
    expect(img.style.filter).toBe('blur(20px)')

    fireEvent.load(img)

    expect(wrapper.dataset.status).toBe('loaded')
    expect(wrapper.dataset.progress).toBe('100')
    expect(img.style.opacity).toBe('1')
    expect(img.style.filter).toBe('blur(0px)')
    expect(onStatusChange).toHaveBeenCalledWith('loaded')

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(img.style.filter).toBe('')
  })

  it('renders the fallback and hides the broken image on error', () => {
    const onError = vi.fn()
    const { container } = render(
      <Image
        src="/missing.jpg"
        alt="missing"
        fallback={<span>could not load</span>}
        onError={onError}
      />,
    )
    const img = screen.getByAltText('missing') as HTMLImageElement
    fireEvent.error(img)

    expect(getWrapper(container).dataset.status).toBe('error')
    expect(screen.getByText('could not load')).toBeTruthy()
    expect(img.style.display).toBe('none')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('detects images already complete from the cache', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(640)
    const { container } = render(<Image src="/cached.jpg" alt="cached" />)
    expect(getWrapper(container).dataset.status).toBe('loaded')
  })

  it('applies the color while loading and clears it when settled', () => {
    vi.useFakeTimers()
    const { container } = render(<Image src="/c.jpg" alt="c" color="rgb(1, 2, 3)" duration={50} />)
    const wrapper = getWrapper(container)
    expect(wrapper.style.backgroundColor).toBe('rgb(1, 2, 3)')
    fireEvent.load(screen.getByAltText('c'))
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(wrapper.style.backgroundColor).toBe('')
  })

  it('streams the image and reports byte progress in progressive mode', async () => {
    const chunks = [new Uint8Array(40), new Uint8Array(40), new Uint8Array(20)]
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk)
        controller.close()
      },
    })
    const response = new Response(stream, {
      status: 200,
      headers: { 'content-length': '100', 'content-type': 'image/png' },
    })
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    const createObjectURL = vi.fn(() => 'blob:uiness-test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))

    const onProgress = vi.fn()
    const { container, unmount } = render(
      <Image src="/big.jpg" alt="big" progressive onProgress={onProgress} />,
    )
    const img = screen.getByAltText('big') as HTMLImageElement

    expect(img.getAttribute('src')).toBeNull()
    await waitFor(() => expect(img.getAttribute('src')).toBe('blob:uiness-test'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/big.jpg',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    const reported = () => onProgress.mock.calls.map((c) => c[0] as number)
    await waitFor(() => expect(reported().at(-1)).toBe(0.99))
    const values = reported()
    expect(values.every((p, i) => i === 0 || p > (values[i - 1] as number))).toBe(true)
    expect(getWrapper(container).dataset.status).toBe('loading')

    fireEvent.load(img)
    expect(getWrapper(container).dataset.status).toBe('loaded')
    expect(onProgress).toHaveBeenLastCalledWith(1)

    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:uiness-test')
  })

  it('reports an error when the progressive request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))
    const { container } = render(<Image src="/nope.jpg" alt="nope" progressive />)
    await waitFor(() => expect(getWrapper(container).dataset.status).toBe('error'))
  })

  it('settles the pixelate variant after the overlay animation', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now() + 10_000), 0) as unknown as number
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))

    const { container } = render(<Image src="/px.jpg" alt="px" variant="pixelate" duration={100} />)
    const img = screen.getByAltText('px') as HTMLImageElement
    expect(container.querySelector('canvas')).toBeTruthy()
    expect(img.style.opacity).toBe('0')

    fireEvent.load(img)
    await waitFor(() => expect(container.querySelector('canvas')).toBeNull())
    expect(img.style.opacity).toBe('1')
  })

  it('forwards the ref to the <img>', () => {
    const ref = { current: null as HTMLImageElement | null }
    render(<Image ref={ref} src="/r.jpg" alt="r" />)
    expect(ref.current?.tagName).toBe('IMG')
  })
})

describe('useImageLoad', () => {
  it('resets when the source changes', () => {
    const { result, rerender } = renderHook((props: { src: string }) => useImageLoad(props), {
      initialProps: { src: '/a.jpg' },
    })
    act(() => result.current.imgProps.onLoad())
    expect(result.current.status).toBe('loaded')
    expect(result.current.progress).toBe(1)

    rerender({ src: '/b.jpg' })
    expect(result.current.status).toBe('loading')
    expect(result.current.progress).toBe(0)
    expect(result.current.imgProps.src).toBe('/b.jpg')
  })

  it('drops srcSet and sizes in progressive mode', () => {
    const { result } = renderHook(() =>
      useImageLoad({ src: '/a.jpg', srcSet: '/a-2x.jpg 2x', sizes: '100vw', progressive: true }),
    )
    expect(result.current.imgProps.srcSet).toBeUndefined()
    expect(result.current.imgProps.sizes).toBeUndefined()
  })
})

describe('variants', () => {
  it('blur follows progress', () => {
    const v = blur({ amount: 10 })
    expect(v.placeholder?.(ctx({ value: 0 }))?.filter).toBe('blur(10px)')
    expect(v.placeholder?.(ctx({ value: 0.5, progressive: true }))?.filter).toBe('blur(5px)')
    expect(v.placeholder?.(ctx({ value: 1, status: 'loaded' }))?.filter).toBe('blur(0px)')
  })

  it('reveal clips from the requested edge', () => {
    expect(reveal({ from: 'top' }).image?.(ctx({}))?.clipPath).toBe('inset(0 0 100% 0)')
    expect(reveal({ from: 'right' }).image?.(ctx({}))?.clipPath).toBe('inset(0 0 0 100%)')
    expect(reveal().image?.(ctx({ status: 'loaded', value: 1 }))?.clipPath).toBe('inset(0 0% 0 0)')
    expect(
      reveal().image?.(ctx({ status: 'loaded', value: 1, settled: true }))?.clipPath,
    ).toBeUndefined()
  })

  it('fitRect matches object-fit semantics', () => {
    expect(fitRect(200, 100, 100, 100, 'cover')).toEqual({
      sx: 50,
      sy: 0,
      sw: 100,
      sh: 100,
      dx: 0,
      dy: 0,
      dw: 100,
      dh: 100,
    })
    expect(fitRect(200, 100, 100, 100, 'contain')).toEqual({
      sx: 0,
      sy: 0,
      sw: 200,
      sh: 100,
      dx: 0,
      dy: 25,
      dw: 100,
      dh: 50,
    })
    expect(fitRect(200, 100, 50, 50, 'fill')).toEqual({
      sx: 0,
      sy: 0,
      sw: 200,
      sh: 100,
      dx: 0,
      dy: 0,
      dw: 50,
      dh: 50,
    })
  })
})
