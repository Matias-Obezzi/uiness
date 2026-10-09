import { choreograph } from './choreograph'
import type { Choreography, ChoreoOptions } from './types'

declare global {
  interface Window {
    choreo?: Choreography
  }
}

/**
 * The drop-in build: `<script src=".../auto.global.js" defer></script>` and the page is
 * choreographed. Options come from `data-*` attributes on the script tag, such as
 * `data-debug`, `data-once="false"`, `data-duration="900"`, `data-scrub` or
 * `data-exclude=".no-motion"`.
 */
function start() {
  const script = document.currentScript ?? document.querySelector('script[data-choreo-auto]')
  const data = (script as HTMLElement | null)?.dataset ?? {}
  const flag = (value: string | undefined) => (value === undefined ? undefined : value !== 'false')
  const number = (value: string | undefined) => (value === undefined ? undefined : Number(value))
  const options: ChoreoOptions = {
    debug: flag(data.debug),
    once: flag(data.once),
    intro: flag(data.intro),
    hover: flag(data.hover),
    counters: flag(data.counters),
    observe: flag(data.observe),
    scrub: flag(data.scrub),
    duration: number(data.duration),
    stagger: number(data.stagger),
    maxStagger: number(data.maxStagger),
    distance: number(data.distance),
    offset: number(data.offset),
    exclude: data.exclude,
    easing: data.easing,
    reducedMotion: data.reducedMotion as ChoreoOptions['reducedMotion'],
  }
  for (const key of Object.keys(options) as (keyof ChoreoOptions)[]) {
    if (options[key] === undefined) delete options[key]
  }
  const run = () => {
    window.choreo = choreograph(options)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
  else run()
}

if (typeof document !== 'undefined') start()
