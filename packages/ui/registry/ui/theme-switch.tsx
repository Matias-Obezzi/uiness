'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import * as React from 'react'
import { flushSync } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export type Theme = 'light' | 'dark'

/** How the new theme arrives over the old one. */
export type ThemeTransitionVariant = 'eclipse' | 'split' | 'rise' | 'fade'

export interface ThemeTransitionOptions {
  /** Default `eclipse`. */
  variant?: ThemeTransitionVariant
  /** Where the eclipse starts: an element (its center) or a point in the viewport. Default the center of the screen. */
  origin?: Element | { x: number; y: number } | null
  /** Milliseconds. Default 500. */
  duration?: number
  /** A CSS easing. Default an emphasized ease out. */
  easing?: string
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>
    finished: Promise<void>
  }
}

function frames(variant: ThemeTransitionVariant, origin: ThemeTransitionOptions['origin']) {
  if (variant === 'fade') return { opacity: [0, 1] }
  if (variant === 'split') return { clipPath: ['inset(0 50% 0 50%)', 'inset(0 0 0 0)'] }
  if (variant === 'rise') return { clipPath: ['inset(100% 0 0 0)', 'inset(0 0 0 0)'] }
  let x = innerWidth / 2
  let y = innerHeight / 2
  if (origin instanceof Element) {
    const rect = origin.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top + rect.height / 2
  } else if (origin) {
    x = origin.x
    y = origin.y
  }
  // Far enough to cover the corner furthest from where it starts.
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  return { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }
}

/**
 * Returns a function that runs a theme change inside a view transition, so the new theme
 * sweeps over the page instead of snapping. Without the View Transitions API, or with reduced
 * motion, it just runs the change.
 *
 * ```ts
 * const transition = useThemeTransition()
 * transition(() => setTheme('dark'), { variant: 'eclipse', origin: event.currentTarget })
 * ```
 */
function useThemeTransition() {
  const reduced = useReducedMotion()
  return React.useCallback(
    async (update: () => void, options: ThemeTransitionOptions = {}) => {
      const { variant = 'eclipse', origin, duration = 500, easing } = options
      const doc = document as ViewTransitionDocument
      if (reduced || typeof doc.startViewTransition !== 'function') {
        update()
        return
      }
      const root = document.documentElement
      // Switches off the browser's own cross fade for this transition only (see the CSS).
      root.dataset.themeTransition = variant
      // flushSync so the new theme is in the DOM when the browser takes its snapshot.
      const transition = doc.startViewTransition(() => flushSync(update))
      try {
        await transition.ready
        root.animate(frames(variant, origin), {
          duration,
          easing: easing ?? 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        })
        await transition.finished
      } catch {
        // A transition skipped by the browser still applied the update.
      } finally {
        delete root.dataset.themeTransition
      }
    },
    [reduced],
  )
}

export interface ThemeSwitchLabels {
  /** Name of the switch, which is on in the dark theme. */
  darkMode: string
}

export const defaultThemeSwitchLabels: ThemeSwitchLabels = {
  darkMode: 'Dark mode',
}

export interface ThemeSwitchProps
  extends Omit<ButtonProps, 'onClick' | 'role' | 'aria-checked' | 'asChild' | 'variant'> {
  /** The theme now. */
  theme: Theme
  /** Called with the other theme when pressed. Set your theme here. */
  onThemeChange: (theme: Theme) => void
  /** How the page changes. Default `eclipse`, a circle growing from the switch. */
  variant?: ThemeTransitionVariant
  /** Milliseconds the page change takes. Default 500. */
  duration?: number
  /** Accessible name. Default "Dark mode". */
  label?: string
  /** The Button variant of the switch itself. Default `ghost`. */
  buttonVariant?: ButtonProps['variant']
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<ThemeSwitchLabels>
}

/**
 * A light and dark switch that animates the whole page into the new theme. It does not know
 * your theme library: pass the `theme` and set it in `onThemeChange`.
 */
function ThemeSwitch({
  theme,
  onThemeChange,
  variant = 'eclipse',
  duration,
  label: labelProp,
  labels: labelsProp,
  buttonVariant = 'ghost',
  size,
  className,
  children,
  ...props
}: ThemeSwitchProps) {
  const labels = useLabels('theme-switch', defaultThemeSwitchLabels, labelsProp)
  const label = labelProp ?? labels.darkMode
  const transition = useThemeTransition()
  const dark = theme === 'dark'
  return (
    <Button
      role="switch"
      aria-checked={dark}
      aria-label={children ? undefined : label}
      data-slot="theme-switch"
      data-theme={theme}
      variant={buttonVariant}
      size={size ?? (children ? 'default' : 'icon')}
      className={cn('group/theme-switch', className)}
      onClick={(e) => {
        const next = dark ? 'light' : 'dark'
        void transition(() => onThemeChange(next), {
          variant,
          duration,
          origin: e.currentTarget,
        })
      }}
      {...props}
    >
      {/* The sun turns away as the moon turns in, one rotation rather than two fades. */}
      <span aria-hidden="true" className="grid place-items-center *:col-start-1 *:row-start-1">
        <SunIcon className="transition-[rotate,scale,opacity] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) group-data-[theme=dark]/theme-switch:rotate-90 group-data-[theme=dark]/theme-switch:scale-0 group-data-[theme=dark]/theme-switch:opacity-0 motion-reduce:transition-none" />
        <MoonIcon className="-rotate-90 scale-0 opacity-0 transition-[rotate,scale,opacity] duration-(--duration-slow,300ms) ease-(--easing-emphasized,cubic-bezier(0.16,1,0.3,1)) group-data-[theme=dark]/theme-switch:rotate-0 group-data-[theme=dark]/theme-switch:scale-100 group-data-[theme=dark]/theme-switch:opacity-100 motion-reduce:transition-none" />
      </span>
      {children}
    </Button>
  )
}

export { ThemeSwitch, useThemeTransition }
