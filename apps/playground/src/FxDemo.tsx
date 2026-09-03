import {
  ascii,
  blur,
  chromatic,
  contrast,
  crt,
  dither,
  type EffectInput,
  edge,
  emboss,
  Fx,
  glitch,
  grayscale,
  halftone,
  invert,
  noise,
  palette,
  palettes,
  pixelate,
  posterize,
  saturate,
  sepia,
  threshold,
  vignette,
} from '@uiness/fx'
import { useState } from 'react'

const SRC = '/img/photo.png'

const presets: Array<{ title: string; effects: EffectInput; resolution?: number }> = [
  { title: 'pixelate(8)', effects: pixelate(8) },
  { title: 'gameboy', effects: [palette(palettes.gameboy)], resolution: 160 },
  { title: 'gameboy + bayer', effects: [dither({ palette: palettes.gameboy })], resolution: 160 },
  {
    title: 'pico8 floyd-steinberg',
    effects: [dither({ method: 'floyd-steinberg', palette: palettes.pico8 })],
    resolution: 256,
  },
  { title: '1-bit atkinson', effects: [dither('atkinson')], resolution: 320 },
  { title: 'crt() animated', effects: crt() },
  { title: 'glitch animated', effects: [glitch({ intensity: 0.7 })] },
  { title: 'halftone', effects: [halftone({ size: 5 })], resolution: 480 },
  { title: 'ascii', effects: [ascii({ size: 7 })], resolution: 640 },
  { title: 'ascii colored', effects: [ascii({ size: 7, colored: true })], resolution: 640 },
  { title: 'edge', effects: [edge({ strength: 1.5 })] },
  { title: 'emboss', effects: [emboss()] },
  { title: 'sepia + vignette', effects: [sepia(), vignette(0.7)] },
  { title: 'posterize(3) + saturate', effects: [saturate(1.8), posterize(3)] },
  { title: 'threshold + noise', effects: [blur(2), threshold(120), noise(0.2)] },
  { title: 'chromatic + contrast', effects: [chromatic(6), contrast(1.4)] },
  { title: 'invert grayscale', effects: [grayscale(), invert()] },
  { title: 'pixelate + cga', effects: [pixelate(4), palette(palettes.cga)] },
]

export function FxDemo() {
  const [chunky, setChunky] = useState(true)

  return (
    <>
      <h1>@uiness/fx playground</h1>
      <div className="controls">
        <label>
          <input type="checkbox" checked={chunky} onChange={(e) => setChunky(e.target.checked)} />
          low resolution where the preset asks for it
        </label>
      </div>
      <div className="grid">
        {presets.map((preset) => (
          <div className="card" key={preset.title}>
            <h2>{preset.title}</h2>
            <Fx
              src={SRC}
              alt={preset.title}
              effects={preset.effects}
              resolution={chunky ? (preset.resolution ?? 'display') : 'display'}
              style={{ borderRadius: 6 }}
            />
          </div>
        ))}
      </div>
    </>
  )
}
