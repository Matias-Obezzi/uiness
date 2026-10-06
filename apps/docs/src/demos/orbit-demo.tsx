import {
  Cloud,
  Code,
  Database,
  GitBranch,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Orbit, OrbitItem } from '@/components/ui/orbit'

const inner = { code: Code, database: Database, lock: Lock }
const outer = { globe: Globe, mail: Mail, cloud: Cloud, git: GitBranch, chat: MessageSquare }

export default function OrbitDemo() {
  return (
    <div className="relative flex size-80 items-center justify-center">
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-8 ring-primary/10">
        <Sparkles className="size-7" />
      </div>
      <Orbit radius={72} duration={14} pauseOnHover>
        {Object.entries(inner).map(([name, Icon]) => (
          <OrbitItem
            key={name}
            className="size-9 rounded-full border bg-background text-foreground shadow-sm"
          >
            <Icon className="size-4" />
          </OrbitItem>
        ))}
      </Orbit>
      <Orbit
        radius={136}
        duration={26}
        reverse
        pauseOnHover
        className="[&>[data-slot=orbit-path]]:border-dashed"
      >
        {Object.entries(outer).map(([name, Icon]) => (
          <OrbitItem
            key={name}
            className="size-11 rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <Icon className="size-5" />
          </OrbitItem>
        ))}
      </Orbit>
    </div>
  )
}
