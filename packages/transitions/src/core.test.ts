import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  behaviorCss,
  crossDocument,
  define,
  definePage,
  mark,
  pageCss,
  scan,
  transition,
  watchDirection,
} from './core'

const sheet = () => document.querySelector('style[data-uiness-transitions]')?.textContent ?? ''
const direction = () => document.documentElement.getAttribute('data-transition-direction')
const nameOf = (el: Element) => (el as HTMLElement).style.getPropertyValue('view-transition-name')

/** A stand-in for `document.startViewTransition` that runs the update at once. */
function fakeViewTransitions() {
  const start = vi.fn((update: () => Promise<void> | void) => {
    const done = Promise.resolve().then(update)
    return { finished: done, ready: done, updateCallbackDone: done, skipTransition() {} }
  })
  Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true })
  return start
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-transition-direction')
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})
afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('rules', () => {
  it('enters and exits only where the other side has no element of the name', () => {
    const css = behaviorCss('card', { enter: 'fade-up', exit: 'fade', duration: 400, delay: 80 })
    expect(css).toContain(
      '::view-transition-group(card){animation-duration:400ms;animation-delay:80ms}',
    )
    expect(css).toContain(
      '::view-transition-new(card):only-child{animation-name:uiness-vt-enter;--uiness-vt-o:0;--uiness-vt-y:16px}',
    )
    expect(css).toContain(
      '::view-transition-old(card):only-child{animation-name:uiness-vt-exit;--uiness-vt-o:0}',
    )
  })

  it('keeps a persisting element still and shows only its new picture', () => {
    expect(behaviorCss('header', { persist: true })).toBe(
      '::view-transition-group(header){animation:none;z-index:1}::view-transition-old(header){display:none}::view-transition-new(header){animation:none}',
    )
  })

  it('slides the page the other way going back, or plays another effect forwards', () => {
    const reverse = pageCss({ page: 'slide' })
    expect(reverse).toContain('--uiness-vt-x:calc(100% * var(--uiness-vt-dir,1))')
    expect(reverse).not.toContain('html[data-transition-direction=back]::')

    const fade = pageCss({ page: 'slide', back: 'fade' })
    expect(fade).toContain(
      'html[data-transition-direction=back]::view-transition-new(root){--uiness-vt-dir:1;animation-name:uiness-vt-enter;--uiness-vt-o:0}',
    )
  })
})

describe('define', () => {
  it('keeps rules while a name is in use, and a moment after, for the exit', () => {
    vi.useFakeTimers()
    const first = define('cover', { enter: 'scale' })
    const second = define('cover', { enter: 'scale' })
    first()
    vi.advanceTimersByTime(3000)
    expect(sheet()).toContain('::view-transition-new(cover)')
    second()
    vi.advanceTimersByTime(2999)
    expect(sheet()).toContain('::view-transition-new(cover)')
    vi.advanceTimersByTime(1)
    expect(sheet()).not.toContain('::view-transition-new(cover)')
  })

  it('sets the page and puts the default back', () => {
    const undo = definePage({ page: 'blur', duration: 500 })
    expect(sheet()).toContain('animation-duration:500ms')
    undo()
    expect(sheet()).not.toContain('animation-duration:500ms')
  })
})

describe('mark and scan', () => {
  it('names an element, or each child with a growing delay', () => {
    document.body.innerHTML = '<div id="hero"></div><ul id="list"><li></li><li></li><li></li></ul>'
    const hero = document.getElementById('hero') as HTMLElement
    const list = document.getElementById('list') as HTMLElement
    const undoHero = mark(hero, { name: 'hero' })
    mark(list, { name: 'items', enter: 'fade-up', stagger: true })
    expect(nameOf(hero)).toBe('hero')
    expect([...list.children].map(nameOf)).toEqual(['items-0', 'items-1', 'items-2'])
    expect(sheet()).toContain('::view-transition-group(items-2){animation-delay:80ms}')
    undoHero()
    expect(nameOf(hero)).toBe('')
  })

  it('gives elements without a name one of their own', () => {
    document.body.innerHTML = '<p></p><p></p>'
    const [a, b] = [...document.querySelectorAll('p')] as HTMLElement[]
    mark(a as HTMLElement)
    mark(b as HTMLElement)
    expect(nameOf(a as HTMLElement)).toMatch(/^uiness-vt-\d+$/)
    expect(nameOf(a as HTMLElement)).not.toBe(nameOf(b as HTMLElement))
  })

  it('reads data-transition attributes', () => {
    document.body.innerHTML =
      '<header data-transition-persist data-transition-name="top"></header><ol data-transition-stagger="60" data-transition-enter="fade"><li></li><li></li></ol>'
    scan()
    expect(nameOf(document.querySelector('header') as HTMLElement)).toBe('top')
    expect(sheet()).toContain('::view-transition-old(top){display:none}')
    const second = document.querySelectorAll('li')[1] as HTMLElement
    expect(sheet()).toContain(`::view-transition-group(${nameOf(second)}){animation-delay:60ms}`)
  })
})

describe('transition', () => {
  it('just runs the update without view transitions or with reduced motion', async () => {
    const update = vi.fn()
    await transition(update)
    expect(update).toHaveBeenCalledTimes(1)

    const start = fakeViewTransitions()
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    await transition(update)
    expect(update).toHaveBeenCalledTimes(2)
    expect(start).not.toHaveBeenCalled()
  })

  it('goes back when the history moved back during the update', async () => {
    const start = fakeViewTransitions()
    const entry = { index: 3 }
    vi.stubGlobal('navigation', Object.assign(new EventTarget(), { currentEntry: entry }))
    await transition(() => {
      entry.index = 2
    })
    expect(start).toHaveBeenCalledTimes(1)
    expect(direction()).toBe('back')
    await transition(() => {
      entry.index = 3
    })
    expect(direction()).toBe('forward')
    await transition(() => {}, { direction: 'back' })
    expect(direction()).toBe('back')
  })
})

describe('direction', () => {
  it('follows traversals of the Navigation API', () => {
    const nav = Object.assign(new EventTarget(), { currentEntry: { index: 4 } })
    vi.stubGlobal('navigation', nav)
    const stop = watchDirection()
    const navigate = (navigationType: string, index: number) =>
      nav.dispatchEvent(
        Object.assign(new Event('navigate'), { navigationType, destination: { index } }),
      )
    navigate('traverse', 2)
    expect(direction()).toBe('back')
    navigate('push', 5)
    expect(direction()).toBe('forward')
    navigate('traverse', 6)
    expect(direction()).toBe('forward')
    stop()
    navigate('traverse', 1)
    expect(direction()).toBe('forward')
  })

  it('turns on transitions between documents and goes back on a traversal to an earlier page', () => {
    vi.stubGlobal(
      'navigation',
      Object.assign(new EventTarget(), {
        currentEntry: { index: 1 },
        activation: { navigationType: 'traverse', entry: { index: 1 }, from: { index: 2 } },
      }),
    )
    const stop = crossDocument({ page: 'slide' })
    expect(sheet()).toContain('@view-transition{navigation:auto}')
    window.dispatchEvent(new Event('pagereveal'))
    expect(direction()).toBe('back')
    stop()
    expect(sheet()).not.toContain('@view-transition')
  })
})
