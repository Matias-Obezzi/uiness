'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useMotionReady } from '@/hooks/use-motion-ready'
import { cn } from '@/lib/utils'

export interface TextGenerateProps extends Omit<React.ComponentProps<'p'>, 'children'> {
  /** The text. Words are animated one after another. */
  text: string
  /** Milliseconds between one word and the next. Default 80. */
  stagger?: number
  /** Milliseconds each word takes to appear. Default 600. */
  duration?: number
  /** Wait for the element to scroll into view. Default true. */
  whenVisible?: boolean
  /** Split by `word` or by `character`. Default word. */
  by?: 'word' | 'character'
  /** Milliseconds before the first word. Default 0. */
  delay?: number
}

/**
 * Text that appears one word at a time, each fading in from a blur. The full text is in
 * the DOM from the start, so it reads, selects and indexes like normal text.
 *
 * The server renders it fully visible. Words are only hidden once the component has mounted
 * with motion allowed (`data-animate` on the paragraph), so without JavaScript, or when the
 * server HTML is already on screen at hydration, the text simply stays.
 */
function TextGenerate({
  text,
  stagger = 80,
  duration = 600,
  whenVisible = true,
  by = 'word',
  delay = 0,
  className,
  ...props
}: TextGenerateProps) {
  const ref = React.useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref)
  const animate = useMotionReady(ref) === 'armed'
  const play = animate && (!whenVisible || inView)
  const parts = by === 'word' ? text.split(/(\s+)/) : Array.from(text)

  let index = 0
  return (
    <p
      ref={ref}
      data-slot="text-generate"
      data-state={!animate || play ? 'visible' : 'hidden'}
      data-animate={animate || undefined}
      className={cn(
        'motion-reduce:[&_span]:animate-none motion-reduce:[&_span]:opacity-100',
        className,
      )}
      {...props}
    >
      {parts.map((part, i) => {
        if (/^\s+$/.test(part)) return part
        const at = index++
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional by nature
            key={i}
            className={cn(
              'inline-block',
              animate && 'opacity-0 will-change-[opacity,filter,transform]',
            )}
            style={
              play
                ? {
                    animation: `blur-in ${duration}ms ease-out ${delay + at * stagger}ms forwards`,
                  }
                : undefined
            }
          >
            {part}
          </span>
        )
      })}
    </p>
  )
}

export { TextGenerate }
