'use client'

import { type Offset, observeScrollProgress } from '@uiness/scroll'
import * as React from 'react'
import { type ScrollDriver, useScrollDriver, viewTimelineFor } from '@/hooks/use-scroll-driver'
import { cn } from '@/lib/utils'

export interface TextRevealProps extends Omit<React.ComponentProps<'p'>, 'children'> {
  /** The paragraph. Split into words on whitespace. */
  text: string
  /** Opacity of a word not reached yet, 0 to 1. Default 0.15. */
  from?: number
  /**
   * When the reveal starts and ends, as `@uiness/scroll` offsets. Default from the top of the
   * paragraph at 85% down the viewport to its bottom at 45%.
   */
  offset?: Offset
  /**
   * Scrolling ancestor. Left out, the nearest one that actually scrolls is used, or the
   * window. Pass `null` to always follow the window. Naming one makes `auto` use JavaScript.
   */
  container?: HTMLElement | null
  /**
   * What drives the reveal. `css` runs on CSS scroll-driven animations, without JavaScript;
   * where the browser has none the paragraph is simply fully visible. `js` measures the scroll
   * with `@uiness/scroll`. `auto` uses CSS where it can and JavaScript elsewhere. Default `auto`.
   */
  driver?: ScrollDriver
}

const defaultOffset: Offset = ['start 0.85', 'end 0.45']

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * A paragraph whose words light up one after another as it scrolls through the viewport.
 *
 * With CSS scroll-driven animations each word runs its own animation on a view timeline of the
 * paragraph, so it works with JavaScript off. Otherwise the scroll progress goes into a single
 * CSS variable, so nothing re-renders while scrolling. The text is always in the document for
 * screen readers and crawlers, fully visible before any of this kicks in, and with reduced motion.
 */
function TextReveal({
  text,
  from = 0.15,
  offset = defaultOffset,
  container,
  driver = 'auto',
  className,
  style,
  ...props
}: TextRevealProps) {
  const ref = React.useRef<HTMLParagraphElement>(null)
  const words = text.split(/\s+/).filter(Boolean)
  const offsetKey = JSON.stringify(offset)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key stands for the offset
  const range = React.useMemo(() => viewTimelineFor(offset), [offsetKey])
  const mode = useScrollDriver(ref, driver, { container, supported: range !== null })
  const css = mode === 'css' && range !== null

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || mode !== 'js') return
    const stop = observeScrollProgress(el, { offset, container }, ({ progress }) => {
      el.style.setProperty('--text-reveal-progress', progress.toFixed(4))
    })
    return () => {
      stop()
      el.style.removeProperty('--text-reveal-progress')
    }
  }, [mode, offsetKey, container])

  return (
    <p
      ref={ref}
      data-slot="text-reveal"
      data-driver={mode}
      className={cn('text-pretty', className)}
      style={
        {
          '--text-reveal-from': from,
          '--text-reveal-count': words.length,
          ...(css && { viewTimeline: '--text-reveal block', viewTimelineInset: range.inset }),
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {words.map((word, i) => (
        <React.Fragment
          // biome-ignore lint/suspicious/noArrayIndexKey: words are positional and may repeat
          key={i}
        >
          {i > 0 && ' '}
          <span
            data-slot="text-reveal-word"
            className={cn(
              'motion-reduce:opacity-100!',
              // Only the name is gated: without it the other animation properties do nothing.
              css &&
                'motion-safe:supports-[animation-timeline:view()]:[animation-name:text-reveal-word]',
            )}
            style={
              {
                '--i': i,
                // Each word fades in over its own slice of the progress, the next one follows.
                // Before JavaScript has measured anything the progress reads 1: all visible.
                opacity:
                  'clamp(var(--text-reveal-from), calc(var(--text-reveal-from) + (1 - var(--text-reveal-from)) * (var(--text-reveal-progress, 1) * var(--text-reveal-count) - var(--i))), 1)',
                ...(css && {
                  animationTimeline: '--text-reveal',
                  animationRange: `cover ${slice(range.start, range.end, i, words.length)}`,
                  animationDuration: 'auto',
                  animationFillMode: 'both',
                  animationTimingFunction: 'linear',
                }),
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        </React.Fragment>
      ))}
    </p>
  )
}

/** The part of the timeline, in percent, where word `i` of `count` fades in. */
function slice(start: number, end: number, i: number, count: number) {
  const at = (k: number) => `${Number((start + ((end - start) * k) / count).toFixed(4))}%`
  return `${at(i)} cover ${at(i + 1)}`
}

export { TextReveal }
