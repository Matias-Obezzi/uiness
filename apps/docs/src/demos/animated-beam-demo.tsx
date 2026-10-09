import { DatabaseIcon, MailIcon, MessageSquareIcon, ServerIcon, SmartphoneIcon } from 'lucide-react'
import { type ReactNode, type RefObject, useRef } from 'react'
import { AnimatedBeam } from '@/components/ui/animated-beam'

function Node({ ref, children }: { ref: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  return (
    <div
      ref={ref}
      className="relative z-10 flex size-12 items-center justify-center rounded-full border bg-card shadow-sm [&_svg]:size-5"
    >
      {children}
    </div>
  )
}

export default function AnimatedBeamDemo() {
  const box = useRef<HTMLDivElement>(null)
  const mail = useRef<HTMLDivElement>(null)
  const chat = useRef<HTMLDivElement>(null)
  const phone = useRef<HTMLDivElement>(null)
  const hub = useRef<HTMLDivElement>(null)
  const db = useRef<HTMLDivElement>(null)
  return (
    <div ref={box} className="relative flex h-64 w-full max-w-lg items-center justify-between px-6">
      <div className="flex flex-col gap-8">
        <Node ref={mail}>
          <MailIcon />
        </Node>
        <Node ref={chat}>
          <MessageSquareIcon />
        </Node>
        <Node ref={phone}>
          <SmartphoneIcon />
        </Node>
      </div>
      <Node ref={hub}>
        <ServerIcon />
      </Node>
      <Node ref={db}>
        <DatabaseIcon />
      </Node>
      <AnimatedBeam containerRef={box} fromRef={mail} toRef={hub} curvature={-40} />
      <AnimatedBeam containerRef={box} fromRef={chat} toRef={hub} delay={0.6} />
      <AnimatedBeam containerRef={box} fromRef={phone} toRef={hub} curvature={40} delay={1.2} />
      <AnimatedBeam containerRef={box} fromRef={hub} toRef={db} duration={2} reverse />
    </div>
  )
}
