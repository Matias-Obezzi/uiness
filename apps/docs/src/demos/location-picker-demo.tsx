import { LocationPicker } from '@/components/ui/location-picker'
import type { LngLat } from '@/components/ui/map'

// A stand-in for a geocoder and a routing service: a few streets around Lisbon's Baixa.
const streets: { name: string; lngLat: LngLat }[] = [
  { name: 'Rua Augusta', lngLat: [-9.1376, 38.7104] },
  { name: 'Rua da Prata', lngLat: [-9.1362, 38.7101] },
  { name: 'Rua do Ouro', lngLat: [-9.139, 38.7106] },
  { name: 'Praça do Comércio', lngLat: [-9.1366, 38.7076] },
  { name: 'Rua dos Fanqueiros', lngLat: [-9.1349, 38.7105] },
]

const nearest = ([lng, lat]: LngLat) =>
  streets.reduce((best, s) =>
    Math.hypot(s.lngLat[0] - lng, s.lngLat[1] - lat) <
    Math.hypot(best.lngLat[0] - lng, best.lngLat[1] - lat)
      ? s
      : best,
  )

export default function LocationPickerDemo() {
  return (
    <LocationPicker
      className="max-w-md"
      defaultCenter={[-9.1372, 38.7098]}
      // The pin glides a third of the way toward the nearest street, as a curb snap would.
      snap={(point) => {
        const s = nearest(point).lngLat
        return [point[0] + (s[0] - point[0]) / 3, point[1] + (s[1] - point[1]) / 3]
      }}
      resolve={(point) =>
        new Promise((done) =>
          setTimeout(
            () => done(`${12 + Math.round(Math.abs(point[1] * 1e4) % 80)} ${nearest(point).name}`),
            400,
          ),
        )
      }
    />
  )
}
