import { useState } from 'react'
import { Button } from '@/ui/button'
import { Image } from '@/ui/image'

// In development the image is streamed slowly so the transition is visible.
const src = import.meta.env.DEV ? '/slow/2500/photo.png' : '/img/photo.png'

export default function ImageBlur() {
  const [key, setKey] = useState(0)
  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <Image
        key={key}
        src={`${src}?v=${key}`}
        placeholder="/img/photo-tiny.png"
        variant="blur"
        width={1600}
        height={1000}
        alt="Lake at sunrise"
      />
      <Button variant="outline" size="sm" onClick={() => setKey((k) => k + 1)}>
        Reload
      </Button>
    </div>
  )
}
