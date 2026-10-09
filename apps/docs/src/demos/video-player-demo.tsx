import { VideoPlayer } from '@/components/ui/video-player'

export default function VideoPlayerDemo() {
  return (
    <VideoPlayer
      src="/video/text-video-background.webm"
      preload="metadata"
      loop
      className="aspect-video w-full max-w-2xl"
    >
      <track kind="captions" src="/video/text-video-background.vtt" srcLang="en" label="English" />
    </VideoPlayer>
  )
}
