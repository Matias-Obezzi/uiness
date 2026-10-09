/** What an element turned out to be once the page was inspected. */
export type Role =
  | 'heading'
  | 'text'
  | 'media'
  | 'card'
  | 'item'
  | 'button'
  | 'divider'
  | 'number'
  | 'custom'

/** How an element comes in. Directions name where it moves to, as in `Reveal`. */
export type Effect =
  | 'fade'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'scale'
  | 'blur'
  | 'zoom'
  | 'clip'
  | 'draw'
  | 'rotate'
  | 'flip'
  /** Word by word, for headings and short lines. */
  | 'words'
  | 'none'

/** A touch added on hover or press, through a stylesheet rather than script. */
export type Hover = 'lift' | 'press'

export interface PlanItem {
  element: HTMLElement | SVGElement
  role: Role
  effect: Effect
  /** Siblings found to be a list, a grid or a row share a group id. */
  group?: number
  /** Extra milliseconds before it starts, from `data-choreo-delay`. */
  delay: number
  hover?: Hover
  /** Elements, this one or inside it, holding a number that counts up as it comes in. */
  numbers: Element[]
}

export interface ScanOptions {
  /** Effect per role, merged over the defaults. */
  effects?: Partial<Record<Role, Effect>>
  /** Elements matching this selector, and everything inside them, are left alone. */
  exclude?: string
  /** Stop after this many elements. Default 400. */
  max?: number
  /** Add hover and press touches to cards and buttons. Default true. */
  hover?: boolean
  /** Count numbers up from zero. Default true. */
  counters?: boolean
}

export interface ChoreoOptions extends ScanOptions {
  /** What to animate. Default `document.body`. */
  root?: Element | null
  /** Milliseconds each entrance takes. Default 700. */
  duration?: number
  /** Milliseconds between elements that come in together. Default 70. */
  stagger?: number
  /** The longest a cascade may make anything wait, in milliseconds. Default 560. */
  maxStagger?: number
  /** Pixels things travel as they come in. Default 24. */
  distance?: number
  /** Any CSS easing. Defaults to the theme's `--easing-emphasized`, or an expo out. */
  easing?: string
  /** How far into the viewport an element has to be before it plays, 0 to 1. Default 0.1. */
  offset?: number
  /** Play each entrance once. With false it hides again when it leaves. Default true. */
  once?: boolean
  /** Animate what is already on screen when it starts. Default true. */
  intro?: boolean
  /** Watch for elements added later, such as a route change, and choreograph them too. Default true. */
  observe?: boolean
  /** With reduced motion asked for: do nothing, or only fade. Default `'skip'`. */
  reducedMotion?: 'skip' | 'fade'
  /** Outline every element found, colored by role, with a legend. */
  debug?: boolean
  /**
   * Tie each entrance to the scroll position instead of a clock: it plays forward as the
   * element scrolls in and backward as it scrolls out. Needs scroll driven animations
   * (`ViewTimeline`); without them entrances play on their own as usual.
   */
  scrub?: boolean
  /** Called as an element starts to come in, before its delay. */
  onEnter?: (item: PlanItem) => void
  /** Called with the plan every time it changes. */
  onPlan?: (plan: PlanItem[]) => void
}

export interface Choreography {
  /** Everything being animated, in document order. */
  readonly plan: PlanItem[]
  /** Hide everything again and play it back as it comes into view. */
  replay(): void
  /** Inspect the page again for elements that were not there before. */
  refresh(): void
  /**
   * Plays what is on screen out, in reverse, and resolves when it is gone: await it before
   * navigating away. Everything stays hidden until `replay()`.
   */
  leave(): Promise<void>
  /** Show everything, remove every trace and stop watching. */
  stop(): void
}
