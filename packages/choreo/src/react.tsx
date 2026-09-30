import * as React from 'react'
import { choreograph } from './choreograph'
import type { Choreography, ChoreoOptions, PlanItem } from './types'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export interface UseChoreoOptions extends Omit<ChoreoOptions, 'root'> {
  /** What to animate: a ref, an element, or nothing for the whole `document.body`. */
  root?: React.RefObject<Element | null> | Element | null
  /** Turn it off without unmounting. Default true. */
  enabled?: boolean
}

export interface ChoreoControls {
  /** Hide everything again and play it back as it comes into view. */
  replay(): void
  /** Inspect the page again for elements that were not there before. */
  refresh(): void
  /** What was found, updated as the page changes. */
  plan: PlanItem[]
}

const isRef = (value: unknown): value is React.RefObject<Element | null> =>
  typeof value === 'object' && value !== null && 'current' in value

/**
 * Choreographs everything under `root` for as long as the component is mounted. Runs before
 * the first paint, so nothing is seen in its final place and then snapped back to hide.
 */
export function useChoreo({
  root,
  enabled = true,
  onPlan,
  ...options
}: UseChoreoOptions = {}): ChoreoControls {
  const instance = React.useRef<Choreography | null>(null)
  const [plan, setPlan] = React.useState<PlanItem[]>([])
  const onPlanRef = React.useRef(onPlan)
  onPlanRef.current = onPlan
  // Options arrive as a fresh object every render; only their content should restart it.
  const key = JSON.stringify(options)

  useIsomorphicLayoutEffect(() => {
    if (!enabled) return
    const element = isRef(root) ? root.current : root
    if (root !== undefined && !element) return
    const choreo = choreograph({
      ...options,
      root: element ?? undefined,
      onPlan: (next) => {
        setPlan(next)
        onPlanRef.current?.(next)
      },
    })
    instance.current = choreo
    return () => {
      choreo.stop()
      instance.current = null
    }
  }, [enabled, root, key])

  return React.useMemo(
    () => ({
      replay: () => instance.current?.replay(),
      refresh: () => instance.current?.refresh(),
      plan,
    }),
    [plan],
  )
}

export interface ChoreoProps
  extends Omit<UseChoreoOptions, 'root'>,
    Omit<React.ComponentProps<'div'>, keyof UseChoreoOptions> {}

/**
 * With children, animates them inside a `div`. Without, animates the whole page: drop
 * `<Choreo />` once near the root of an app and every page it renders comes alive.
 */
export function Choreo({
  children,
  effects,
  exclude,
  max,
  hover,
  counters,
  duration,
  stagger,
  maxStagger,
  distance,
  easing,
  offset,
  once,
  intro,
  observe,
  reducedMotion,
  debug,
  onPlan,
  enabled,
  ...props
}: ChoreoProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const scoped = children !== undefined && children !== null
  useChoreo({
    root: scoped ? ref : undefined,
    effects,
    exclude,
    max,
    hover,
    counters,
    duration,
    stagger,
    maxStagger,
    distance,
    easing,
    offset,
    once,
    intro,
    observe,
    reducedMotion,
    debug,
    onPlan,
    enabled,
  })
  if (!scoped) return null
  return (
    <div ref={ref} data-slot="choreo" {...props}>
      {children}
    </div>
  )
}
