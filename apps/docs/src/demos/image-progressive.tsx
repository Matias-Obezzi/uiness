import { useState } from 'react'
import { Button } from '@/ui/button'
import { Image } from '@/ui/image'

const src = import.meta.env.DEV ? '/slow/4000/photo.png' : '/img/photo.png'

export default function ImageProgressive() {
  const [key, setKey] = useState(0)
  const [progress, setProgress] = useState(0)
  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <Image
        key={key}
        src={`${src}?v=${key}`}
        placeholder="/img/photo-tiny.png"
        variant="pixelate"
        progressive
        onProgress={setProgress}
        width={1600}
        height={1000}
        alt="Lake at sunrise"
      />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setKey((k) => k + 1)}>
          Reload
        </Button>
        <span className="font-mono text-muted-foreground text-sm">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  )
}
