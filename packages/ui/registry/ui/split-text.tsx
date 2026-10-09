'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface SplitTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  text: string
  /** How far letters start from their place, in pixels. Default 80. */
  spread?: number
  /** Milliseconds between letters. Default 30. */
  stagger?: number
  /** Milliseconds each letter takes to land. Default 700. */
  duration?: number
  /** Play when it scrolls into view, or as soon as it mounts. Default `view`. */
  trigger?: 'view' | 'mount'
}

/** The same scatter on the server and in the browser: a hash of the letter's place. */
const scatter = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/**
 * Letters scattered and turned that fly together into the text, one after another, as it comes
 * into view. Words never break across lines. Screen readers read the text once, and with
 * reduced motion it is simply there.
 */
function SplitText({
  text,
  spread = 80,
  stagger = 30,
  duration = 700,
  trigger = 'view',
  className,
  ...props
}: SplitTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [mounted, setMounted] = React.useState(false)
  // A frame later, so the scattered letters are painted once before they fly in.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const reduced = useReducedMotion()
  const shown = reduced || (trigger === 'mount' ? mounted : inView)

  let index = 0
  return (
    <span ref={ref} data-slot="split-text" className={cn('inline', className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((word, w) =>
          /^\s+$/.test(word) ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: the words are positions in the text
            <React.Fragment key={w}>{word}</React.Fragment>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: the words are positions in the text
            <span key={w} className="inline-block whitespace-nowrap">
              {Array.from(word).map((letter) => {
                const i = index++
                return (
                  <span
                    key={i}
                    className="inline-block transition-[translate,rotate,opacity,filter] ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) motion-reduce:transition-none"
                    style={
                      shown
                        ? {
                            transitionDuration: `${duration}ms`,
                            transitionDelay: `${i * stagger}ms`,
                          }
                        : {
                            translate: `${scatter(i, 1) * spread}px ${scatter(i, 2) * spread}px`,
                            rotate: `${scatter(i, 3) * 90}deg`,
                            opacity: 0,
                            filter: 'blur(4px)',
                          }
                    }
                  >
                    {letter}
                  </span>
                )
              })}
            </span>
          ),
        )}
      </span>
    </span>
  )
}

export { SplitText }
