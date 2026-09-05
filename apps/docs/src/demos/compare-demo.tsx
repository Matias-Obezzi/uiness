import { Compare } from '@/ui/compare'
import { dither, Fx, palettes } from '@/ui/fx'

export default function CompareDemo() {
  return (
    <Compare
      className="w-full max-w-lg"
      labels={['Game Boy', 'Original']}
      before={
        <Fx
          src="/img/gallery-3.png"
          effects={[dither({ palette: palettes.gameboy, method: 'bayer' })]}
          resolution={160}
          className="aspect-3/2 w-full"
        />
      }
      after={
        <img
          src="/img/gallery-3.png"
          alt="A landscape"
          className="aspect-3/2 w-full object-cover"
        />
      }
    />
  )
}
