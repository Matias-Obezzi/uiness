import { CreditCard, MessageCircle, Star, UserPlus } from 'lucide-react'
import { AnimatedList } from '@/ui/animated-list'

const notifications = [
  {
    icon: CreditCard,
    title: 'Payment received',
    body: '$1,280.00 from Acme',
    time: '8m',
    tint: 'from-emerald-400 to-teal-500',
  },
  {
    icon: MessageCircle,
    title: 'New message',
    body: 'Ada: "Shipped it, take a look?"',
    time: '3m',
    tint: 'from-sky-400 to-indigo-500',
  },
  {
    icon: UserPlus,
    title: 'New signup',
    body: 'grace@hopper.dev joined the team',
    time: '1m',
    tint: 'from-amber-400 to-orange-500',
  },
  {
    icon: Star,
    title: 'Starred',
    body: 'uiness passed 5,000 stars',
    time: 'now',
    tint: 'from-pink-400 to-rose-500',
  },
]

export default function AnimatedListDemo() {
  return (
    <div className="relative h-[300px] w-full max-w-sm overflow-hidden">
      <AnimatedList loop delay={1600} max={4} className="p-1">
        {notifications.map((n) => (
          <figure
            key={n.title}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white ${n.tint}`}
            >
              <n.icon className="size-5" />
            </span>
            <figcaption className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium text-sm">
                {n.title}
                <span className="text-muted-foreground text-xs">· {n.time}</span>
              </p>
              <p className="truncate text-muted-foreground text-sm">{n.body}</p>
            </figcaption>
          </figure>
        ))}
      </AnimatedList>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background" />
    </div>
  )
}
