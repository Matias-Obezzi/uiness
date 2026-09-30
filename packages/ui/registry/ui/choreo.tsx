'use client'

import { type ChoreoProps, Choreo as ChoreoRoot } from '@uiness/choreo'

export type {
  ChoreoControls,
  Choreography,
  ChoreoOptions,
  Effect,
  PlanItem,
  Role,
  UseChoreoOptions,
} from '@uiness/choreo'
export { choreograph, scan, useChoreo } from '@uiness/choreo'

/**
 * Components that already move on their own. Choreographing them as well would play two
 * entrances on top of each other, so they are left to themselves.
 */
export const selfAnimated = [
  'reveal',
  'text-generate',
  'typewriter',
  'flip-words',
  'number-ticker',
  'marquee',
  'sparkles',
  'meteors',
  'aurora',
  'tracing-beam',
  'timeline',
  'sticky-scroll',
  'parallax-grid',
  'compare',
  'scramble-text',
  'text-reveal',
  'odometer',
  'animated-list',
  'card-stack',
  'velocity-marquee',
  'terminal',
  'orbit',
  'sonar',
  'retro-grid',
]
  .map((slot) => `[data-slot="${slot}"]`)
  .join(', ')

/**
 * `<Choreo />` that knows the rest of the registry: it skips the components that animate
 * themselves and times everything with the theme's `--easing-emphasized`. Mount it once
 * near the root to animate every page, or wrap a section to animate only that.
 */
function Choreo({ exclude, ...props }: ChoreoProps) {
  return <ChoreoRoot exclude={exclude ? `${selfAnimated}, ${exclude}` : selfAnimated} {...props} />
}

export { Choreo }
