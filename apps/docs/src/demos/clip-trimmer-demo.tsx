import { ClipTrimmer } from '@/components/ui/clip-trimmer'

export default function ClipTrimmerDemo() {
  return (
    <ClipTrimmer
      src="/video/text-video-background.webm"
      defaultValue={[1, 6]}
      className="max-w-lg"
    />
  )
}
