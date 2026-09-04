import { defineEffect, Fx, pixelate } from '@/ui/fx'

/** Keeps only the red channel, then pixelates the result. */
const redOnly = defineEffect({
  name: 'red-only',
  pixel: ({ data }) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i + 1] = 0
      data[i + 2] = 0
    }
  },
})

export default function FxCustom() {
  return (
    <Fx src="/img/photo.png" alt="" effects={[redOnly, pixelate(6)]} className="w-full max-w-md" />
  )
}
