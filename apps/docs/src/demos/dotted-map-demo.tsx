import { DottedMap } from '@/components/ui/dotted-map'

export default function DottedMapDemo() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-card p-6 shadow-xs">
      <DottedMap
        step={2}
        dotSize={2}
        markers={[
          { lat: 37.7749, lng: -122.4194, label: 'San Francisco', color: '#3b82f6' },
          { lat: 40.7128, lng: -74.006, label: 'New York', color: '#10b981' },
          { lat: 51.5074, lng: -0.1278, label: 'London', color: '#8b5cf6' },
          { lat: 35.6762, lng: 139.6503, label: 'Tokyo', color: '#ef4444' },
        ]}
        arcs={[
          { from: [37.7749, -122.4194], to: [51.5074, -0.1278], color: '#3b82f6' },
          { from: [51.5074, -0.1278], to: [35.6762, 139.6503], color: '#8b5cf6' },
        ]}
      />
    </div>
  )
}
