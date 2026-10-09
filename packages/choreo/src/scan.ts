import { parseCount } from './counter'
import type { Effect, Hover, PlanItem, Role, ScanOptions } from './types'

/** The entrance each role gets unless told otherwise. */
export const defaultEffects: Record<Role, Effect> = {
  heading: 'blur',
  text: 'up',
  media: 'zoom',
  card: 'up',
  item: 'up',
  button: 'up',
  divider: 'draw',
  number: 'up',
  custom: 'up',
}

const EFFECTS = new Set<string>([
  'fade',
  'up',
  'down',
  'left',
  'right',
  'scale',
  'blur',
  'zoom',
  'clip',
  'draw',
  'rotate',
  'flip',
  'words',
  'none',
])

const IGNORED = new Set([
  'script',
  'style',
  'link',
  'meta',
  'template',
  'noscript',
  'head',
  'title',
  'br',
  'wbr',
  'source',
  'track',
  'dialog',
  'option',
  'datalist',
  'slot',
])
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const TEXT = new Set(['p', 'blockquote', 'pre', 'table', 'dl', 'address', 'figcaption', 'label'])
const FIELDS = new Set(['input', 'select', 'textarea', 'progress', 'meter'])
const MEDIA = new Set(['img', 'picture', 'video', 'canvas', 'svg', 'iframe', 'figure', 'object'])
const LANDMARKS = new Set(['section', 'header', 'footer', 'main', 'nav', 'aside', 'form'])
const PHRASING = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
])

type Box = HTMLElement | SVGElement

const isBox = (node: Element): node is Box =>
  typeof HTMLElement !== 'undefined' &&
  (node instanceof HTMLElement || (typeof SVGElement !== 'undefined' && node instanceof SVGElement))

/** Fully transparent, in any color syntax a computed style can return. */
function transparent(color: string) {
  if (!color || color === 'transparent') return true
  const args = /^[a-z-]+\((.*)\)$/i.exec(color.trim())?.[1]
  if (!args) return false
  const alpha = args.includes('/')
    ? args.split('/')[1]
    : args.split(',').length === 4
      ? args.split(',')[3]
      : undefined
  return alpha !== undefined && Number.parseFloat(alpha) === 0
}

const noTransition = (cs: CSSStyleDeclaration) =>
  !cs.transitionDuration ||
  cs.transitionDuration.split(',').every((d) => Number.parseFloat(d) === 0)

const unset = (value: string) => !value || value === 'none'

interface Viewport {
  width: number
  height: number
}

/** Size on screen, or null in environments that do not lay out, such as jsdom. */
function measure(el: Element) {
  const r = el.getBoundingClientRect()
  return r.width === 0 && r.height === 0 ? null : r
}

/** Something with its own surface: a background, a border all round, or a shadow. */
function hasSurface(el: Element, cs: CSSStyleDeclaration) {
  const parent = el.parentElement
  const bg = cs.backgroundColor
  const parentBg = parent ? getComputedStyle(parent).backgroundColor : ''
  if (!transparent(bg) && bg !== parentBg) return true
  if (!unset(cs.backgroundImage)) return true
  if (!unset(cs.boxShadow)) return true
  const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).filter(
    (side) =>
      Number.parseFloat(cs[`border${side}Width`]) > 0 &&
      !unset(cs[`border${side}Style`]) &&
      !transparent(cs[`border${side}Color`]),
  )
  return sides.length >= 3
}

/** Only text and inline markup inside, so it reads as one run of text. */
function isTextLike(el: Element) {
  for (const node of el.children) if (!PHRASING.has(node.localName)) return false
  return (el.textContent ?? '').trim() !== ''
}

function jaccard(a: Element, b: Element) {
  const x = new Set(a.classList)
  const y = new Set(b.classList)
  if (x.size === 0 && y.size === 0) return 1
  let shared = 0
  for (const c of x) if (y.has(c)) shared++
  return shared / (x.size + y.size - shared)
}

/**
 * Inspects the DOM under `root` and decides what each element is and how it should come in.
 * Pure apart from reading computed styles and sizes: nothing on the page changes.
 */
export function scan(root: Element, options: ScanOptions = {}): PlanItem[] {
  return createScanner(options).scan(root)
}

export function createScanner(options: ScanOptions = {}) {
  const { exclude, max = 400, hover = true, counters = true } = options
  const effects = { ...defaultEffects, ...options.effects }
  const groups = new WeakMap<Element, number>()
  let nextGroup = 0
  let items: PlanItem[] = []
  let seen = new WeakSet<Element>()

  const viewport = (): Viewport => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  })

  /** Left out entirely, children included. */
  const ignored = (el: Element, cs: CSSStyleDeclaration) => {
    if (IGNORED.has(el.localName)) return true
    const attr = el.getAttribute('data-choreo')
    if (attr === 'off' || attr === 'false') return true
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return true
    if (el.hasAttribute('data-choreo-legend')) return true
    if (exclude && el.matches(exclude)) return true
    if (cs.display === 'none' || cs.visibility === 'hidden') return true
    // Headers, toasts and anything pinned stay put: they are the frame, not the content.
    if (cs.position === 'fixed' || cs.position === 'sticky') return true
    if (cs.position === 'absolute' && cs.pointerEvents === 'none') return true
    if (el.localName === 'input' && (el as HTMLInputElement).type === 'hidden') return true
    return false
  }

  const looksLikeButton = (el: Element, cs: CSSStyleDeclaration) =>
    /flex|block|grid/.test(cs.display) &&
    (el.textContent?.trim().length ?? 0) < 48 &&
    (!transparent(cs.backgroundColor) ||
      Number.parseFloat(cs.borderTopWidth) > 0 ||
      !unset(cs.boxShadow))

  const tooBig = (el: Element) => {
    const r = measure(el)
    if (!r) return false
    const v = viewport()
    return r.height > v.height * 1.2 || (v.width > 0 && r.width > v.width * 0.92)
  }

  /** The role an element has on its own, or null when it is a wrapper to look inside. */
  const classify = (el: Element, cs: CSSStyleDeclaration): Role | null => {
    const tag = el.localName
    if (HEADINGS.has(tag) || el.getAttribute('role') === 'heading') return 'heading'
    if (tag === 'hr') return 'divider'
    if (MEDIA.has(tag)) return 'media'
    if (
      tag === 'button' ||
      el.getAttribute('role') === 'button' ||
      (tag === 'input' && /^(submit|button|reset)$/.test((el as HTMLInputElement).type))
    )
      return 'button'
    if (FIELDS.has(tag)) return 'text'
    if (tag === 'a') {
      if (looksLikeButton(el, cs)) return 'button'
      if (el.children.length > 0 && hasSurface(el, cs) && !tooBig(el)) return 'card'
      return isTextLike(el) ? 'text' : null
    }
    if ((tag === 'ul' || tag === 'ol') && el.children.length < 2) return 'text'
    if (TEXT.has(tag)) return 'text'
    if (tag === 'article' && !tooBig(el)) return 'card'
    if (
      el.children.length > 0 &&
      !LANDMARKS.has(tag) &&
      hasSurface(el, cs) &&
      !tooBig(el) &&
      !isTextLike(el)
    )
      return 'card'
    if (isTextLike(el)) return isNumber(el, cs) ? 'number' : 'text'
    return null
  }

  /** A big figure on its own, the kind a stats row shows off. */
  const isNumber = (el: Element, cs: CSSStyleDeclaration) => {
    if (!counters || el.children.length > 0 || Number.parseFloat(cs.fontSize) < 24) return false
    const text = el.textContent ?? ''
    return parseCount(text) !== null && /\d{2,}|\d[.,]\d/.test(text)
  }

  /** Figures inside a card or an item, so a grid of stats still counts. */
  const numbersIn = (el: Element) => {
    if (!counters) return []
    const found: Element[] = []
    const all = el.getElementsByTagName('*')
    for (let i = 0; i < all.length && i < 200; i++) {
      const node = all[i] as Element
      if (node.children.length === 0 && isNumber(node, getComputedStyle(node))) found.push(node)
    }
    return found
  }

  const visibleChildren = (el: Element) =>
    Array.from(el.children).filter((kid) => !ignored(kid, getComputedStyle(kid)))

  /** Siblings that repeat: a list, a grid of cards, a row of logos. */
  const isGroup = (el: Element, cs: CSSStyleDeclaration, kids: Element[]) => {
    if (kids.length < 2) return false
    const landmarks = kids.filter((k) => LANDMARKS.has(k.localName)).length
    if (landmarks > kids.length / 2) return false
    if (kids.some((k) => tooBig(k))) return false
    const first = kids[0] as Element
    const alike = kids.filter(
      (k) => k.localName === first.localName && (k.localName !== 'div' || jaccard(k, first) >= 0.5),
    ).length
    const similar = alike / kids.length >= 0.7
    if (el.localName === 'ul' || el.localName === 'ol') return true
    if (/grid/.test(cs.display)) return similar
    if (/flex/.test(cs.display)) return similar && (cs.flexWrap === 'wrap' || kids.length >= 3)
    return similar && kids.length >= 3 && first.localName !== 'p'
  }

  /** Media beside text in a two column row slides in from its own side. */
  const side = (el: Element): Effect | null => {
    let node: Element | null = el
    for (let depth = 0; node && depth < 3; depth++) {
      const parent: Element | null = node.parentElement
      if (!parent) return null
      const pcs = getComputedStyle(parent)
      const row =
        (/flex/.test(pcs.display) && !pcs.flexDirection.startsWith('column')) ||
        (/grid/.test(pcs.display) && pcs.gridTemplateColumns.split(' ').length === 2)
      const kids = visibleChildren(parent)
      if (row && kids.length === 2) return kids[0] === node ? 'right' : 'left'
      node = parent
    }
    return null
  }

  const hoverFor = (el: Element, role: Role, cs: CSSStyleDeclaration): Hover | undefined => {
    if (!hover) return undefined
    if (role === 'button' && unset(cs.scale) && noTransition(cs)) return 'press'
    if (role === 'card' && unset(cs.translate) && noTransition(cs)) return 'lift'
    if (role === 'item' && hasSurface(el, cs) && unset(cs.translate) && noTransition(cs))
      return 'lift'
    return undefined
  }

  const add = (el: Element, role: Role, cs: CSSStyleDeclaration, group?: number) => {
    if (!isBox(el) || seen.has(el) || items.length >= max) return
    seen.add(el)
    const explicit = el.getAttribute('data-choreo')
    let effect = effects[role]
    if (explicit && EFFECTS.has(explicit)) effect = explicit as Effect
    else if (role === 'media' && !options.effects?.media) effect = side(el) ?? effect
    const delay = Number(el.getAttribute('data-choreo-delay')) || 0
    const itemHover = hoverFor(el, role, cs)
    items.push({
      element: el,
      role: explicit && EFFECTS.has(explicit) ? 'custom' : role,
      effect,
      group,
      delay,
      hover: itemHover,
      numbers: role === 'number' ? [el] : role === 'card' || role === 'item' ? numbersIn(el) : [],
    })
  }

  const addGroup = (el: Element, kids: Element[]) => {
    const id = groups.get(el) ?? nextGroup++
    groups.set(el, id)
    for (const kid of kids) {
      const kcs = getComputedStyle(kid)
      const role = classify(kid, kcs)
      add(kid, role === null || role === 'text' ? 'item' : role, kcs, id)
    }
  }

  const visit = (el: Element) => {
    if (items.length >= max) return
    const cs = getComputedStyle(el)
    if (ignored(el, cs)) return
    const explicit = el.getAttribute('data-choreo')
    if (explicit && EFFECTS.has(explicit)) {
      add(el, 'custom', cs)
      return
    }
    // Something already animating on its own keeps its animation; its content can still come in.
    const animated = !unset(cs.animationName)
    const role = animated ? null : classify(el, cs)
    if (role) {
      add(el, role, cs)
      return
    }
    const kids = visibleChildren(el)
    if (!animated && (explicit === 'group' || isGroup(el, cs, kids))) {
      addGroup(el, kids)
      return
    }
    for (const kid of kids) visit(kid)
  }

  return {
    /** Everything worth animating under `root`, not counting `root` itself. */
    scan(root: Element) {
      items = []
      seen = new WeakSet()
      for (const kid of Array.from(root.children)) visit(kid)
      return items
    },
    /** Looks under `root` again, leaving out everything in `skip`. */
    rescan(root: Element, skip: WeakSet<Element>) {
      items = []
      seen = skip
      for (const kid of Array.from(root.children)) visit(kid)
      return items
    },
    /**
     * A subtree added after the first scan. An element dropped into a known list joins its
     * group; anything else is inspected like the rest of the page.
     */
    scanAdded(el: Element, skip: WeakSet<Element>) {
      items = []
      seen = skip
      const parent = el.parentElement
      const group = parent ? groups.get(parent) : undefined
      if (group !== undefined) {
        const cs = getComputedStyle(el)
        if (!ignored(el, cs)) {
          const role = classify(el, cs)
          add(el, role === null || role === 'text' ? 'item' : role, cs, group)
        }
      } else {
        visit(el)
      }
      return items
    },
  }
}
