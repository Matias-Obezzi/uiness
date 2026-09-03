# @uiness/image

Drop-in `<img>` replacement for React with loading transitions. Zero runtime dependencies.

- **fade**: cross fade from the placeholder or a solid color.
- **blur**: blurred placeholder that sharpens as the image arrives.
- **pixelate**: low resolution mosaic that refines into the final image, canvas based, works with or without a placeholder.
- **reveal**: clip-path wipe from any edge.
- **bar**: thin progress bar along the bottom edge.
- **progressive** mode streams the image with `fetch`, so blur, pixelate and bar follow the real download progress.

```bash
pnpm add @uiness/image
```

## Usage

```tsx
import { Image } from '@uiness/image'

<Image
  src="/photos/lake.jpg"
  placeholder={lakeTinyDataUri} // 16 to 32 px wide is enough
  variant="blur"
  width={1200}
  height={800}
  alt="Lake at sunrise"
/>
```

The component renders a wrapping `<span>` with the placeholder, the real `<img>` and, for some variants, an overlay. Every `<img>` prop is forwarded, `className` and `style` go to the image, `wrapperProps` to the wrapper.

Give the image a size (`width`/`height` attributes, or CSS) so the box exists before the bytes arrive, exactly like a plain `<img>`.

### Props

| Prop | Default | Description |
| --- | --- | --- |
| `variant` | `'fade'` | `'fade' \| 'blur' \| 'pixelate' \| 'reveal' \| 'bar' \| 'none'` or a custom `ImageVariant`. |
| `placeholder` | | Tiny version of the image, data URI or URL. |
| `color` | | Wrapper background while loading. Pairs well with `fade` when you have no placeholder. |
| `duration` | `600` | Transition length in ms once the image is decoded. |
| `easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | CSS easing for the transition. |
| `progressive` | `false` | Stream with `fetch` for real progress. See below. |
| `fetchInit` | | Extra `RequestInit` for the progressive request. |
| `fallback` | | Node rendered inside the wrapper when the image fails. |
| `wrapperProps` | | Props for the wrapping `<span>`. |
| `onProgress` | | `(progress: number) => void`, 0 to 1. |
| `onStatusChange` | | `(status: 'loading' \| 'loaded' \| 'error') => void`. |

The wrapper exposes `data-status`, `data-variant` and `data-progress` (0 to 100) for styling from CSS.

### Variant options

Built-in variants accept options through their factories:

```tsx
import { blur, pixelate, reveal, bar } from '@uiness/image'

<Image variant={blur({ amount: 40 })} ... />
<Image variant={pixelate({ size: 48 })} ... />
<Image variant={reveal({ from: 'bottom' })} ... />
<Image variant={bar({ thickness: 4 })} ... />
```

### Progressive mode

```tsx
<Image src="https://cdn.example.com/huge.jpg" placeholder={tiny} variant="pixelate" progressive />
```

The browser gives no progress events for `<img>`, so `progressive` downloads the file with `fetch`, reads the stream, and hands the bytes to the image as a blob URL. That gives real progress to the blur radius, the block size and the bar. Trade-offs:

- The image host must allow CORS for your origin.
- `srcSet` and `sizes` are ignored, the request goes to `src` only.
- `loading="lazy"` is honored with an `IntersectionObserver` so the download waits until the image is near the viewport.

### Custom variants

A variant is an object of style functions. Each receives the current `VariantContext` and returns inline styles for the wrapper, the image or the placeholder. An optional `overlay` component can render anything on top and must call `onComplete` when it is done.

```tsx
import { defineVariant, type VariantContext } from '@uiness/image'

const slideUp = defineVariant({
  name: 'slide-up',
  image: (ctx: VariantContext) => ({
    opacity: ctx.status === 'loaded' ? 1 : 0,
    transform: ctx.status === 'loaded' ? 'none' : 'translateY(12px)',
    transition: `opacity ${ctx.duration}ms ${ctx.easing}, transform ${ctx.duration}ms ${ctx.easing}`,
  }),
})

<Image variant={slideUp} ... />
```

`ctx.value` is the effective progress: real bytes in progressive mode, otherwise 0 until the image is decoded and then 1.

### Hook

`useImageLoad` is the primitive behind the component. Use it to build your own markup.

```tsx
import { useImageLoad } from '@uiness/image'

function Avatar({ src }: { src: string }) {
  const { status, progress, imgProps } = useImageLoad({ src, progressive: true })
  return (
    <div data-status={status}>
      <img {...imgProps} alt="" />
      <progress value={progress} />
    </div>
  )
}
```

### Server rendering

The package ships with the `'use client'` directive, so it can be imported directly from React Server Components in Next.js. On the server it renders the loading state. Images already in the browser cache are detected on hydration and appear without animation.

## License

MIT
