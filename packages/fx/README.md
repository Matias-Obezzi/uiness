# @uiness/fx

Canvas image effects for React. Chain pixel effects and canvas effects, render at a low working resolution for that crisp pixel look, animate the ones that depend on time. Zero dependencies.

```bash
pnpm add @uiness/fx
```

## Usage

```tsx
import { Fx, pixelate, palette, palettes, dither, crt } from '@uiness/fx'

<Fx src="/photo.jpg" alt="Photo" effects={[pixelate(6), palette(palettes.gameboy)]} />

<Fx src="/photo.jpg" effects={[dither({ method: 'floyd-steinberg', palette: palettes.pico8 })]} resolution={320} />

<Fx src="/photo.jpg" effects={crt()} /> // animated grain, renders at 30 fps
```

The component draws the image into a `<canvas role="img">`, runs the effects in order and upscales without smoothing when the canvas is smaller than its box.

### Props

| Prop | Default | Description |
| --- | --- | --- |
| `src` | | URL, or an image, canvas or video element already loaded. |
| `effects` | | Effect, list, or nested lists. `crt()` returns a list. |
| `resolution` | `'display'` | Working resolution: max dimension in px, `'display'` for the on-screen size, `'native'` for the source size. Lower is faster and chunkier. |
| `width`, `height` | container width | Display size in CSS px. |
| `fit` | `'cover'` | `cover`, `contain` or `fill`. |
| `animate` | auto | Keep rendering. On by default when an effect is animated. |
| `fps` | `30` | Frame rate for animated renders. |
| `seed` | `1` | Seed for noise and glitch. |
| `smooth` | auto | Force smooth or pixelated upscaling. |
| `crossOrigin` | `'anonymous'` | Cross origin mode for URL sources. |
| `onStatusChange`, `onRender` | | `loading`, `ready`, `error`, and a callback after each frame. |

A ref gives you `canvas`, `render()` and `toDataURL()`.

### Effects

| Effect | Kind | Notes |
| --- | --- | --- |
| `pixelate(size)` | canvas | Block average then nearest neighbour upscale. Works on cross origin images. |
| `flip(axis)` | canvas | Mirror. |
| `blur(radius)` | pixels | Three box passes, near gaussian. |
| `grayscale(amount)`, `invert()`, `sepia(amount)` | pixels | |
| `brightness(v)`, `contrast(v)`, `saturate(v)` | pixels | 1 is unchanged. |
| `posterize(levels)`, `threshold(level)` | pixels | |
| `palette(colors)` | pixels | Nearest color. `palettes.mono`, `gray4`, `gameboy`, `cga`, `pico8` included. |
| `dither(options)` | pixels | `bayer` (2, 4 or 8), `floyd-steinberg`, `atkinson`, to `levels` or a `palette`. |
| `scanlines()`, `vignette()`, `chromatic(offset)` | pixels | |
| `noise(amount, { animated })` | pixels | Film grain, seeded. |
| `glitch({ intensity, animated })` | pixels | Displaced slices with channel shift, flickers between frames. |
| `halftone({ size })` | canvas | Newspaper dots. |
| `ascii({ size, chars, colored })` | canvas | Characters by brightness. |
| `edge()`, `emboss()` | pixels | Sobel edges, relief. |
| `crt()` | combo | chromatic, scanlines, vignette and live grain. |

Order matters: `[pixelate(8), dither()]` dithers the blocks, `[dither(), pixelate(8)]` averages the dither away.

### Cross origin images

Pixel effects call `getImageData`, which the browser only allows on same origin images or images served with `Access-Control-Allow-Origin`. Without it the canvas is tainted, the component sets `data-status="error"` and logs the reason. `pixelate` and `flip` only draw, so they work on any image.

### Custom effects

```ts
import { defineEffect } from '@uiness/fx'

const redOnly = defineEffect({
  name: 'red-only',
  pixel: ({ data }) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i + 1] = 0
      data[i + 2] = 0
    }
  },
})
```

`pixel` gets the RGBA buffer and an env with `random()`, `time`, `frame`, `width` and `height`. `draw` gets the same env plus `ctx`, and can call `env.read()` to inspect pixels. Set `animated: true` if the output depends on time.

### Outside React

```ts
import { renderEffects, pixelate } from '@uiness/fx'

const canvas = renderEffects(imageElement, [pixelate(4)], { width: 320, height: 200 })
```

## License

MIT
