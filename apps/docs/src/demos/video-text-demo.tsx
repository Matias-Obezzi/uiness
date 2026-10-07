import { VideoText } from '@/components/ui/video-text'

export default function VideoTextDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border bg-black text-white">
      <VideoText
        src="https://cdn.magicui.design/ocean-small.webm"
        poster="/img/gallery-1.png"
        className="size-full"
        fontWeight={900}
      >
        OCEAN
      </VideoText>
    </div>
  )
}
