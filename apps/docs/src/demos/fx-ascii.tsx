import { ascii, Fx } from '@/ui/fx'

export default function FxAscii() {
  return (
    <Fx
      src="/img/photo.png"
      alt="Lake at sunrise in ASCII"
      effects={[ascii({ size: 7, colored: true })]}
      resolution={640}
      className="w-full max-w-md"
    />
  )
}
