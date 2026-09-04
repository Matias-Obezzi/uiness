import { useState } from 'react'
import { Button } from '@/ui/button'
import { blur, Image, pixelate, reveal } from '@/ui/image'

const src = import.meta.env.DEV ? '/slow/3000/photo.png' : '/img/photo.png'

const variants = [
  { label: 'fade + color', variant: 'fade' as const, color: 'var(--muted)' },
  { label: 'blur({ amount: 40 })', variant: blur({ amount: 40 }), placeholder: true },
  { label: 'pixelate({ size: 48 })', variant: pixelate({ size: 48 }), placeholder: true },
  {
    label: "reveal({ from: 'bottom' })",
    variant: reveal({ from: 'bottom' }),
    color: 'var(--muted)',
  },
]

export default function ImageVariants() {
  const [key, setKey] = useState(0)
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {variants.map((v) => (
          <figure key={v.label} className="flex flex-col gap-1">
            <Image
              key={key}
              src={`${src}?v=${key}&${encodeURIComponent(v.label)}`}
              placeholder={v.placeholder ? '/img/photo-tiny.png' : undefined}
              variant={v.variant}
              color={v.color}
              width={1600}
              height={1000}
              alt=""
            />
            <figcaption className="font-mono text-muted-foreground text-xs">{v.label}</figcaption>
          </figure>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setKey((k) => k + 1)}
      >
        Reload all
      </Button>
    </div>
  )
}
