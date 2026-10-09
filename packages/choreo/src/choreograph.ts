import { formatCount, parseCount } from './counter'
import { framesFor } from './effects'
import { createScanner } from './scan'
import type { Choreography, ChoreoOptions, PlanItem, Role } from './types'

interface Entry {
  item: PlanItem
  animations: Animation[]
  state: 'hidden' | 'playing' | 'done'
  /** Whether the observer has reported on it yet. */
  seen: boolean
  stopCounts: (() => void)[]
  /** Puts the text back after a word by word entrance. */
  unsplit?: () => void
}

type ViewTimelineClass = new (options: { subject: Element }) => AnimationTimeline

const FALLBACK_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const roleColors: Record<Role, string> = {
  heading: '#a855f7',
  text: '#0ea5e9',
  media: '#f59e0b',
  card: '#10b981',
  item: '#14b8a6',
  button: '#ec4899',
  divider: '#94a3b8',
  number: '#f97316',
  custom: '#6366f1',
}

const STYLE = `
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  [data-choreo-hover] {
    transition:
      translate var(--duration-slow, 300ms) var(--easing-emphasized, ${FALLBACK_EASING}),
      scale var(--duration-fast, 150ms) var(--easing-standard, ease-out);
  }
  [data-choreo-hover='lift']:hover { translate: 0 -4px; }
  [data-choreo-hover='press']:hover { translate: 0 -1px; }
  [data-choreo-hover='press']:active { translate: 0 0; scale: 0.97; }
}
${Object.entries(roleColors)
  .map(
    ([role, color]) =>
      `[data-choreo-debug] [data-choreo-role='${role}'] { outline: 1.5px dashed ${color}; outline-offset: 2px; }`,
  )
  .join('\n')}
`

let styleUsers = 0
let styleElement: HTMLStyleElement | null = null

function acquireStyle() {
  styleUsers++
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-choreo-style', '')
    styleElement.textContent = STYLE
    document.head.appendChild(styleElement)
  }
  return () => {
    styleUsers--
    if (styleUsers === 0) {
      styleElement?.remove()
      styleElement = null
    }
  }
}

const inert: Choreography = {
  plan: [],
  replay() {},
  leave: () => Promise.resolve(),
  refresh() {},
  stop() {},
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Top to bottom in rows, then left to right: the order a cascade plays in. */
function readingOrder(a: { item: PlanItem }, b: { item: PlanItem }) {
  const ra = a.item.element.getBoundingClientRect()
  const rb = b.item.element.getBoundingClientRect()
  return Math.round(ra.top / 8) - Math.round(rb.top / 8) || ra.left - rb.left
}

/**
 * Wraps every word under `el` in its own inline box, and returns how to put the original
 * text nodes back, the same nodes, so a framework holding them still finds them.
 */
function splitWords(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const texts: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue?.trim()) texts.push(node as Text)
  }
  const words: HTMLElement[] = []
  const swaps: [Text, Node[]][] = []
  for (const text of texts) {
    const parts = (text.nodeValue ?? '')
      .split(/(\s+)/)
      .filter(Boolean)
      .map((part) => {
        if (!part.trim()) return document.createTextNode(part)
        const word = document.createElement('span')
        word.style.display = 'inline-block'
        word.textContent = part
        words.push(word)
        return word
      })
    text.replaceWith(...parts)
    swaps.push([text, parts])
  }
  const restore = () => {
    for (const [text, parts] of swaps) {
      parts[0]?.parentNode?.insertBefore(text, parts[0])
      for (const part of parts) part.parentNode?.removeChild(part)
    }
  }
  return { words, restore }
}

function documentOrder(a: PlanItem, b: PlanItem) {
  const position = a.element.compareDocumentPosition(b.element)
  return position & 4 ? -1 : position & 2 ? 1 : 0
}

/**
 * Animates everything under `root` from what is already there. The page is inspected once,
 * each element gets a role and an entrance, and entrances play as elements scroll into view,
 * cascading when several arrive together. Elements added later are picked up as they appear.
 * Returns controls to replay, rescan or stop, which puts the page back exactly as it was.
 */
export function choreograph(options: ChoreoOptions = {}): Choreography {
  if (typeof document === 'undefined') return inert
  const root = options.root === undefined ? document.body : options.root
  if (!root) return inert

  const {
    duration = 700,
    stagger = 70,
    maxStagger = 560,
    distance = 24,
    offset = 0.1,
    once = true,
    intro = true,
    observe = true,
    reducedMotion = 'skip',
    counters = true,
    debug = false,
    onEnter,
    onPlan,
  } = options

  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const enabled = !(reduced && reducedMotion === 'skip')
  const fadeOnly = reduced && reducedMotion === 'fade'
  const canAnimate = enabled && typeof (root as HTMLElement).animate === 'function'
  const canObserve = typeof IntersectionObserver === 'function'
  const ViewTimeline = (globalThis as { ViewTimeline?: ViewTimelineClass }).ViewTimeline
  const scrubbing = !!options.scrub && canAnimate && typeof ViewTimeline === 'function'
  let easing = options.easing || token('--easing-emphasized') || FALLBACK_EASING

  const scanner = createScanner(options)
  const entries = new Map<Element, Entry>()
  // Words in a cascade wait on top of the delay the whole element gets.
  const lag = new WeakMap<Animation, number>()
  const units = new WeakSet<Element>()
  const releaseStyle = acquireStyle()
  let legend: HTMLElement | null = null

  const animateSafely = (el: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
    try {
      return el.animate(frames, { ...timing, easing })
    } catch {
      // An easing the browser cannot parse, such as `linear()` in an older engine.
      easing = FALLBACK_EASING
      return el.animate(frames, { ...timing, easing })
    }
  }

  const clear = (entry: Entry) => {
    for (const animation of entry.animations) animation.cancel()
    entry.animations = []
    for (const stopCount of entry.stopCounts) stopCount()
    entry.stopCounts = []
    entry.unsplit?.()
    entry.unsplit = undefined
  }

  /** Starts `frames` on `target`, paused unless the scroll drives it. */
  const run = (
    target: Element,
    frames: ReturnType<typeof framesFor>,
    timing: KeyframeAnimationOptions,
  ) => {
    const list = [animateSafely(target, frames.own, timing)]
    if (frames.added)
      list.push(animateSafely(target, frames.added, { ...timing, composite: 'add' }))
    if (!timing.timeline) for (const animation of list) animation.pause()
    return list
  }

  /** Holds the element on its first frame until it is time to play. */
  const hide = (entry: Entry) => {
    clear(entry)
    entry.state = 'hidden'
    if (!canAnimate || entry.item.effect === 'none') return
    const el = entry.item.element
    const opacity = Number.parseFloat(getComputedStyle(el).opacity)
    if (opacity === 0) {
      entry.state = 'done'
      return
    }
    // Words are only split once they play: until then the element waits whole, faded out.
    const effect = entry.item.effect === 'words' ? 'fade' : entry.item.effect
    const frames = framesFor(effect, {
      distance: entry.item.role === 'button' ? distance / 2 : distance,
      opacity: Number.isNaN(opacity) ? 1 : opacity,
      fadeOnly,
    })
    const timing = (
      scrubbing && ViewTimeline
        ? {
            fill: 'both',
            timeline: new ViewTimeline({ subject: el }),
            rangeStart: 'entry 0%',
            rangeEnd: 'cover 40%',
          }
        : { duration: fadeOnly ? Math.min(duration, 250) : duration, fill: 'both' }
    ) as KeyframeAnimationOptions
    entry.animations = run(el, frames, timing)
  }

  /**
   * Swaps the whole element's fade for one per word.
   * shortcut: the words stay split for the length of the entrance, so a framework rewriting
   * that text in that window writes to the detached original; split later if that bites.
   */
  const splitIntoWords = (entry: Entry) => {
    const el = entry.item.element
    if (entry.item.effect !== 'words' || fadeOnly || !(el instanceof HTMLElement)) return
    const { words, restore } = splitWords(el)
    if (words.length === 0) return
    for (const animation of entry.animations) animation.cancel()
    entry.unsplit = restore
    const step = Math.min(stagger / 2, maxStagger / words.length)
    const frames = framesFor('words', { distance, opacity: 1, fadeOnly })
    entry.animations = words.flatMap((word, i) => {
      const list = run(word, frames, { duration, fill: 'both' })
      for (const animation of list) lag.set(animation, i * step)
      return list
    })
  }

  const show = (entry: Entry) => {
    clear(entry)
    entry.state = 'done'
  }

  const count = (entry: Entry, el: Element, delay: number) => {
    const node = Array.from(el.childNodes).find(
      (n): n is Text => n.nodeType === 3 && !!n.nodeValue?.trim(),
    )
    const original = node?.nodeValue
    const parsed = original ? parseCount(original) : null
    if (!node || !original || !parsed) return
    let written = formatCount(0, parsed)
    node.nodeValue = written
    let frame = 0
    let start = 0
    const length = duration * 1.8
    const tick = (now: number) => {
      // Someone else wrote to it, a re-render most likely: theirs wins.
      if (node.nodeValue !== written) return
      if (!start) start = now
      const t = Math.min((now - start) / length, 1)
      written = t === 1 ? original : formatCount(parsed.value * easeOutCubic(t), parsed)
      node.nodeValue = written
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, delay)
    entry.stopCounts.push(() => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      if (node.nodeValue === written) node.nodeValue = original
    })
  }

  const play = (entry: Entry, delay: number) => {
    if (entry.state !== 'hidden') return
    entry.state = 'playing'
    onEnter?.(entry.item)
    const total = delay + entry.item.delay
    splitIntoWords(entry)
    const animations = entry.animations
    for (const animation of animations) {
      animation.effect?.updateTiming({ delay: total + (lag.get(animation) ?? 0) })
      animation.play()
    }
    if (counters && !reduced) for (const el of entry.item.numbers) count(entry, el, total)
    if (animations.length === 0) {
      entry.state = 'done'
    } else {
      // Every one, not the first: the last word ends well after the first.
      Promise.all(animations.map((animation) => animation.finished))
        .then(() => {
          // Drop the fill so the element answers to its own styles again.
          if (entry.animations !== animations) return
          for (const animation of animations) animation.cancel()
          entry.animations = []
          entry.unsplit?.()
          entry.unsplit = undefined
          entry.state = 'done'
        })
        .catch(() => {})
    }
    if (once) io?.unobserve(entry.item.element)
  }

  const io = canObserve
    ? new IntersectionObserver(
        (records) => {
          const arriving: Entry[] = []
          for (const record of records) {
            const entry = entries.get(record.target)
            if (!entry) continue
            const firstReport = !entry.seen
            entry.seen = true
            const height = record.rootBounds?.height ?? window.innerHeight
            const inside =
              record.isIntersecting &&
              (record.intersectionRatio >= offset ||
                record.intersectionRect.height >= height * offset)
            if (inside && firstReport && !intro) show(entry)
            else if (inside) arriving.push(entry)
            else if (!once && !record.isIntersecting && entry.state === 'done') hide(entry)
          }
          arriving.sort(readingOrder)
          arriving.forEach((entry, i) => {
            play(entry, Math.min(i * stagger, maxStagger))
          })
        },
        { threshold: [0, 0.01, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1] },
      )
    : null

  const mark = (item: PlanItem) => {
    item.element.setAttribute('data-choreo-role', item.role)
    if (item.hover && enabled) item.element.setAttribute('data-choreo-hover', item.hover)
  }

  const unmark = (el: Element) => {
    el.removeAttribute('data-choreo-role')
    el.removeAttribute('data-choreo-hover')
  }

  const register = (items: PlanItem[]) => {
    for (const item of items) {
      units.add(item.element)
      const entry: Entry = { item, animations: [], state: 'hidden', seen: false, stopCounts: [] }
      entries.set(item.element, entry)
      mark(item)
      if (scrubbing) {
        // The scroll plays it; there is nothing to wait for.
        hide(entry)
      } else if (io) {
        hide(entry)
        io.observe(item.element)
      } else {
        entry.state = 'done'
      }
    }
  }

  const drop = (el: Element) => {
    const entry = entries.get(el)
    if (!entry) return
    clear(entry)
    io?.unobserve(el)
    unmark(el)
    entries.delete(el)
  }

  const plan = () => Array.from(entries.values(), (e) => e.item).sort(documentOrder)

  const renderLegend = () => {
    if (!debug) return
    if (!legend) {
      legend = document.createElement('div')
      legend.setAttribute('data-choreo-legend', '')
      legend.setAttribute('aria-hidden', 'true')
      Object.assign(legend.style, {
        position: 'fixed',
        left: '12px',
        bottom: '12px',
        zIndex: 'var(--z-tooltip, 80)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 10px',
        maxWidth: 'min(420px, calc(100vw - 24px))',
        padding: '8px 10px',
        borderRadius: '10px',
        font: '500 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#fff',
        background: 'rgb(15 15 20 / 0.86)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
      } satisfies Partial<CSSStyleDeclaration>)
      document.body.appendChild(legend)
    }
    const counts = new Map<Role, number>()
    for (const { item } of entries.values()) counts.set(item.role, (counts.get(item.role) ?? 0) + 1)
    legend.innerHTML = Array.from(counts)
      .map(
        ([role, n]) =>
          `<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:9px;height:9px;border-radius:2px;border:1.5px dashed ${roleColors[role]}"></i>${role} ${n}</span>`,
      )
      .join('')
  }

  const changed = () => {
    renderLegend()
    onPlan?.(plan())
  }

  const insideUnit = (el: Element) => {
    for (let node: Element | null = el; node && node !== root; node = node.parentElement) {
      if (units.has(node) && node !== el) return true
    }
    return false
  }

  let pending: Element[] = []
  let flushFrame = 0
  const flush = () => {
    flushFrame = 0
    for (const el of Array.from(entries.keys())) if (!el.isConnected) drop(el)
    const added = pending.filter((el) => el.isConnected && root.contains(el) && !insideUnit(el))
    pending = []
    let grew = false
    for (const el of added) {
      if (entries.has(el)) continue
      const items = scanner.scanAdded(el, units)
      if (items.length) {
        register(items)
        grew = true
      }
    }
    if (grew || added.length) changed()
  }

  const mo =
    observe && typeof MutationObserver === 'function'
      ? new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node.nodeType === 1 && !(node as Element).closest('[data-choreo-legend]'))
                pending.push(node as Element)
            }
          }
          if (!flushFrame) flushFrame = requestAnimationFrame(flush)
        })
      : null

  const beforePrint = () => {
    for (const entry of entries.values()) show(entry)
  }

  register(scanner.scan(root))
  if (debug) root.setAttribute('data-choreo-debug', '')
  mo?.observe(root, { childList: true, subtree: true })
  window.addEventListener('beforeprint', beforePrint)
  changed()

  let stopped = false
  return {
    get plan() {
      return plan()
    },
    replay() {
      if (stopped) return
      for (const entry of entries.values()) {
        hide(entry)
        if (scrubbing) continue
        entry.seen = true
        io?.unobserve(entry.item.element)
        io?.observe(entry.item.element)
      }
    },
    refresh() {
      if (stopped) return
      for (const el of Array.from(entries.keys())) if (!el.isConnected) drop(el)
      register(scanner.rescan(root, units))
      changed()
    },
    leave() {
      if (stopped || !canAnimate || scrubbing) return Promise.resolve()
      const leaving = Array.from(entries.values())
        .filter((entry) => {
          if (entry.state === 'hidden') return false
          const r = entry.item.element.getBoundingClientRect()
          return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
        })
        .sort(readingOrder)
      return Promise.all(
        leaving.map((entry, i) => {
          hide(entry)
          // Not hidden, so the observer cannot start it again halfway out.
          entry.state = 'playing'
          const animations = entry.animations
          for (const animation of animations) {
            // Played backward, the end delay is what waits first.
            animation.effect?.updateTiming({
              duration: duration / 2,
              endDelay: Math.min(i * stagger, maxStagger) / 2,
            })
            animation.reverse()
          }
          return Promise.all(animations.map((animation) => animation.finished))
            .then(() => {
              if (entry.animations === animations) hide(entry)
            })
            .catch(() => {})
        }),
      ).then(() => {})
    },
    stop() {
      if (stopped) return
      stopped = true
      io?.disconnect()
      mo?.disconnect()
      if (flushFrame) cancelAnimationFrame(flushFrame)
      window.removeEventListener('beforeprint', beforePrint)
      for (const el of Array.from(entries.keys())) drop(el)
      root.removeAttribute('data-choreo-debug')
      legend?.remove()
      legend = null
      releaseStyle()
    },
  }
}
