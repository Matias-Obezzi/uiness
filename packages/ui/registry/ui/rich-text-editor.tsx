'use client'

import {
  BoldIcon,
  CheckIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  type LucideIcon,
  MinusIcon,
  PilcrowIcon,
  StrikethroughIcon,
  TextQuoteIcon,
  UnderlineIcon,
  UnlinkIcon,
} from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface RichTextEditorLabels {
  /** Shown while the editor is empty. */
  placeholder: string
  /** Name of the editable area. */
  editor: string
  /** Name of the toolbar over the selection. */
  formatting: string
  /** Name of the `/` menu. */
  blocks: string
  /** The link field of the toolbar. */
  linkPlaceholder: string
  linkAddress: string
  applyLink: string
  removeLink: string
  /** The toolbar buttons. */
  bold: string
  italic: string
  underline: string
  strikethrough: string
  code: string
  link: string
  heading: string
  bulletedList: string
  numberedList: string
  quote: string
  /** The blocks of the `/` menu, along with the lists and the quote above. */
  text: string
  heading1: string
  heading2: string
  heading3: string
  divider: string
}

export const defaultRichTextEditorLabels: RichTextEditorLabels = {
  placeholder: "Write something, or press '/' for blocks…",
  editor: 'Editor',
  formatting: 'Formatting',
  blocks: 'Blocks',
  linkPlaceholder: 'Paste or type a link',
  linkAddress: 'Link address',
  applyLink: 'Apply link',
  removeLink: 'Remove link',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  code: 'Code',
  link: 'Link',
  heading: 'Heading',
  bulletedList: 'Bulleted list',
  numberedList: 'Numbered list',
  quote: 'Quote',
  text: 'Text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  divider: 'Divider',
}

/* ------------------------------------------------------------------------------------------
 * Sanitizing
 * ---------------------------------------------------------------------------------------- */

const ELEMENT = 1
const TEXT = 3

/** Tags the editor keeps, and what the near misses turn into. */
const TAG_MAP: Record<string, string> = {
  P: 'p',
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h3',
  H5: 'h3',
  H6: 'h3',
  UL: 'ul',
  OL: 'ol',
  LI: 'li',
  BLOCKQUOTE: 'blockquote',
  HR: 'hr',
  BR: 'br',
  STRONG: 'strong',
  B: 'strong',
  EM: 'em',
  I: 'em',
  CITE: 'em',
  U: 'u',
  INS: 'u',
  S: 's',
  STRIKE: 's',
  DEL: 's',
  CODE: 'code',
  KBD: 'code',
  SAMP: 'code',
  TT: 'code',
  A: 'a',
}

/** Thrown away with everything inside them. */
const DROP = new Set([
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
  'IFRAME',
  'FRAME',
  'OBJECT',
  'EMBED',
  'NOSCRIPT',
  'HEAD',
  'META',
  'LINK',
  'TITLE',
  'SVG',
  'MATH',
  'CANVAS',
  'VIDEO',
  'AUDIO',
  'IMG',
  'PICTURE',
  'SOURCE',
  'INPUT',
  'BUTTON',
  'SELECT',
  'TEXTAREA',
  'FORM',
])

/** Boxes from other pages: a paragraph when they only hold text, unwrapped otherwise. */
const CONTAINERS = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
  'ASIDE',
  'NAV',
  'FIGURE',
  'FIGCAPTION',
  'ADDRESS',
  'DT',
  'DD',
  'TR',
  'CENTER',
  'DETAILS',
  'SUMMARY',
  'PRE',
])

const BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr'])
/** Elements whose content is a line of text, where no block may go. */
const TEXT_LEVEL = new Set(['p', 'h1', 'h2', 'h3', 'strong', 'em', 'u', 's', 'code', 'a'])

/**
 * The link if it is safe to keep: http, https, mailto, tel or relative. Anything with another
 * scheme, `javascript:` first among them, comes back null.
 */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const url = raw.trim()
  if (!url) return null
  // Browsers ignore whitespace and control characters inside a scheme, so the check must too.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
  const bare = url.replace(/[\u0000-\u001F\u007F\s]+/g, '')
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(bare)
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme[1]?.toLowerCase() ?? '')) {
    return null
  }
  return url
}

function styleMarks(el: HTMLElement) {
  const marks: string[] = []
  const style = el.style
  if (!style) return marks
  const weight = style.fontWeight
  if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) marks.push('strong')
  if (style.fontStyle === 'italic') marks.push('em')
  const decoration = `${style.textDecoration} ${style.textDecorationLine}`
  if (decoration.includes('underline')) marks.push('u')
  if (decoration.includes('line-through')) marks.push('s')
  return marks
}

function hasBlockInside(el: Element) {
  return !!el.querySelector(
    'p,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote,hr,div,section,article,pre,table,tr',
  )
}

function cleanInto(source: Node, target: Node, inText: boolean) {
  const doc = target.ownerDocument as Document
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === TEXT) {
      const text = (child.nodeValue ?? '').replace(/\u200B/g, '')
      if (text) target.appendChild(doc.createTextNode(text))
      continue
    }
    if (child.nodeType !== ELEMENT) continue
    const el = child as HTMLElement
    const tag = el.tagName.toUpperCase()
    if (DROP.has(tag)) continue
    let name: string | undefined = TAG_MAP[tag]
    // Google Docs wraps a whole paste in a <b> that is not bold.
    if (tag === 'B' && /^(normal|[1-5]00)$/.test(el.style?.fontWeight ?? '')) name = undefined
    if (!name && CONTAINERS.has(tag) && !inText && !hasBlockInside(el)) name = 'p'
    let href: string | null = null
    if (name === 'a') {
      href = safeUrl(el.getAttribute('href'))
      if (!href) name = undefined
    }
    if (name && BLOCKS.has(name) && inText) {
      // A block inside a line: keep its words, on a line of their own.
      if (name === 'hr') continue
      if (target.lastChild) target.appendChild(doc.createElement('br'))
      name = undefined
    }
    if (!name) {
      let into: Node = target
      for (const mark of styleMarks(el)) {
        const wrapper = doc.createElement(mark)
        into.appendChild(wrapper)
        into = wrapper
      }
      cleanInto(el, into, inText)
      if (tag === 'TD' || tag === 'TH') into.appendChild(doc.createTextNode(' '))
      continue
    }
    const out = doc.createElement(name)
    if (name === 'a' && href) out.setAttribute('href', href)
    if (name === 'ol') {
      const start = Number.parseInt(el.getAttribute('start') ?? '', 10)
      if (start > 1) out.setAttribute('start', String(start))
    }
    target.appendChild(out)
    if (name !== 'br' && name !== 'hr') cleanInto(el, out, inText || TEXT_LEVEL.has(name))
  }
}

const isBlockNode = (node: Node) =>
  node.nodeType === ELEMENT && BLOCKS.has((node as Element).tagName.toLowerCase())

/** Puts loose text and inline elements into paragraphs, and stray items into lists. */
function fixStructure(container: Node, wrapLoose: boolean) {
  const doc = container.ownerDocument as Document
  const children = Array.from(container.childNodes)
  const hasBlocks = children.some(isBlockNode)
  let run: Node[] = []
  const flush = () => {
    const meaningful = run.some((n) => n.nodeType !== TEXT || (n.nodeValue ?? '').trim().length > 0)
    if (meaningful) {
      const p = doc.createElement('p')
      container.insertBefore(p, run[0] as Node)
      for (const n of run) p.appendChild(n)
    } else {
      for (const n of run) n.parentNode?.removeChild(n)
    }
    run = []
  }
  for (const child of children) {
    if (isBlockNode(child)) {
      if (wrapLoose || hasBlocks) flush()
      continue
    }
    if (wrapLoose || hasBlocks) run.push(child)
  }
  if (wrapLoose || hasBlocks) flush()

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType !== ELEMENT) continue
    const el = child as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      let item: HTMLElement | null = null
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === ELEMENT && (n as Element).tagName === 'LI') {
          item = null
          fixStructure(n, false)
          continue
        }
        if (n.nodeType === TEXT && !(n.nodeValue ?? '').trim()) {
          el.removeChild(n)
          continue
        }
        if (!item) {
          item = doc.createElement('li')
          el.insertBefore(item, n)
        }
        item.appendChild(n)
      }
      if (!el.firstChild) el.remove()
    } else if (tag === 'li') {
      // An item outside a list gets a list of its own, shared with the items next to it.
      const prev = el.previousElementSibling
      if (prev && prev.tagName === 'UL') prev.appendChild(el)
      else {
        const list = doc.createElement('ul')
        el.replaceWith(list)
        list.appendChild(el)
      }
      fixStructure(el, false)
    } else if (tag === 'blockquote') {
      fixStructure(el, false)
    }
    if (TEXT_LEVEL.has(tag) || tag === 'li') {
      // The <br> a browser leaves at the end of a line is not a line break of its own.
      const last = el.lastChild
      if (last && last.nodeName === 'BR' && (el.textContent ?? '').trim()) last.remove()
    }
  }
}

function parse(html: string) {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

/**
 * Cleans HTML down to what the editor supports: paragraphs, three heading levels, lists,
 * quotes, rules, line breaks, bold, italic, underline, strikethrough, code and safe links.
 * Every attribute but `href` (and `start` on lists) goes, so do scripts, styles, images and
 * frames; bold and italic set through inline styles are kept as tags.
 */
export function sanitizeHtml(html: string): string {
  const source = parse(html)
  const out = document.createElement('template').content
  cleanInto(source, out, false)
  fixStructure(out, true)
  const holder = document.createElement('div')
  holder.appendChild(out)
  return holder.innerHTML
}

/** Empty lines need a <br> for the caret to land in them. */
function forEditing(html: string) {
  const fragment = parse(html)
  for (const el of Array.from(fragment.querySelectorAll('p,h1,h2,h3,li,blockquote'))) {
    if (!el.firstChild || (!(el.textContent ?? '').trim() && !el.querySelector('br,hr,p,ul,ol'))) {
      el.textContent = ''
      el.appendChild(document.createElement('br'))
    }
  }
  const holder = document.createElement('div')
  holder.appendChild(fragment)
  return holder.innerHTML || '<p><br></p>'
}

/* ------------------------------------------------------------------------------------------
 * HTML to Markdown
 * ---------------------------------------------------------------------------------------- */

const URL_ESCAPES: Record<string, string> = { ' ': '%20', '(': '%28', ')': '%29' }
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

const escapeText = (text: string) => text.replace(/([\\`*_[\]<~])/g, '\\$1')

function wrapMark(inner: string, mark: string) {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)
  if (!match?.[2]) return inner
  return `${match[1]}${mark}${match[2]}${mark}${match[3]}`
}

function codeSpan(text: string) {
  const value = text.replace(/\u00a0/g, ' ')
  if (!value) return ''
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longest + 1)
  const pad = value.startsWith('`') || value.endsWith('`') ? ' ' : ''
  return `${fence}${pad}${value}${pad}${fence}`
}

function inlineMd(node: Node): string {
  if (node.nodeType === TEXT) {
    return escapeText((node.nodeValue ?? '').replace(/\u00a0/g, ' ').replace(/[ \t\r\n]+/g, ' '))
  }
  if (node.nodeType !== ELEMENT) return ''
  const el = node as Element
  const inner = () => Array.from(el.childNodes).map(inlineMd).join('')
  switch (el.tagName.toLowerCase()) {
    case 'br':
      return '\\\n'
    case 'strong':
      return wrapMark(inner(), '**')
    case 'em':
      return wrapMark(inner(), '*')
    case 's':
      return wrapMark(inner(), '~~')
    case 'u': {
      const text = inner()
      return text.trim() ? `<u>${text}</u>` : text
    }
    case 'code':
      return codeSpan(el.textContent ?? '')
    case 'a': {
      const href = (el.getAttribute('href') ?? '').replace(/[ ()]/g, (c) => URL_ESCAPES[c] ?? c)
      return `[${inner()}](${href})`
    }
    default:
      return inner()
  }
}

/** Trims a line and drops the line breaks at either end of it. */
function tidyLine(text: string) {
  return text
    .replace(/^(\s|\\\n)+/, '')
    .replace(/(\s|\\\n)+$/, '')
    .replace(/ ?\\\n ?/g, '\\\n')
}

/** Text that would read as Markdown syntax at the start of a line gets a backslash. */
function escapeStart(line: string) {
  if (/^\d+[.)]\s/.test(line)) return line.replace(/^(\d+)([.)])/, '$1\\$2')
  if (/^(#{1,6}\s|>|[-+]\s|-{3,}\s*$)/.test(line)) return `\\${line}`
  return line
}

function listMd(list: Element): string {
  const ordered = list.tagName === 'OL'
  let n = Number.parseInt(list.getAttribute('start') ?? '1', 10) || 1
  const lines: string[] = []
  for (const item of Array.from(list.children)) {
    if (item.tagName !== 'LI') continue
    const marker = ordered ? `${n++}.` : '-'
    const pad = ' '.repeat(marker.length + 1)
    const body = blocksMd(item)
      .join('\n')
      .split('\n')
      .map((line, i) => (i === 0 || !line ? line : pad + line))
      .join('\n')
    lines.push(body ? `${marker} ${body}` : marker)
  }
  return lines.join('\n')
}

function blocksMd(parent: Node): string[] {
  const blocks: string[] = []
  let run: Node[] = []
  const flush = () => {
    const line = tidyLine(run.map(inlineMd).join(''))
    if (line) blocks.push(escapeStart(line))
    run = []
  }
  for (const child of Array.from(parent.childNodes)) {
    if (!isBlockNode(child)) {
      run.push(child)
      continue
    }
    flush()
    const el = child as Element
    const tag = el.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      const list = listMd(el)
      if (list) blocks.push(list)
    } else if (tag === 'blockquote') {
      const inner = blocksMd(el).join('\n\n')
      if (inner)
        blocks.push(
          inner
            .split('\n')
            .map((l) => (l ? `> ${l}` : '>'))
            .join('\n'),
        )
    } else if (tag === 'hr') {
      blocks.push('---')
    } else {
      const line = tidyLine(Array.from(el.childNodes).map(inlineMd).join(''))
      if (!line) continue
      const level = /^h([1-3])$/.exec(tag)?.[1]
      blocks.push(level ? `${'#'.repeat(Number(level))} ${line}` : escapeStart(line))
    }
  }
  flush()
  return blocks
}

/**
 * Markdown for the HTML the editor makes: headings, lists, quotes, rules, bold, italic,
 * strikethrough (`~~`), code and links. Underline has no Markdown, so it stays `<u>`.
 */
export function htmlToMarkdown(html: string): string {
  return blocksMd(parse(sanitizeHtml(html))).join('\n\n')
}

/* ------------------------------------------------------------------------------------------
 * Positions
 * ---------------------------------------------------------------------------------------- */

/** Elements that start a new line, which counts as one character between two of them. */
const LINE_BREAKERS = new Set(['P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'UL', 'OL', 'HR', 'DIV'])

/**
 * A point in the editor as a number, so it survives the DOM being rebuilt from the same HTML,
 * which is what undo, redo and cleaning a paste do.
 */
// Cleaning drops zero width spaces and the <br> a browser leaves at the end of a line, so
// neither counts, or a caret after them would move when the DOM is rebuilt.
const visible = (text: string) => text.replace(/​/g, '').length
const brWidth = (br: Node) => (br.nextSibling ? 1 : 0)

/** Index in `text` of the character `n` visible characters in, skipping zero width spaces. */
function visibleIndex(text: string, n: number) {
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '​') continue
    if (seen === n) return i
    seen++
  }
  return text.length
}

function pointToOffset(root: Node, target: Node, targetOffset: number) {
  let count = 0
  let started = false
  let result = -1
  const visit = (node: Node): boolean => {
    if (node.nodeType === TEXT) {
      const text = node.nodeValue ?? ''
      if (node === target) {
        result = count + visible(text.slice(0, targetOffset))
        return true
      }
      count += visible(text)
      return false
    }
    if (node.nodeType !== ELEMENT) return false
    const el = node as Element
    if (node !== root) {
      if (el.tagName === 'BR') {
        count += brWidth(el)
        return false
      }
      if (LINE_BREAKERS.has(el.tagName)) {
        if (started) count += 1
        started = true
      }
    }
    const children = node.childNodes
    for (let i = 0; i < children.length; i++) {
      if (node === target && i === targetOffset) {
        result = count
        return true
      }
      if (visit(children[i] as Node)) return true
    }
    if (node === target) {
      result = count
      return true
    }
    return false
  }
  visit(root)
  return result === -1 ? count : result
}

function offsetToPoint(root: Node, offset: number): [Node, number] | null {
  let count = 0
  let started = false
  const visit = (node: Node): [Node, number] | null => {
    if (node.nodeType === TEXT) {
      const text = node.nodeValue ?? ''
      const length = visible(text)
      if (offset <= count + length) return [node, visibleIndex(text, Math.max(0, offset - count))]
      count += length
      return null
    }
    if (node.nodeType !== ELEMENT) return null
    const el = node as Element
    if (node !== root) {
      if (el.tagName === 'BR') {
        if (offset <= count) {
          const parent = el.parentNode as Node
          return [parent, Array.prototype.indexOf.call(parent.childNodes, el)]
        }
        count += brWidth(el)
        return null
      }
      if (LINE_BREAKERS.has(el.tagName)) {
        if (started) count += 1
        started = true
        if (el.tagName === 'HR') return null
        if (offset <= count && !el.firstChild) return [el, 0]
      }
    }
    for (const child of Array.from(node.childNodes)) {
      const found = visit(child)
      if (found) return found
    }
    return null
  }
  return visit(root)
}

interface SavedSelection {
  anchor: number
  focus: number
}

function saveSelection(root: HTMLElement): SavedSelection | null {
  const selection = root.ownerDocument.getSelection()
  if (!selection?.anchorNode || !root.contains(selection.anchorNode)) return null
  return {
    anchor: pointToOffset(root, selection.anchorNode, selection.anchorOffset),
    focus: pointToOffset(root, selection.focusNode as Node, selection.focusOffset),
  }
}

function restoreSelection(root: HTMLElement, saved: SavedSelection | null) {
  const selection = root.ownerDocument.getSelection()
  if (!selection) return
  const end = (): [Node, number] => [root, root.childNodes.length]
  if (!saved) {
    const range = root.ownerDocument.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    return
  }
  const anchor = offsetToPoint(root, saved.anchor) ?? end()
  const focus = offsetToPoint(root, saved.focus) ?? end()
  selection.setBaseAndExtent(anchor[0], anchor[1], focus[0], focus[1])
}

/** Characters between the start of `el` and a point inside it. */
function textBefore(el: Node, node: Node, offset: number) {
  const range = el.ownerDocument?.createRange()
  if (!range) return ''
  range.setStart(el, 0)
  range.setEnd(node, offset)
  return range.toString()
}

function placeCaret(el: Node, characters: number) {
  const doc = el.ownerDocument as Document
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let left = characters
  let node = walker.nextNode()
  let point: [Node, number] = [el, 0]
  while (node) {
    const length = (node.nodeValue ?? '').length
    if (left <= length) {
      point = [node, left]
      break
    }
    left -= length
    point = [node, length]
    node = walker.nextNode()
  }
  doc.getSelection()?.collapse(point[0], point[1])
}

/* ------------------------------------------------------------------------------------------
 * Lines
 * ---------------------------------------------------------------------------------------- */

type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote'

const LINE_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'DIV', 'PRE'])

/** The line a point is on: a list item, or the outermost block under the root. */
function lineOf(root: HTMLElement, node: Node | null, offset = 0): HTMLElement | null {
  let el: Node | null = node
  if (el === root) el = root.childNodes[Math.min(offset, root.childNodes.length - 1)] ?? null
  let found: HTMLElement | null = null
  while (el && el !== root) {
    if (el.nodeType === ELEMENT) {
      const tag = (el as Element).tagName
      if (tag === 'LI') return el as HTMLElement
      if (LINE_TAGS.has(tag)) found = el as HTMLElement
    }
    el = el.parentNode
  }
  return found
}

/** Every line the range touches, in order. */
function linesIn(root: HTMLElement, range: Range): HTMLElement[] {
  if (range.collapsed) {
    const line = lineOf(root, range.startContainer, range.startOffset)
    return line ? [line] : []
  }
  const candidates: HTMLElement[] = []
  for (const child of Array.from(root.children) as HTMLElement[]) {
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      candidates.push(...(Array.from(child.children) as HTMLElement[]))
    } else if (child.tagName !== 'HR') candidates.push(child)
  }
  return candidates.filter((line) => range.intersectsNode(line))
}

function ensureBreak(el: HTMLElement) {
  if (!(el.textContent ?? '').length && !el.querySelector('br,hr,ul,ol')) {
    el.appendChild(el.ownerDocument.createElement('br'))
  }
}

/** Moves the content of one line into another, flattening paragraphs inside it. */
function moveInline(from: Node, to: HTMLElement) {
  for (const child of Array.from(from.childNodes)) {
    if (child.nodeType === ELEMENT && LINE_TAGS.has((child as Element).tagName)) {
      if (to.lastChild && to.lastChild.nodeName !== 'BR') {
        to.appendChild(to.ownerDocument.createElement('br'))
      }
      moveInline(child, to)
    } else to.appendChild(child)
  }
}

function mergeLists(list: HTMLElement) {
  let current = list
  const prev = current.previousElementSibling
  if (prev && prev.tagName === current.tagName) {
    while (current.firstChild) prev.appendChild(current.firstChild)
    current.remove()
    current = prev as HTMLElement
  }
  const next = current.nextElementSibling
  if (next && next.tagName === current.tagName) {
    while (next.firstChild) current.appendChild(next.firstChild)
    next.remove()
  }
}

function lineType(line: HTMLElement): BlockType {
  if (line.tagName === 'LI') return line.parentElement?.tagName === 'OL' ? 'ol' : 'ul'
  const tag = line.tagName.toLowerCase()
  return (['h1', 'h2', 'h3', 'blockquote'].includes(tag) ? tag : 'p') as BlockType
}

function convertLine(line: HTMLElement, target: BlockType): HTMLElement {
  const doc = line.ownerDocument
  if (target === 'ul' || target === 'ol') {
    if (line.tagName === 'LI') {
      const list = line.parentElement as HTMLElement
      if (list.tagName.toLowerCase() === target) return line
      const next = doc.createElement(target)
      while (list.firstChild) next.appendChild(list.firstChild)
      list.replaceWith(next)
      mergeLists(next)
      return line
    }
    const item = doc.createElement('li')
    moveInline(line, item)
    const list = doc.createElement(target)
    list.appendChild(item)
    line.replaceWith(list)
    mergeLists(list)
    ensureBreak(item)
    return item
  }
  const el = doc.createElement(target)
  if (line.tagName === 'LI') {
    const list = line.parentElement as HTMLElement
    const rest = doc.createElement(list.tagName.toLowerCase())
    for (const child of Array.from(line.childNodes)) {
      if (child.nodeName === 'UL' || child.nodeName === 'OL') {
        // Sub items move up into the part of the list after the new line.
        for (const sub of Array.from(child.childNodes)) rest.appendChild(sub)
      } else el.appendChild(child)
    }
    let sibling = line.nextSibling
    while (sibling) {
      const next = sibling.nextSibling
      rest.appendChild(sibling)
      sibling = next
    }
    list.after(el)
    if (rest.firstChild) el.after(rest)
    line.remove()
    if (!list.querySelector('li')) list.remove()
  } else {
    moveInline(line, el)
    line.replaceWith(el)
  }
  ensureBreak(el)
  return el
}

/* ------------------------------------------------------------------------------------------
 * Editor
 * ---------------------------------------------------------------------------------------- */

const indexOf = (node: Node) =>
  Array.prototype.indexOf.call(node.parentNode?.childNodes ?? [], node) as number

function exec(command: string, value?: string) {
  if (typeof document.execCommand !== 'function') return false
  try {
    return document.execCommand(command, false, value)
  } catch {
    return false
  }
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c)
}

function textToHtml(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function isEmptyDoc(root: HTMLElement) {
  if (root.querySelector('hr,li')) return false
  return !(root.textContent ?? '').replace(/\u200B/g, '').trim() && root.children.length <= 1
}

const BLOCK_SHORTCUTS: [RegExp, BlockType | 'hr'][] = [
  [/^# $/, 'h1'],
  [/^## $/, 'h2'],
  [/^### $/, 'h3'],
  [/^[-*+] $/, 'ul'],
  [/^1[.)] $/, 'ol'],
  [/^> $/, 'blockquote'],
  [/^--- $/, 'hr'],
]

const INLINE_SHORTCUTS: [RegExp, string][] = [
  [/\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, 'strong'],
  [/__([^_\s](?:[^_]*[^_\s])?)__$/, 'strong'],
  [/~~([^~\s](?:[^~]*[^~\s])?)~~$/, 's'],
  [/(?:^|[^*\\])\*([^*\s](?:[^*]*[^*\s])?)\*$/, 'em'],
  [/(?:^|[^_\w\\])_([^_\s](?:[^_]*[^_\s])?)_$/, 'em'],
  [/`([^`]+)`$/, 'code'],
]

interface SlashItem {
  id: BlockType | 'hr'
  label: keyof RichTextEditorLabels
  hint: string
  icon: LucideIcon
  keywords: string[]
}

const SLASH_ITEMS: SlashItem[] = [
  { id: 'p', label: 'text', hint: '', icon: PilcrowIcon, keywords: ['paragraph', 'plain'] },
  { id: 'h1', label: 'heading1', hint: '#', icon: Heading1Icon, keywords: ['title', 'h1'] },
  { id: 'h2', label: 'heading2', hint: '##', icon: Heading2Icon, keywords: ['subtitle', 'h2'] },
  { id: 'h3', label: 'heading3', hint: '###', icon: Heading3Icon, keywords: ['h3'] },
  {
    id: 'ul',
    label: 'bulletedList',
    hint: '-',
    icon: ListIcon,
    keywords: ['bullet', 'unordered', 'ul'],
  },
  {
    id: 'ol',
    label: 'numberedList',
    hint: '1.',
    icon: ListOrderedIcon,
    keywords: ['ordered', 'number', 'ol'],
  },
  { id: 'blockquote', label: 'quote', hint: '>', icon: TextQuoteIcon, keywords: ['blockquote'] },
  {
    id: 'hr',
    label: 'divider',
    hint: '---',
    icon: MinusIcon,
    keywords: ['separator', 'rule', 'hr'],
  },
]

type Mark = 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link'
type Format = Mark | 'heading' | 'ul' | 'ol' | 'quote'

const MARK_TAGS: Record<string, Mark> = {
  STRONG: 'bold',
  B: 'bold',
  EM: 'italic',
  I: 'italic',
  U: 'underline',
  S: 'strike',
  STRIKE: 'strike',
  DEL: 'strike',
  CODE: 'code',
  A: 'link',
}

interface ToolbarItem {
  id: Format
  label: keyof RichTextEditorLabels
  icon: LucideIcon
  keys?: string
}

const TOOLBAR: ToolbarItem[][] = [
  [
    { id: 'bold', label: 'bold', icon: BoldIcon, keys: 'B' },
    { id: 'italic', label: 'italic', icon: ItalicIcon, keys: 'I' },
    { id: 'underline', label: 'underline', icon: UnderlineIcon, keys: 'U' },
    { id: 'strike', label: 'strikethrough', icon: StrikethroughIcon, keys: 'Shift+X' },
    { id: 'code', label: 'code', icon: CodeIcon, keys: 'E' },
    { id: 'link', label: 'link', icon: LinkIcon, keys: 'K' },
  ],
  [
    { id: 'heading', label: 'heading', icon: HeadingIcon },
    { id: 'ul', label: 'bulletedList', icon: ListIcon },
    { id: 'ol', label: 'numberedList', icon: ListOrderedIcon },
    { id: 'quote', label: 'quote', icon: TextQuoteIcon },
  ],
]

const KEYS: Record<string, Format> = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
  e: 'code',
  k: 'link',
}
const SHIFT_KEYS: Record<string, Format> = { x: 'strike' }

interface HistoryEntry {
  html: string
  selection: SavedSelection | null
}

export interface RichTextEditorValue {
  html: string
  markdown: string
}

export interface RichTextEditorHandle {
  focus: () => void
  getHTML: () => string
  getMarkdown: () => string
  /** Replaces the content, sanitized. Can be undone. */
  setHTML: (html: string) => void
  undo: () => void
  redo: () => void
}

export interface RichTextEditorProps
  extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children'> {
  /** Methods to read, replace, focus, undo and redo. */
  ref?: React.Ref<RichTextEditorHandle>
  /** Starting content as HTML. It is sanitized to the supported tags. */
  defaultValue?: string
  /** Called after every change with the content as clean HTML and as Markdown. */
  onChange?: (value: RichTextEditorValue) => void
  /** Shown while the editor is empty. */
  placeholder?: string
  /** Read only: no editing, no toolbar, no menu. */
  readOnly?: boolean
  autoFocus?: boolean
  /** Classes for the editable area itself, such as a min height. */
  contentClassName?: string
  /** Words to use instead of the English ones. A `LabelsProvider` sets them for the whole app. */
  labels?: Partial<RichTextEditorLabels>
}

const isMac = () =>
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** Typing within this many ms of the last change joins it in one undo step. */
const MERGE_WITHIN = 1000

/**
 * A lightweight rich text editor on `contenteditable`, with no dependencies: Markdown
 * shortcuts as you type, a toolbar over the selection, a `/` menu of blocks, its own undo
 * history, pastes cleaned to the supported tags, and HTML and Markdown out.
 */
function RichTextEditor({
  ref,
  defaultValue = '',
  onChange,
  placeholder: placeholderProp,
  readOnly = false,
  autoFocus = false,
  labels: labelsProp,
  className,
  contentClassName,
  'aria-label': ariaLabelProp,
  ...props
}: RichTextEditorProps) {
  const labels = useLabels('rich-text-editor', defaultRichTextEditorLabels, labelsProp)
  const placeholder = placeholderProp ?? labels.placeholder
  const ariaLabel = ariaLabelProp ?? labels.editor
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const linkInputRef = React.useRef<HTMLInputElement>(null)
  const history = React.useRef<{
    entries: HistoryEntry[]
    index: number
    at: number
    kind: string
  }>({ entries: [], index: -1, at: 0, kind: '' })
  const composing = React.useRef(false)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const menuId = React.useId()

  const [toolbar, setToolbar] = React.useState<{ x: number; y: number; below: boolean } | null>(
    null,
  )
  const [active, setActive] = React.useState<Set<Format>>(() => new Set())
  const [link, setLink] = React.useState<{ range: Range; href: string } | null>(null)
  const [slash, setSlash] = React.useState<{
    query: string
    x: number
    y: number
    index: number
    at: number
  } | null>(null)
  const dismissedSlash = React.useRef<number | null>(null)

  const items = React.useMemo(() => {
    if (!slash) return []
    const q = slash.query.toLowerCase()
    return SLASH_ITEMS.filter(
      (item) =>
        labels[item.label].toLowerCase().includes(q) || item.keywords.some((k) => k.startsWith(q)),
    )
  }, [slash, labels])

  const getHTML = React.useCallback(() => {
    const root = rootRef.current
    if (!root || isEmptyDoc(root)) return ''
    return sanitizeHtml(root.innerHTML)
  }, [])

  const emit = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    root.toggleAttribute('data-empty', isEmptyDoc(root))
    const html = getHTML()
    onChangeRef.current?.({ html, markdown: html ? htmlToMarkdown(html) : '' })
  }, [getHTML])

  const record = React.useCallback((kind: string) => {
    const root = rootRef.current
    if (!root) return
    const h = history.current
    const html = root.innerHTML
    const selection = saveSelection(root)
    const current = h.entries[h.index]
    const now = Date.now()
    if (current && current.html === html) {
      current.selection = selection
      return
    }
    if (kind === 'typing' && h.kind === 'typing' && now - h.at < MERGE_WITHIN && h.index > 0) {
      h.entries[h.index] = { html, selection }
    } else {
      h.entries = h.entries.slice(0, h.index + 1)
      h.entries.push({ html, selection })
      if (h.entries.length > 200) h.entries.shift()
      h.index = h.entries.length - 1
    }
    h.at = now
    h.kind = kind
  }, [])

  /** Loose text straight in the root, as a browser leaves it after select all and type. */
  const ensureLines = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const loose = Array.from(root.childNodes).some(
      (n) =>
        (n.nodeType === TEXT && (n.nodeValue ?? '').length > 0) ||
        (n.nodeType === ELEMENT && !isBlockNode(n) && n.nodeName !== 'DIV'),
    )
    if (!root.firstChild || loose || root.querySelector(':scope > div')) {
      const saved = saveSelection(root)
      root.innerHTML = forEditing(sanitizeHtml(root.innerHTML))
      restoreSelection(root, saved)
    }
  }, [])

  const commit = React.useCallback(
    (kind = 'format') => {
      ensureLines()
      record(kind)
      emit()
    },
    [ensureLines, record, emit],
  )

  /** Rebuilds the DOM from its own sanitized HTML, keeping the selection. */
  const normalize = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const saved = saveSelection(root)
    root.innerHTML = forEditing(sanitizeHtml(root.innerHTML))
    restoreSelection(root, saved)
  }, [])

  const applyEntry = React.useCallback(
    (entry: HistoryEntry | undefined) => {
      const root = rootRef.current
      if (!root || !entry) return
      root.innerHTML = entry.html
      root.focus()
      restoreSelection(root, entry.selection)
      setSlash(null)
      emit()
    },
    [emit],
  )

  const undo = React.useCallback(() => {
    const h = history.current
    if (h.index <= 0) return
    h.index--
    h.kind = ''
    applyEntry(h.entries[h.index])
  }, [applyEntry])

  const redo = React.useCallback(() => {
    const h = history.current
    if (h.index >= h.entries.length - 1) return
    h.index++
    h.kind = ''
    applyEntry(h.entries[h.index])
  }, [applyEntry])

  const setHTML = React.useCallback(
    (html: string) => {
      const root = rootRef.current
      if (!root) return
      root.innerHTML = forEditing(sanitizeHtml(html))
      record('set')
      emit()
    },
    [record, emit],
  )

  React.useImperativeHandle(
    ref,
    () => ({
      focus: () => rootRef.current?.focus(),
      getHTML,
      getMarkdown: () => {
        const html = getHTML()
        return html ? htmlToMarkdown(html) : ''
      },
      setHTML,
      undo,
      redo,
    }),
    [getHTML, setHTML, undo, redo],
  )

  // The content belongs to the browser from here on; React never renders into it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the starting value is read once
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.innerHTML = forEditing(sanitizeHtml(defaultValue))
    root.toggleAttribute('data-empty', isEmptyDoc(root))
    history.current = {
      entries: [{ html: root.innerHTML, selection: null }],
      index: 0,
      at: 0,
      kind: '',
    }
    if (autoFocus) {
      root.focus()
      restoreSelection(root, null)
    }
  }, [])

  const selectionRange = React.useCallback(() => {
    const root = rootRef.current
    const selection = document.getSelection()
    if (!root || !selection || selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    return root.contains(range.commonAncestorContainer) ? range : null
  }, [])

  /** Where a range is, relative to the wrapper. */
  const place = React.useCallback((range: Range) => {
    const wrapper = wrapperRef.current
    if (!wrapper || typeof range.getBoundingClientRect !== 'function') return null
    let rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      const line = lineOf(rootRef.current as HTMLElement, range.startContainer, range.startOffset)
      if (line) rect = line.getBoundingClientRect()
    }
    const box = wrapper.getBoundingClientRect()
    return {
      top: rect.top - box.top,
      bottom: rect.bottom - box.top,
      left: rect.left - box.left,
      center: rect.left + rect.width / 2 - box.left,
    }
  }, [])

  const readFormats = React.useCallback((range: Range) => {
    const root = rootRef.current as HTMLElement
    const found = new Set<Format>()
    let node: Node | null = range.startContainer
    if (node.nodeType === TEXT && range.startOffset === (node.nodeValue ?? '').length) {
      // A selection made by double click starts at the end of the text before it.
      const next = range.cloneRange()
      const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT)
      walker.currentNode = node
      const after = walker.nextNode()
      if (after && next.intersectsNode(after)) node = after
    }
    while (node && node !== root) {
      const mark = MARK_TAGS[(node as Element).tagName ?? '']
      if (mark) found.add(mark)
      node = node.parentNode
    }
    const line = lineOf(root, range.startContainer, range.startOffset)
    if (line) {
      const type = lineType(line)
      if (type === 'h1' || type === 'h2' || type === 'h3') found.add('heading')
      if (type === 'ul' || type === 'ol') found.add(type)
      if (type === 'blockquote') found.add('quote')
    }
    return found
  }, [])

  const updateSlash = React.useCallback(() => {
    const root = rootRef.current
    const range = selectionRange()
    if (!root || !range?.collapsed || readOnly) {
      setSlash(null)
      return
    }
    const line = lineOf(root, range.startContainer, range.startOffset)
    if (!line) {
      setSlash(null)
      return
    }
    const before = textBefore(line, range.startContainer, range.startOffset).replace(/\u00a0/g, ' ')
    const match = /(?:^|\s)\/([\p{L}\p{N}-]{0,20})$/u.exec(before)
    if (!match) {
      dismissedSlash.current = null
      setSlash(null)
      return
    }
    const query = match[1] ?? ''
    const at = pointToOffset(root, range.startContainer, range.startOffset) - query.length - 1
    if (dismissedSlash.current === at) return
    // The menu lines up with the slash, not with the caret after the query.
    const slashPoint = offsetToPoint(root, at)
    const slashRange = range.cloneRange()
    if (slashPoint && slashPoint[0].nodeType === TEXT) {
      slashRange.setStart(slashPoint[0], slashPoint[1])
      slashRange.setEnd(
        slashPoint[0],
        Math.min(slashPoint[1] + 1, (slashPoint[0].nodeValue ?? '').length),
      )
    }
    const spot = place(slashRange)
    setSlash((current) => ({
      query,
      at,
      x: spot?.left ?? 0,
      y: spot?.bottom ?? 0,
      index: current && current.at === at && current.query === query ? current.index : 0,
    }))
  }, [readOnly, selectionRange, place])

  const updateToolbar = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const range = selectionRange()
    if (link) return
    if (!range || range.collapsed || readOnly || document.activeElement !== root) {
      if (!toolbarRef.current?.contains(document.activeElement)) setToolbar(null)
      return
    }
    setActive(readFormats(range))
    const spot = place(range)
    if (!spot) {
      setToolbar({ x: 0, y: 0, below: false })
      return
    }
    // Under the selection when there is no room above it.
    const below = spot.top < 48
    setToolbar({ x: spot.center, y: below ? spot.bottom + 8 : spot.top - 8, below })
  }, [link, readOnly, readFormats, selectionRange, place])

  React.useEffect(() => {
    const onSelectionChange = () => {
      updateToolbar()
      if (document.activeElement === rootRef.current) updateSlash()
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [updateToolbar, updateSlash])

  // Keep the toolbar inside the editor's width, or inside the screen when the editor is
  // narrower than the toolbar. The link field changes that width.
  // biome-ignore lint/correctness/useExhaustiveDependencies: measures again when link mode toggles
  React.useLayoutEffect(() => {
    const bar = toolbarRef.current
    const wrapper = wrapperRef.current
    if (!bar || !wrapper || !toolbar) return
    const half = bar.offsetWidth / 2
    let min = half
    let max = wrapper.clientWidth - half
    if (max < min) {
      const box = wrapper.getBoundingClientRect()
      min = 8 - box.left + half
      max = Math.max(min, window.innerWidth - 8 - box.left - half)
    }
    bar.style.left = `${Math.min(Math.max(toolbar.x, min), max)}px`
  }, [toolbar, link])

  React.useEffect(() => {
    if (link) linkInputRef.current?.focus()
  }, [link])

  const convert = (type: BlockType) => {
    const root = rootRef.current
    const range = selectionRange()
    if (!root || !range) return
    const lines = linesIn(root, range)
    if (lines.length === 0) return
    const target = lines.every((line) => lineType(line) === type) ? 'p' : type
    const first = lines[0] as HTMLElement
    const caret = range.collapsed ? textBefore(first, range.startContainer, range.startOffset) : ''
    const converted = lines.map((line) => convertLine(line, target))
    if (range.collapsed) placeCaret(converted[0] as HTMLElement, caret.length)
    else {
      const last = converted[converted.length - 1] as HTMLElement
      const selection = document.getSelection()
      selection?.setBaseAndExtent(converted[0] as Node, 0, last, last.childNodes.length)
    }
    commit()
  }

  const insertRule = (line: HTMLElement) => {
    const hr = document.createElement('hr')
    const p = document.createElement('p')
    p.appendChild(document.createElement('br'))
    const anchor = line.tagName === 'LI' ? (line.parentElement as HTMLElement) : line
    if ((line.textContent ?? '').trim()) {
      anchor.after(hr, p)
    } else if (line.tagName === 'LI') {
      const converted = convertLine(line, 'p')
      converted.replaceWith(hr, p)
    } else {
      line.replaceWith(hr, p)
    }
    placeCaret(p, 0)
    commit()
  }

  const toggleCode = (range: Range) => {
    const root = rootRef.current as HTMLElement
    let node: Node | null = range.commonAncestorContainer
    while (node && node !== root && node.nodeName !== 'CODE') node = node.parentNode
    if (node && node !== root) {
      const code = node as HTMLElement
      const text = document.createTextNode(code.textContent ?? '')
      code.replaceWith(text)
      document.getSelection()?.setBaseAndExtent(text, 0, text, text.length)
    } else {
      const text = range.toString()
      if (!text) return
      const code = document.createElement('code')
      code.textContent = text
      range.deleteContents()
      range.insertNode(code)
      document.getSelection()?.setBaseAndExtent(code, 0, code, code.childNodes.length)
    }
    commit()
  }

  const applyFormat = (format: Format) => {
    const root = rootRef.current
    if (!root || readOnly) return
    const range = selectionRange()
    if (!range) return
    switch (format) {
      case 'bold':
      case 'italic':
      case 'underline':
        exec(format)
        commit()
        break
      case 'strike':
        exec('strikeThrough')
        commit()
        break
      case 'code':
        toggleCode(range)
        break
      case 'link': {
        let node: Node | null = range.commonAncestorContainer
        while (node && node !== root && node.nodeName !== 'A') node = node.parentNode
        const href = node && node !== root ? ((node as Element).getAttribute('href') ?? '') : ''
        if (range.collapsed && !href) return
        setLink({ range: range.cloneRange(), href })
        break
      }
      case 'heading':
        convert('h2')
        break
      case 'quote':
        convert('blockquote')
        break
      case 'ul':
      case 'ol':
        convert(format)
        break
    }
    const after = selectionRange()
    if (after) setActive(readFormats(after))
  }

  const applyLink = (href: string | null) => {
    const root = rootRef.current
    if (!root || !link) return
    root.focus()
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(link.range)
    let anchor: Node | null = link.range.commonAncestorContainer
    while (anchor && anchor !== root && anchor.nodeName !== 'A') anchor = anchor.parentNode
    const existing = anchor && anchor !== root ? (anchor as HTMLAnchorElement) : null
    const url = href
      ? safeUrl(/^[\w-]+(\.[\w-]+)+(\/|$)/.test(href) ? `https://${href}` : href)
      : null
    if (existing) {
      if (url) existing.setAttribute('href', url)
      else existing.replaceWith(...Array.from(existing.childNodes))
    } else if (url && !link.range.collapsed) {
      if (!exec('createLink', url)) {
        const a = document.createElement('a')
        a.href = url
        a.appendChild(link.range.extractContents())
        link.range.insertNode(a)
      }
    }
    setLink(null)
    commit()
  }

  /** The Markdown typed before the caret, turned into what it stands for. */
  const shortcuts = (data: string | null) => {
    const root = rootRef.current
    const range = selectionRange()
    if (!root || !range?.collapsed || !data) return false
    const node = range.startContainer
    const line = lineOf(root, node, range.startOffset)
    if (!line) return false

    if (data === ' ' || data === '\u00a0') {
      const before = textBefore(line, node, range.startOffset).replace(/\u00a0/g, ' ')
      const shortcut = BLOCK_SHORTCUTS.find(([pattern]) => pattern.test(before))
      if (shortcut && line.tagName !== 'LI' && lineType(line) !== 'blockquote') {
        const clear = document.createRange()
        clear.setStart(line, 0)
        clear.setEnd(node, range.startOffset)
        clear.deleteContents()
        ensureBreak(line)
        const type = shortcut[1]
        if (type === 'hr') insertRule(line)
        else {
          placeCaret(convertLine(line, type), 0)
          commit()
        }
        return true
      }
    }

    if (node.nodeType !== TEXT || !/[*_~`]/.test(data)) return false
    let parent: Node | null = node.parentNode
    while (parent && parent !== root) {
      if (parent.nodeName === 'CODE') return false
      parent = parent.parentNode
    }
    const text = node.nodeValue?.slice(0, range.startOffset) ?? ''
    for (const [pattern, tag] of INLINE_SHORTCUTS) {
      const match = pattern.exec(text)
      if (!match) continue
      const inner = match[1] ?? ''
      const markers = (match[0].length - inner.length) / 2
      // The em patterns also match the character before the opening marker.
      const start = range.startOffset - inner.length - Math.floor(markers) * 2
      const whole = document.createRange()
      whole.setStart(node, start)
      whole.setEnd(node, range.startOffset)
      whole.deleteContents()
      const el = document.createElement(tag)
      el.textContent = inner
      whole.insertNode(el)
      // Typing on goes after the new element, not inside it. A zero width space gives the
      // caret a text node to stand in; it is stripped from the output.
      let next = el.nextSibling
      if (!next || next.nodeType !== TEXT || !(next.nodeValue ?? '').length) {
        if (next && next.nodeType === TEXT) next.nodeValue = '\u200B'
        else {
          next = document.createTextNode('\u200B')
          el.after(next)
        }
        document.getSelection()?.collapse(next, 1)
      } else document.getSelection()?.collapse(next, 0)
      commit()
      return true
    }
    return false
  }

  const pickSlash = (item: SlashItem) => {
    const root = rootRef.current
    const range = selectionRange()
    if (!root || !range || !slash) return
    const start = offsetToPoint(root, slash.at)
    if (start) {
      const clear = document.createRange()
      clear.setStart(start[0], start[1])
      clear.setEnd(range.startContainer, range.startOffset)
      clear.deleteContents()
    }
    setSlash(null)
    const now = selectionRange()
    const line = now ? lineOf(root, now.startContainer, now.startOffset) : null
    if (!line) return
    ensureBreak(line)
    if (item.id === 'hr') insertRule(line)
    else {
      const target = item.id
      const caret = now ? textBefore(line, now.startContainer, now.startOffset).length : 0
      const converted = lineType(line) === target ? line : convertLine(line, target)
      placeCaret(converted, caret)
      commit()
    }
  }

  const insertHtml = (html: string) => {
    // A paste of a single paragraph goes into the current line instead of splitting it.
    const fragment = parse(html)
    const only = fragment.childNodes.length === 1 ? fragment.firstChild : null
    const content = only && only.nodeName === 'P' ? (only as Element).innerHTML : html
    if (!content) return
    if (!exec('insertHTML', content)) {
      const range = selectionRange()
      if (!range) return
      range.deleteContents()
      const inserted = range.createContextualFragment(content)
      const last = inserted.lastChild
      range.insertNode(inserted)
      if (last) {
        range.setStartAfter(last)
        range.collapse(true)
        document.getSelection()?.removeAllRanges()
        document.getSelection()?.addRange(range)
      }
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (slash && items.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setSlash({ ...slash, index: (slash.index + step + items.length) % items.length })
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const item = items[slash.index]
        if (item) pickSlash(item)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        dismissedSlash.current = slash.at
        setSlash(null)
        return
      }
    }
    if (event.key === 'F10' && event.altKey && toolbar) {
      event.preventDefault()
      toolbarRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      return
    }
    const mod = event.metaKey || event.ctrlKey
    const key = event.key.toLowerCase()
    if (mod && !event.altKey) {
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (key === 'y') {
        event.preventDefault()
        redo()
        return
      }
      const format = (event.shiftKey ? SHIFT_KEYS : KEYS)[key]
      if (format) {
        event.preventDefault()
        applyFormat(format)
        return
      }
    }

    const root = rootRef.current
    const range = selectionRange()
    if (!root || !range?.collapsed) return
    const line = lineOf(root, range.startContainer, range.startOffset)
    if (!line) return
    const type = lineType(line)
    const atStart = textBefore(line, range.startContainer, range.startOffset).length === 0
    const empty = !(line.textContent ?? '').replace(/\u200B/g, '').length
    // Backspace at the start of a heading, quote or item turns it back into a paragraph, and
    // Enter on an empty one leaves it, the way Markdown editors behave.
    if (
      type !== 'p' &&
      ((event.key === 'Backspace' && atStart && !event.shiftKey) ||
        (event.key === 'Enter' && !event.shiftKey && empty))
    ) {
      event.preventDefault()
      placeCaret(convertLine(line, 'p'), 0)
      commit()
      return
    }
    // Enter inside a quote starts a new line of the same quote, where a browser would start a
    // second quote. Enter on an empty last line leaves it.
    if (type === 'blockquote' && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      const rest = range.cloneRange()
      rest.setEndAfter(line.lastChild ?? line)
      const container = range.startContainer
      const before =
        container.nodeType === TEXT
          ? range.startOffset === 0
            ? container.previousSibling
            : null
          : container.childNodes[range.startOffset - 1]
      if (!rest.toString().replace(/​/g, '') && before?.nodeName === 'BR') {
        before.remove()
        while (line.lastChild?.nodeName === 'BR' && line.childNodes.length > 1) {
          line.lastChild.remove()
        }
        const p = document.createElement('p')
        p.appendChild(document.createElement('br'))
        line.after(p)
        placeCaret(p, 0)
      } else if (!exec('insertLineBreak')) {
        const br = document.createElement('br')
        range.insertNode(br)
        // Splitting text at its end leaves an empty text node behind.
        if (br.nextSibling?.nodeType === TEXT && !br.nextSibling.nodeValue) br.nextSibling.remove()
        // A line break at the very end needs a second one to show the empty line.
        if (!br.nextSibling) br.after(document.createElement('br'))
        document.getSelection()?.collapse(br.parentNode as Node, indexOf(br) + 1)
      }
      commit()
    }
  }

  const onInput = (event: React.FormEvent<HTMLDivElement>) => {
    const native = event.nativeEvent as InputEvent
    if (composing.current || native.isComposing) return
    const kind = native.inputType ?? ''
    if (kind === 'insertFromDrop' || kind === 'insertFromPaste') normalize()
    // A zero width space left for the caret is not needed once there is text next to it.
    const range = selectionRange()
    const node = range?.startContainer
    if (node && node.nodeType === TEXT && range?.collapsed) {
      const value = node.nodeValue ?? ''
      const index = value.indexOf('\u200B')
      if (index !== -1 && value.length > 1) {
        // Read before writing: the range is live and resets when the text changes.
        const caret = range.startOffset
        node.nodeValue = value.replace(/\u200B/g, '')
        const offset = caret - (index < caret ? 1 : 0)
        document.getSelection()?.collapse(node, Math.max(0, offset))
      }
    }
    ensureLines()
    // The text as typed is its own undo step, so undoing a shortcut gives the characters back.
    if (kind.startsWith('insertText')) {
      record('typing')
      if (shortcuts(native.data)) {
        updateSlash()
        return
      }
    }
    // Characters typed or deleted in a row are one undo step; a new line starts the next.
    record(kind === 'insertText' || kind.startsWith('delete') ? 'typing' : 'other')
    emit()
    updateSlash()
  }

  // Native: React has no beforeinput event of its own, and the history ones come from menus
  // and gestures as well as keys.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onBeforeInput = (event: InputEvent) => {
      if (event.inputType === 'historyUndo') {
        event.preventDefault()
        undo()
      } else if (event.inputType === 'historyRedo') {
        event.preventDefault()
        redo()
      }
    }
    root.addEventListener('beforeinput', onBeforeInput)
    return () => root.removeEventListener('beforeinput', onBeforeInput)
  }, [undo, redo])

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain')
    if (!html && !text) return
    event.preventDefault()
    const clean = html ? sanitizeHtml(html) : textToHtml(text)
    insertHtml(clean)
    normalize()
    commit('paste')
  }

  const toolbarKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      toolbarRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    )
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      if (link) setLink(null)
      rootRef.current?.focus()
      return
    }
    if (link || index === -1) return
    const to =
      event.key === 'ArrowRight'
        ? (index + 1) % buttons.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + buttons.length) % buttons.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : -1
    if (to === -1) return
    event.preventDefault()
    buttons[to]?.focus()
  }

  const mod = isMac() ? '⌘' : 'Ctrl+'
  const activeOption =
    slash && items[slash.index] ? `${menuId}-${items[slash.index]?.id}` : undefined

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only notices focus leaving the editor and its menus
    <div
      ref={wrapperRef}
      data-slot="rich-text-editor"
      className={cn(
        'relative rounded-lg border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
        className,
      )}
      onBlur={(event) => {
        if (wrapperRef.current?.contains(event.relatedTarget as Node)) return
        setToolbar(null)
        setSlash(null)
        setLink(null)
      }}
      {...props}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: a contenteditable is the only way to edit rich text */}
      <div
        ref={rootRef}
        role="textbox"
        tabIndex={0}
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-readonly={readOnly || undefined}
        aria-controls={slash ? menuId : undefined}
        aria-activedescendant={activeOption}
        aria-haspopup="listbox"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        data-slot="rich-text-editor-content"
        onKeyDown={onKeyDown}
        onInput={onInput}
        onPaste={onPaste}
        onFocus={() => exec('defaultParagraphSeparator', 'p')}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
          record('typing')
          emit()
        }}
        className={cn(
          'relative min-h-32 px-4 py-3 text-base leading-7 outline-none md:text-sm md:leading-6',
          'data-[empty]:before:pointer-events-none data-[empty]:before:absolute data-[empty]:before:text-muted-foreground data-[empty]:before:content-[attr(data-placeholder)]',
          '[&>*+*]:mt-3 [&_h1]:font-semibold [&_h1]:text-2xl [&_h1]:tracking-tight [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:tracking-tight [&_h3]:font-semibold [&_h3]:text-lg',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:pl-1 [&_li+li]:mt-1 [&_li>ol]:mt-1 [&_li>ul]:mt-1',
          '[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
          '[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]',
          '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_b]:font-semibold [&_strong]:font-semibold [&_hr]:my-5 [&_hr]:border-border',
          readOnly && 'cursor-default',
          contentClassName,
        )}
      />

      {toolbar && !readOnly ? (
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label={labels.formatting}
          data-slot="rich-text-editor-toolbar"
          onKeyDown={toolbarKeys}
          onMouseDown={(event) => {
            // Pressing a button must not take the selection away from the text.
            if (!(event.target instanceof HTMLInputElement)) event.preventDefault()
          }}
          className="fade-in-0 zoom-in-95 absolute z-(--z-popover,60) flex w-max animate-in items-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md duration-(--duration-fast,150ms) motion-reduce:animate-none"
          style={{
            top: toolbar.y,
            left: toolbar.x,
            translate: toolbar.below ? '-50% 0' : '-50% -100%',
          }}
        >
          {link ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault()
                applyLink(linkInputRef.current?.value ?? '')
              }}
            >
              <input
                ref={linkInputRef}
                type="text"
                inputMode="url"
                defaultValue={link.href}
                placeholder={labels.linkPlaceholder}
                aria-label={labels.linkAddress}
                className="h-7 w-52 rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label={labels.applyLink}
                className="grid size-7 place-items-center rounded-md outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <CheckIcon aria-hidden className="size-4" />
              </button>
              {link.href ? (
                <button
                  type="button"
                  aria-label={labels.removeLink}
                  onClick={() => applyLink(null)}
                  className="grid size-7 place-items-center rounded-md outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <UnlinkIcon aria-hidden className="size-4" />
                </button>
              ) : null}
            </form>
          ) : (
            TOOLBAR.map((group, groupIndex) => (
              <React.Fragment key={group[0]?.id}>
                {groupIndex > 0 ? <span aria-hidden className="mx-0.5 h-5 w-px bg-border" /> : null}
                {group.map((item, itemIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={labels[item.label]}
                    aria-pressed={active.has(item.id)}
                    title={
                      item.keys ? `${labels[item.label]} (${mod}${item.keys})` : labels[item.label]
                    }
                    tabIndex={groupIndex === 0 && itemIndex === 0 ? 0 : -1}
                    onClick={() => applyFormat(item.id)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-(--duration-fast,150ms) hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground"
                  >
                    <item.icon aria-hidden className="size-4" />
                  </button>
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      ) : null}

      {slash && items.length > 0 ? (
        <div
          id={menuId}
          role="listbox"
          aria-label={labels.blocks}
          data-slot="rich-text-editor-menu"
          className="fade-in-0 zoom-in-95 absolute z-(--z-popover,60) mt-1 max-h-72 w-60 animate-in overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md duration-(--duration-fast,150ms) motion-reduce:animate-none"
          style={{
            top: slash.y,
            left: Math.max(0, Math.min(slash.x, (wrapperRef.current?.clientWidth ?? 240) - 240)),
          }}
        >
          {items.map((item, index) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard drives the menu from the editor
            <div
              key={item.id}
              id={`${menuId}-${item.id}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === slash.index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => {
                if (index !== slash.index) setSlash({ ...slash, index })
              }}
              onClick={() => pickSlash(item)}
              ref={(el) => {
                if (el && index === slash.index) el.scrollIntoView?.({ block: 'nearest' })
              }}
              className="flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground">
                <item.icon aria-hidden className="size-4" />
              </span>
              <span className="flex-1">{labels[item.label]}</span>
              {item.hint ? (
                <kbd className="font-mono text-muted-foreground text-xs">{item.hint}</kbd>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { RichTextEditor }
