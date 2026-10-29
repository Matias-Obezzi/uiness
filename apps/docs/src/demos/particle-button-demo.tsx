import { ParticleButton } from '@/components/ui/particle-button'

export default function ParticleButtonDemo() {
  return (
    <ParticleButton
      doneLabel="Published"
      onAction={() => new Promise((resolve) => setTimeout(resolve, 1200))}
    >
      Publish
    </ParticleButton>
  )
}
