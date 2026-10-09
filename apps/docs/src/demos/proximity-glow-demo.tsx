import { BoltIcon, CloudIcon, GaugeIcon, LockIcon, PlugIcon, RocketIcon } from 'lucide-react'
import { ProximityGlow, ProximityGlowItem } from '@/components/ui/proximity-glow'

const cards = [
  { icon: RocketIcon, title: 'Ship fast', text: 'Deploys in seconds, rollbacks in one.' },
  { icon: LockIcon, title: 'Secure', text: 'Everything encrypted, at rest and on the way.' },
  { icon: GaugeIcon, title: 'Quick', text: 'Edge caching close to every reader.' },
  { icon: CloudIcon, title: 'Serverless', text: 'Scales to zero, and back up.' },
  { icon: PlugIcon, title: 'Integrations', text: 'Your tools, wired in minutes.' },
  { icon: BoltIcon, title: 'Realtime', text: 'Changes everywhere as they happen.' },
]

export default function ProximityGlowDemo() {
  return (
    <ProximityGlow className="grid w-full gap-3 sm:grid-cols-3">
      {cards.map(({ icon: Icon, title, text }) => (
        <ProximityGlowItem key={title} className="p-5">
          <Icon className="mb-3 size-5 text-muted-foreground" />
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-muted-foreground text-sm">{text}</p>
        </ProximityGlowItem>
      ))}
    </ProximityGlow>
  )
}
