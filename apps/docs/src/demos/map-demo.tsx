import { useState } from 'react'
import { type LngLat, Map, MapMarker, MapPopup, MapZoomControl } from '@/components/ui/map'

const places: { name: string; lngLat: LngLat; note: string }[] = [
  { name: 'Obelisco', lngLat: [-58.3816, -34.6037], note: 'Avenida 9 de Julio, built in 1936.' },
  { name: 'Casa Rosada', lngLat: [-58.3703, -34.6081], note: 'Seat of the president.' },
  {
    name: 'Puente de la Mujer',
    lngLat: [-58.3653, -34.6078],
    note: 'Footbridge over the dock, 2001.',
  },
]

export default function MapDemo() {
  const [open, setOpen] = useState<string | null>('Obelisco')
  const place = places.find((p) => p.name === open)
  return (
    <Map defaultCenter={[-58.3735, -34.6055]} defaultZoom={14} className="h-96 max-w-2xl">
      {places.map((p) => (
        <MapMarker
          key={p.name}
          lngLat={p.lngLat}
          label={p.name}
          onClick={() => setOpen(open === p.name ? null : p.name)}
        />
      ))}
      {place && (
        <MapPopup lngLat={place.lngLat} onClose={() => setOpen(null)}>
          <p className="font-medium">{place.name}</p>
          <p className="text-muted-foreground">{place.note}</p>
        </MapPopup>
      )}
      <MapZoomControl />
    </Map>
  )
}
