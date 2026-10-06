import { PartyPopper, Rocket, Sparkles, Star } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ConfettiButton, confetti } from '@/components/ui/confetti'

const stars = ['#ffe066', '#fcc419', '#fab005', '#fff3bf']

/** Keeps firing `shoot` every `every` ms for `ms` ms, and stops if the demo goes away. */
function useVolley() {
  const timer = React.useRef<ReturnType<typeof setInterval>>(undefined)
  React.useEffect(
    () => () => {
      clearInterval(timer.current)
      confetti.reset()
    },
    [],
  )
  return (shoot: () => void, ms: number, every: number) => {
    clearInterval(timer.current)
    const end = Date.now() + ms
    shoot()
    timer.current = setInterval(() => {
      if (Date.now() > end) return clearInterval(timer.current)
      shoot()
    }, every)
  }
}

export default function ConfettiDemo() {
  const volley = useVolley()

  const sideCannons = () =>
    volley(
      () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          velocity: 60,
          origin: { x: 0, y: 0.7 },
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          velocity: 60,
          origin: { x: 1, y: 0.7 },
        })
      },
      1200,
      30,
    )

  const starShower = (e: React.MouseEvent<HTMLButtonElement>) => {
    const base = {
      element: e.currentTarget,
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.94,
      velocity: 30,
      colors: stars,
    }
    confetti({ ...base, particleCount: 40, scalar: 1.4, shapes: ['star'] })
    confetti({ ...base, particleCount: 15, scalar: 0.6, shapes: ['circle'] })
  }

  const fireworks = () =>
    volley(
      () => {
        const x = 0.15 + Math.random() * 0.7
        confetti({
          particleCount: 45,
          spread: 360,
          velocity: 28,
          ticks: 70,
          gravity: 0.6,
          origin: { x, y: 0.15 + Math.random() * 0.35 },
        })
      },
      2500,
      350,
    )

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="space-y-1.5">
        <p className="text-eyebrow text-muted-foreground uppercase">Order #4021</p>
        <h3 className="text-heading">You shipped it.</h3>
        <p className="text-muted-foreground text-sm">Time to celebrate, in four flavours.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <ConfettiButton asChild options={{ particleCount: 80, spread: 70 }}>
          <Button>
            <PartyPopper />
            Burst
          </Button>
        </ConfettiButton>
        <Button variant="outline" onClick={sideCannons}>
          <Rocket />
          Side cannons
        </Button>
        <Button variant="outline" onClick={starShower}>
          <Star />
          Stars
        </Button>
        <Button variant="outline" onClick={fireworks}>
          <Sparkles />
          Fireworks
        </Button>
      </div>
    </div>
  )
}
