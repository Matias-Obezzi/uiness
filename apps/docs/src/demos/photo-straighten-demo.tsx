import { PhotoStraighten } from '@/components/ui/photo-straighten'

export default function PhotoStraightenDemo() {
  return (
    <PhotoStraighten
      src="/img/gallery-2.png"
      alt="Green hills over a lake"
      defaultValue={-4.5}
      className="max-w-lg"
    />
  )
}
