import { useImageLoad } from '@/ui/image'

export default function ImageHook() {
  const { status, progress, imgProps } = useImageLoad({ src: '/img/photo.png', progressive: true })
  return (
    <figure className="flex flex-col gap-2">
      <img
        {...imgProps}
        alt=""
        width={320}
        className="rounded-lg transition-opacity"
        style={{ opacity: status === 'loaded' ? 1 : 0.3 }}
      />
      <figcaption className="font-mono text-muted-foreground text-xs">
        {status} · {Math.round(progress * 100)}%
      </figcaption>
    </figure>
  )
}
