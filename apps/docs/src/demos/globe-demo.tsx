import { Globe } from '@/components/ui/globe'

export default function GlobeDemo() {
  return (
    <div className="relative flex aspect-square w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl border bg-neutral-950 p-2 text-white">
      <Globe
        speed={0.003}
        tilt={0.2}
        dotSize={1.4}
        markers={[
          { lat: 37.7749, lng: -122.4194, label: 'San Francisco', color: '#60a5fa' },
          { lat: -34.6037, lng: -58.3816, label: 'Buenos Aires', color: '#38bdf8' },
          { lat: 51.5074, lng: -0.1278, label: 'London', color: '#818cf8' },
          { lat: 35.6762, lng: 139.6503, label: 'Tokyo', color: '#f43f5e' },
        ]}
        arcs={[
          { from: [37.7749, -122.4194], to: [35.6762, 139.6503], color: '#60a5fa' },
          { from: [51.5074, -0.1278], to: [-34.6037, -58.3816], color: '#38bdf8' },
        ]}
      />
    </div>
  )
}
