import { VinylCard } from '@/components/ui/vinyl-card'

export default function VinylCardDemo() {
  return (
    <VinylCard
      title="Night Harbour"
      artist="The Keepers"
      cover="/img/gallery-1.png"
      duration={214}
      defaultTime={48}
    />
  )
}
