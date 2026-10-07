'use client'

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { useMotionReady } from '@/hooks/use-motion-ready'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

export interface MorphingTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Array of phrases to cycle through. */
  texts: string[]
  /** Duration of the morphing phase in seconds. Default `1`. */
  morphTime?: number
  /** Pause between morph transitions in seconds. Default `0.25`. */
  cooldownTime?: number
  /** HTML element to render as the root container. Default `'span'`. */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'
}

/**
 * Morphs between full words using an SVG threshold filter to create a liquid gooey transition.
 *
 * For letter-by-letter rearrangement where shared characters glide into place, see TextMorph instead.
 * Screen readers announce the active word via a live region. With reduced motion, it performs
 * a gentle opacity crossfade without blurs or liquid filters.
 */
function MorphingText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  as: Component = 'span',
  className,
  style,
  ...props
}: MorphingTextProps) {
  const containerRef = React.useRef<HTMLElement>(null)
  const text1Ref = React.useRef<HTMLSpanElement>(null)
  const text2Ref = React.useRef<HTMLSpanElement>(null)
  const Comp = Component as React.ElementType

  const id = React.useId()
  const filterId = `morphing-text-filter-${id.replace(/:/g, '')}`

  const motionReady = useMotionReady(containerRef)
  const isArmed = motionReady === 'armed'
  const reduced = useReducedMotion()
  const inView = useInView(containerRef, { once: false, amount: 0 })

  const [textIndex, setTextIndex] = React.useState(0)
  const [reducedIndex, setReducedIndex] = React.useState(0)

  // Reduced motion cycle: simple crossfade on a timer without continuous rAF loops.
  React.useEffect(() => {
    if (!reduced || texts.length < 2) return

    const totalInterval = (morphTime + cooldownTime) * 1000
    const timer = setInterval(() => {
      setReducedIndex((prev) => (prev + 1) % texts.length)
    }, totalInterval)

    return () => clearInterval(timer)
  }, [reduced, texts.length, morphTime, cooldownTime])

  // Liquid gooey animation loop via requestAnimationFrame, updating styles directly on refs.
  React.useEffect(() => {
    if (!isArmed || reduced || texts.length < 2) return

    let animationFrameId: number
    let lastTime = performance.now()
    let elapsedInCycle = 0
    let currentIndex = textIndex

    const currentTextEl = text1Ref.current
    const nextTextEl = text2Ref.current

    if (!currentTextEl || !nextTextEl) return

    const loop = (now: number) => {
      // Pause loop if the tab is hidden or element is scrolled out of view.
      if (document.visibilityState === 'hidden' || !inView) {
        lastTime = now
        animationFrameId = requestAnimationFrame(loop)
        return
      }

      const dt = (now - lastTime) / 1000
      lastTime = now
      elapsedInCycle += dt

      const totalCycle = cooldownTime + morphTime

      if (elapsedInCycle < cooldownTime) {
        // Cooldown period: primary text is sharp and fully visible.
        currentTextEl.style.filter = 'none'
        currentTextEl.style.opacity = '100%'
        nextTextEl.style.filter = 'none'
        nextTextEl.style.opacity = '0%'
      } else if (elapsedInCycle < totalCycle) {
        // Morphing transition: apply opposing blur and opacity curves.
        const fraction = Math.min(1, Math.max(0, (elapsedInCycle - cooldownTime) / morphTime))

        const blur1 = Math.min(8 / Math.max(0.001, 1 - fraction) - 8, 100).toFixed(2)
        const opacity1 = ((1 - fraction) ** 0.4 * 100).toFixed(2)

        const blur2 = Math.min(8 / Math.max(0.001, fraction) - 8, 100).toFixed(2)
        const opacity2 = (fraction ** 0.4 * 100).toFixed(2)

        currentTextEl.style.filter = `blur(${blur1}px)`
        currentTextEl.style.opacity = `${opacity1}%`
        nextTextEl.style.filter = `blur(${blur2}px)`
        nextTextEl.style.opacity = `${opacity2}%`
      } else {
        // Cycle finished: advance indices and reset cycle timer.
        elapsedInCycle = 0
        currentIndex = (currentIndex + 1) % texts.length
        setTextIndex(currentIndex)
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isArmed, reduced, inView, texts.length, morphTime, cooldownTime, textIndex])

  // Reduced motion view: smooth crossfade.
  if (reduced) {
    return (
      <Comp
        ref={containerRef}
        data-slot="morphing-text"
        className={cn('relative inline-block whitespace-nowrap align-baseline', className)}
        aria-live="polite"
        style={style}
        {...props}
      >
        <span
          key={reducedIndex}
          data-slot="morphing-text-word"
          className="inline-block transition-opacity duration-300 ease-in-out"
        >
          {texts[reducedIndex % texts.length]}
        </span>
      </Comp>
    )
  }

  // Render static first phrase during SSR or before hydration completes.
  if (!isArmed || texts.length === 0) {
    return (
      <Comp
        ref={containerRef}
        data-slot="morphing-text"
        className={cn('relative inline-block whitespace-nowrap align-baseline', className)}
        aria-live="polite"
        style={style}
        {...props}
      >
        <span data-slot="morphing-text-word">{texts[0] ?? ''}</span>
      </Comp>
    )
  }

  const currentWord = texts[textIndex % texts.length] ?? ''
  const nextWord = texts[(textIndex + 1) % texts.length] ?? ''

  return (
    <Comp
      ref={containerRef}
      data-slot="morphing-text"
      className={cn('relative inline-block whitespace-nowrap align-baseline', className)}
      aria-live="polite"
      style={
        {
          filter: `url(#${filterId})`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* SVG threshold filter that gives blurred text sharp, liquid edges */}
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <defs>
          <filter id={filterId}>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>

      {/* Active word exposed to assistive technologies */}
      <span ref={text1Ref} data-slot="morphing-text-word" className="inline-block select-none">
        {currentWord}
      </span>

      {/* Incoming word hidden from screen readers until it becomes active */}
      <span
        ref={text2Ref}
        aria-hidden="true"
        data-slot="morphing-text-next"
        className="absolute inset-0 inline-block select-none"
        style={{ opacity: '0%' }}
      >
        {nextWord}
      </span>
    </Comp>
  )
}

export { MorphingText }
