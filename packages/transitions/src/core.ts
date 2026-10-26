/** How an element or the page comes in or goes out. */
export type Effect =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'slide'
  | 'slide-up'
  | 'scale'
  | 'blur'
  | 'none'

export type Direction = 'forward' | 'back'

/** What one element does when the page or the state around it changes. */
export interface Behavior {
  /**
   * Its view transition name. An element with the same name on both sides morphs from one
   * place and size to the other, like a thumbnail growing into a cover. Leave it out for a
   * name of its own.
   */
  name?: string
  /** Stays where it is, out of the page's animation: a header, a player, a tab bar. */
  persist?: boolean
  /** How it comes in when the other side has nothing with its name. */
  enter?: Effect
  /** How it goes out when the other side has nothing with its name. */
  exit?: Effect
  /** Gives each child its own name and starts it this many milliseconds after the one before; `true` is 40. */
  stagger?: boolean | number
  /** Milliseconds. */
  duration?: number
  easing?: string
  /** Milliseconds before it starts. */
  delay?: number
}

/** What the page as a whole does. */
export interface PageOptions {
  /** How one page replaces the other. Default `fade`. */
  page?: Effect
  /** Going back: `reverse` plays slides the other way, or another effect. Default `reverse`. */
  back?: 'reverse' | Effect
  /** Milliseconds, for everything that has no duration of its own. Default 300. */
  duration?: number
  /** For everything that has no easing of its own. */
  easing?: string
}

export interface TransitionOptions {
  /** Which way it goes. By default it is `back` when the history moved back during the update. */
  direction?: Direction
}

const STYLE_ATTR = 'data-uiness-transitions'
const DIRECTION_ATTR = 'data-transition-direction'
const STAGGER_MS = 40
/** Rules of a gone element are kept this long, so its exit can still play. */
const KEEP_MS = 3000

const canTransition = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function'

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Not in every TypeScript DOM lib yet.
type NavigationEntry = { index: number }
type NavigationLike = EventTarget & {
  currentEntry: NavigationEntry | null
  activation?: { navigationType: string; entry: NavigationEntry; from: NavigationEntry | null }
}
const navigationApi = () =>
  (globalThis as { navigation?: NavigationLike }).navigation as NavigationLike | undefined

/** Where in the history the page is: the Navigation API's index, or React Router's `idx`. */
function historyIndex(): number | undefined {
  const index = navigationApi()?.currentEntry?.index
  if (typeof index === 'number') return index
  const idx = (typeof history === 'undefined' ? undefined : history.state)?.idx
  return typeof idx === 'number' ? idx : undefined
}

function setDirection(direction: Direction) {
  document.documentElement.setAttribute(DIRECTION_ATTR, direction)
}

// ---------------------------------------------------------------------------------------------
// The stylesheet: keyframes once, then a block of rules for the page and for each name.

const blocks = new Map<string, { css: string; uses: number }>()
let page = ''
let sheet: HTMLStyleElement | null = null
let crossDocumentRule = ''

const BASE = `@keyframes uiness-vt-enter{from{opacity:var(--uiness-vt-o,1);translate:var(--uiness-vt-x,0) var(--uiness-vt-y,0);scale:var(--uiness-vt-s,1);filter:blur(var(--uiness-vt-b,0px))}}
@keyframes uiness-vt-exit{to{opacity:var(--uiness-vt-o,1);translate:var(--uiness-vt-x,0) var(--uiness-vt-y,0);scale:var(--uiness-vt-s,1);filter:blur(var(--uiness-vt-b,0px))}}
html[${DIRECTION_ATTR}=back]{--uiness-vt-dir:-1}
@media (prefers-reduced-motion: reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}`

function render() {
  if (typeof document === 'undefined') return
  if (!sheet?.isConnected) {
    sheet = document.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`)
    if (!sheet) {
      sheet = document.createElement('style')
      sheet.setAttribute(STYLE_ATTR, '')
      document.head.appendChild(sheet)
    }
  }
  const named = [...blocks.values()].map((b) => b.css)
  sheet.textContent = [crossDocumentRule, BASE, page, ...named].filter(Boolean).join('\n')
}

/** The custom properties and keyframes that play an effect on one side. */
function effectCss(effect: Effect, side: 'enter' | 'exit'): string {
  if (effect === 'none') return 'animation-name:none'
  const enter = side === 'enter'
  const vars: Record<Effect, string> = {
    none: '',
    fade: '--uiness-vt-o:0',
    'fade-up': `--uiness-vt-o:0;--uiness-vt-y:${enter ? 16 : -16}px`,
    'fade-down': `--uiness-vt-o:0;--uiness-vt-y:${enter ? -16 : 16}px`,
    // In from the far side, out a third of the way to the near one; the other way going back.
    slide: `--uiness-vt-x:calc(${enter ? 100 : -30}% * var(--uiness-vt-dir,1));mix-blend-mode:normal`,
    'slide-up': `--uiness-vt-y:calc(${enter ? 100 : -30}% * var(--uiness-vt-dir,1));mix-blend-mode:normal`,
    scale: `--uiness-vt-o:0;--uiness-vt-s:${enter ? 0.94 : 1.04}`,
    blur: '--uiness-vt-o:0;--uiness-vt-b:8px',
  }
  return `animation-name:uiness-vt-${side};${vars[effect]}`
}

function timingCss({ duration, easing, delay }: Pick<Behavior, 'duration' | 'easing' | 'delay'>) {
  return [
    duration !== undefined && `animation-duration:${duration}ms`,
    easing && `animation-timing-function:${easing}`,
    delay && `animation-delay:${delay}ms`,
  ]
    .filter(Boolean)
    .join(';')
}

/** The rules for one name. */
export function behaviorCss(name: string, behavior: Behavior): string {
  const part = (p: 'group' | 'old' | 'new') => `::view-transition-${p}(${name})`
  // Above what moves: a header or a tab bar stays on top, as on the page.
  if (behavior.persist)
    return `${part('group')}{animation:none;z-index:1}${part('old')}{display:none}${part('new')}{animation:none}`
  // The pseudo elements inside the group inherit its timing.
  const timing = timingCss(behavior)
  let css = timing ? `${part('group')}{${timing}}` : ''
  if (behavior.enter) css += `${part('new')}:only-child{${effectCss(behavior.enter, 'enter')}}`
  if (behavior.exit) css += `${part('old')}:only-child{${effectCss(behavior.exit, 'exit')}}`
  return css
}

/** The rules for the page as a whole. */
export function pageCss({ page = 'fade', back = 'reverse', duration = 300, easing }: PageOptions) {
  const root = (effect: Effect, prefix = '') =>
    `${prefix}::view-transition-old(root){${effectCss(effect, 'exit')}}${prefix}::view-transition-new(root){${effectCss(effect, 'enter')}}`
  let css = `::view-transition-group(*){${timingCss({ duration, easing: easing ?? 'cubic-bezier(0.2, 0, 0, 1)' })}}`
  css += root(page)
  // Another effect going back, played forwards.
  if (back !== 'reverse')
    css += root(back, `html[${DIRECTION_ATTR}=back]`).replaceAll('{', '{--uiness-vt-dir:1;')
  return css
}

/**
 * Adds the rules for a name and returns what takes them away. Rules of a name still in use
 * elsewhere stay, and they outlive the element a moment so its exit can play.
 */
export function define(name: string, behavior: Behavior): () => void {
  const css = behaviorCss(name, behavior)
  const block = blocks.get(name)
  blocks.set(name, { css, uses: (block?.uses ?? 0) + 1 })
  render()
  let done = false
  return () => {
    if (done) return
    done = true
    setTimeout(() => {
      const current = blocks.get(name)
      if (!current) return
      if (current.uses > 1) current.uses--
      else blocks.delete(name)
      render()
    }, KEEP_MS)
  }
}

/** Sets how the page as a whole changes. Returns what puts the default back. */
export function definePage(options: PageOptions = {}): () => void {
  const css = pageCss(options)
  page = css
  render()
  return () => {
    if (page !== css) return
    page = ''
    render()
  }
}

let seq = 0
/** A name no other element has. */
export const uniqueName = () => `uiness-vt-${++seq}`

/**
 * Gives an element a name and its behavior; with `stagger`, each of its children instead.
 * Returns what takes them away.
 */
export function mark(element: HTMLElement, behavior: Behavior = {}): () => void {
  const { stagger, ...rest } = behavior
  const name = behavior.name ?? uniqueName()
  const step = stagger === true ? STAGGER_MS : stagger || 0
  const targets = stagger
    ? [...element.children].filter((c): c is HTMLElement => c instanceof HTMLElement)
    : [element]
  const undo = targets.map((target, i) => {
    const own = stagger ? `${name}-${i}` : name
    target.style.setProperty('view-transition-name', own)
    const remove = define(own, { ...rest, delay: (rest.delay ?? 0) + i * step })
    return () => {
      if (target.style.getPropertyValue('view-transition-name') === own)
        target.style.removeProperty('view-transition-name')
      remove()
    }
  })
  return () => {
    for (const u of undo) u()
  }
}

/**
 * Runs `update` inside a view transition, so whatever it changes animates as defined. Where
 * view transitions are missing or motion is reduced, it just runs `update`. The returned
 * promise settles when the animation is over.
 */
export async function transition(
  update: () => void | Promise<void>,
  options: TransitionOptions = {},
): Promise<void> {
  if (!canTransition() || reducedMotion()) {
    await update()
    return
  }
  const before = historyIndex()
  const vt = document.startViewTransition(async () => {
    await update()
    const after = historyIndex()
    setDirection(
      options.direction ??
        (before !== undefined && after !== undefined && after < before ? 'back' : 'forward'),
    )
  })
  await vt.finished.catch(() => {})
}

/**
 * Keeps the page's direction up to date for transitions started by others, such as React
 * Router's `viewTransition`: `back` while the history moves back. Returns what stops it.
 */
export function watchDirection(): () => void {
  if (typeof window === 'undefined') return () => {}
  const nav = navigationApi()
  if (nav) {
    const onNavigate = (event: Event) => {
      const e = event as Event & { navigationType: string; destination: NavigationEntry }
      const current = nav.currentEntry?.index ?? 0
      setDirection(
        e.navigationType === 'traverse' && e.destination.index < current ? 'back' : 'forward',
      )
    }
    nav.addEventListener('navigate', onNavigate)
    return () => nav.removeEventListener('navigate', onNavigate)
  }
  // shortcut: without the Navigation API only React Router's `idx` tells back from forward,
  // and only on popstate; pushes reset it on the next click. Drop once Navigation API is everywhere.
  let last = historyIndex()
  const onPop = () => {
    const now = historyIndex()
    setDirection(now !== undefined && last !== undefined && now < last ? 'back' : 'forward')
    last = now
  }
  const onClick = () => {
    setDirection('forward')
    last = historyIndex()
  }
  window.addEventListener('popstate', onPop)
  document.addEventListener('click', onClick, true)
  return () => {
    window.removeEventListener('popstate', onPop)
    document.removeEventListener('click', onClick, true)
  }
}

const ATTRS = ['name', 'persist', 'enter', 'exit', 'stagger', 'duration', 'easing', 'delay']

/**
 * Marks every element with `data-transition-*` attributes under `root`: `data-transition-name`,
 * `-persist`, `-enter`, `-exit`, `-stagger`, `-duration`, `-easing` and `-delay`. Returns what
 * takes them away.
 */
export function scan(root: ParentNode = document): () => void {
  const selector = ATTRS.map((a) => `[data-transition-${a}]`).join(',')
  const undo = [...root.querySelectorAll<HTMLElement>(selector)].map((el) => {
    const d = el.dataset
    const number = (v: string | undefined) => (v === undefined || v === '' ? undefined : Number(v))
    return mark(el, {
      name: d.transitionName || undefined,
      persist: d.transitionPersist !== undefined && d.transitionPersist !== 'false',
      enter: d.transitionEnter as Effect | undefined,
      exit: d.transitionExit as Effect | undefined,
      stagger:
        d.transitionStagger === undefined ? undefined : (number(d.transitionStagger) ?? true),
      duration: number(d.transitionDuration),
      easing: d.transitionEasing,
      delay: number(d.transitionDelay),
    })
  })
  return () => {
    for (const u of undo) u()
  }
}

/**
 * For sites of separate pages: turns on view transitions between documents of the same
 * origin, with the page effect and `data-transition-*` elements, and the direction on going
 * back. Call it on every page, as early as the elements exist. Returns what turns it off.
 */
export function crossDocument(options: PageOptions = {}): () => void {
  if (typeof document === 'undefined') return () => {}
  crossDocumentRule = '@view-transition{navigation:auto}'
  const undoPage = definePage(options)
  let undoScan = scan()
  // Elements parsed after the first scan: by the first frame, and once the page is whole.
  const rescan = () => {
    undoScan()
    undoScan = scan()
  }
  const onReveal = () => {
    const activation = navigationApi()?.activation
    const back =
      activation?.navigationType === 'traverse' &&
      activation.from !== null &&
      activation.entry.index < activation.from.index
    setDirection(back ? 'back' : 'forward')
    rescan()
  }
  window.addEventListener('pagereveal', onReveal)
  document.addEventListener('DOMContentLoaded', rescan)
  return () => {
    window.removeEventListener('pagereveal', onReveal)
    document.removeEventListener('DOMContentLoaded', rescan)
    crossDocumentRule = ''
    undoScan()
    undoPage()
  }
}
