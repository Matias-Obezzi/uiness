import { dither, Fx, palettes } from '@/ui/fx'

export default function FxGameboy() {
  return (
    <Fx
      src="/img/photo.png"
      alt="Lake at sunrise, Game Boy style"
      effects={[dither({ palette: palettes.gameboy })]}
      resolution={160}
      className="w-full max-w-md"
    />
  )
}
