import {
  bar,
  blur,
  defineVariant,
  Image,
  type ImageVariant,
  pixelate,
  reveal,
  useImageLoad,
  type VariantName,
} from '@uiness/image'
import { useState } from 'react'

const PLACEHOLDER = '/img/photo-tiny.png'

const slideUp = defineVariant({
  name: 'slide-up',
  image: (ctx) => ({
    opacity: ctx.status === 'loaded' ? 1 : 0,
    transform: ctx.status === 'loaded' ? 'none' : 'translateY(16px)',
    transition: `opacity ${ctx.duration}ms ${ctx.easing}, transform ${ctx.duration}ms ${ctx.easing}`,
  }),
})

interface Demo {
  title: string
  variant: VariantName | ImageVariant
  placeholder?: boolean
  color?: string
}

const demos: Demo[] = [
  { title: 'fade + color', variant: 'fade', color: '#2b3a55' },
  { title: 'fade + placeholder', variant: 'fade', placeholder: true },
  { title: 'blur', variant: 'blur', placeholder: true },
  { title: 'blur({ amount: 40 })', variant: blur({ amount: 40 }), placeholder: true },
  { title: 'pixelate + placeholder', variant: 'pixelate', placeholder: true },
  { title: 'pixelate({ size: 64 }) no placeholder', variant: pixelate({ size: 64 }) },
  { title: 'reveal', variant: 'reveal', placeholder: true },
  {
    title: "reveal({ from: 'bottom' }) + color",
    variant: reveal({ from: 'bottom' }),
    color: '#3b2f4f',
  },
  { title: 'bar', variant: bar(), placeholder: true, color: '#1f2a24' },
  { title: 'custom slide-up', variant: slideUp, color: '#2a2a2a' },
]

function Card({
  demo,
  src,
  progressive,
  duration,
}: {
  demo: Demo
  src: string
  progressive: boolean
  duration: number
}) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('loading')
  return (
    <div className="card">
      <h2>
        {demo.title}
        <span>
          {status} {Math.round(progress * 100)}%
        </span>
      </h2>
      <Image
        src={src}
        alt=""
        width={1600}
        height={1000}
        placeholder={demo.placeholder ? PLACEHOLDER : undefined}
        variant={demo.variant}
        color={demo.color}
        progressive={progressive}
        duration={duration}
        onProgress={setProgress}
        onStatusChange={setStatus}
        fallback={<div style={{ padding: 24 }}>failed to load</div>}
      />
    </div>
  )
}

function HookDemo({ src }: { src: string }) {
  const { status, progress, imgProps } = useImageLoad({ src, progressive: true })
  return (
    <div className="hook-demo">
      <h2>useImageLoad</h2>
      <p>
        status: {status}, progress: {Math.round(progress * 100)}%
      </p>
      <progress value={progress} max={1} />
      <div>
        <img {...imgProps} alt="" width={240} style={{ opacity: status === 'loaded' ? 1 : 0.2 }} />
      </div>
    </div>
  )
}

export function ImageDemo() {
  const [nonce, setNonce] = useState(0)
  const [delay, setDelay] = useState(3000)
  const [duration, setDuration] = useState(800)
  const [progressive, setProgressive] = useState(true)
  const [broken, setBroken] = useState(false)

  const file = broken ? 'missing.png' : 'photo.png'
  const src = `/slow/${delay}/${file}?v=${nonce}`

  return (
    <>
      <h1>@uiness/image playground</h1>
      <div className="controls">
        <button type="button" onClick={() => setNonce((n) => n + 1)}>
          Reload images
        </button>
        <label>
          network delay
          <input
            type="range"
            min={0}
            max={8000}
            step={500}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
          />
          {delay} ms
        </label>
        <label>
          duration
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          {duration} ms
        </label>
        <label>
          <input
            type="checkbox"
            checked={progressive}
            onChange={(e) => setProgressive(e.target.checked)}
          />
          progressive
        </label>
        <label>
          <input type="checkbox" checked={broken} onChange={(e) => setBroken(e.target.checked)} />
          broken src
        </label>
      </div>
      <div className="grid">
        {demos.map((demo) => (
          <Card
            key={`${demo.title}-${nonce}`}
            demo={demo}
            src={src}
            progressive={progressive}
            duration={duration}
          />
        ))}
      </div>
      <HookDemo key={nonce} src={src} />
    </>
  )
}
