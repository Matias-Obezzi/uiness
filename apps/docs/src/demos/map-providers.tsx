import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Map, MapMarker, MapZoomControl, providers } from '@/components/ui/map'

const options = {
  OpenStreetMap: providers.osm,
  OpenTopoMap: providers.openTopoMap,
}

type Name = keyof typeof options

export default function MapProviders() {
  const [name, setName] = useState<Name>('OpenStreetMap')
  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(options) as Name[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={key === name ? 'default' : 'outline'}
            aria-pressed={key === name}
            onClick={() => setName(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      <Map provider={options[name]} defaultCenter={[7.6586, 45.9763]} defaultZoom={11}>
        <MapMarker lngLat={[7.6586, 45.9763]} />
        <MapZoomControl />
      </Map>
    </div>
  )
}
