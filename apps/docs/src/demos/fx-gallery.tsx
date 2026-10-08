import {
  dither,
  duotone,
  edge,
  Fx,
  glitch,
  halftone,
  hueRotate,
  kaleidoscope,
  palette,
  palettes,
  pixelate,
  pixelSort,
  posterize,
  saturate,
  sepia,
  vignette,
} from '@/components/ui/fx'

const presets = [
  { title: 'pixelate(10)', effects: pixelate(10) },
  { title: 'palette(pico8)', effects: [palette(palettes.pico8)], resolution: 200 },
  { title: "dither('floyd-steinberg')", effects: [dither('floyd-steinberg')], resolution: 320 },
  { title: 'halftone', effects: [halftone({ size: 5 })], resolution: 480 },
  { title: 'edge', effects: [edge({ strength: 1.5 })] },
  { title: 'sepia + vignette', effects: [sepia(), vignette(0.7)] },
  { title: 'saturate + posterize', effects: [saturate(1.8), posterize(3)] },
  { title: 'glitch (animated)', effects: [glitch({ intensity: 0.7 })] },
  { title: 'duotone', effects: [duotone('#1e1b4b', '#fde68a')] },
  { title: 'hueRotate(150)', effects: [hueRotate(150)] },
  { title: 'kaleidoscope(8)', effects: [kaleidoscope(8)], resolution: 360 },
  { title: 'pixelSort', effects: [pixelSort({ low: 80, high: 230 })], resolution: 320 },
]

export default function FxGallery() {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {presets.map((p) => (
        <figure key={p.title} className="flex flex-col gap-1">
          <Fx
            src="/img/photo.png"
            alt=""
            effects={p.effects}
            resolution={p.resolution ?? 'display'}
          />
          <figcaption className="truncate font-mono text-muted-foreground text-xs">
            {p.title}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
