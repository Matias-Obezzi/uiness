import { Lens } from '@/components/ui/lens'

export default function LensDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <Lens zoom={2.4} size={180} shape="circle" className="rounded-2xl border shadow-md">
        <img
          src="/img/photo.png"
          alt="Architectural detail"
          className="aspect-video w-full max-w-lg object-cover"
        />
      </Lens>
      <p className="text-caption text-muted-foreground">
        Hover or drag across the image to inspect details.
      </p>
    </div>
  )
}
