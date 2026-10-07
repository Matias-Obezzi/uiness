import { VideoText } from '@/components/ui/video-text'

export default function VideoTextDemo() {
  return (
    <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border bg-black text-white">
      <VideoText
        src="/video/text-video-background.webm#t=0.1"
        className="size-full"
        fontWeight={900}
      >
        FIRE
      </VideoText>
    </div>
  )
}
