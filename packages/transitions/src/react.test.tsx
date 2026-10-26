import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Transition,
  Transitions,
  useLinkTransition,
  useNavigationTransition,
  useViewTransition,
} from './react'

const sheet = () => document.querySelector('style[data-uiness-transitions]')?.textContent ?? ''
const nameOf = (el: Element) => (el as HTMLElement).style.getPropertyValue('view-transition-name')

/** A stand-in for `document.startViewTransition` that records what the update saw. */
function fakeViewTransitions() {
  const seen: string[] = []
  const start = vi.fn((update: () => Promise<void> | void) => {
    const done = Promise.resolve()
      .then(update)
      .then(() => {
        seen.push(document.body.textContent ?? '')
      })
    return { finished: done, ready: done, updateCallbackDone: done, skipTransition() {} }
  })
  Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true })
  return { start, seen }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})
afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
  vi.unstubAllGlobals()
})

describe('Transition', () => {
  it('names its child and keeps the child’s own ref', () => {
    const own = React.createRef<HTMLImageElement>()
    render(
      <Transition name="cover" enter="scale">
        <img ref={own} alt="Cover" />
      </Transition>,
    )
    const img = screen.getByRole('img', { name: 'Cover' })
    expect(own.current).toBe(img)
    expect(nameOf(img)).toBe('cover')
    expect(sheet()).toContain('::view-transition-new(cover):only-child')
  })

  it('staggers the children it is given, again as they change', () => {
    const List = ({ items }: { items: string[] }) => (
      <Transition stagger={50} enter="fade-up">
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Transition>
    )
    const { rerender } = render(<List items={['a', 'b']} />)
    const names = () => screen.getAllByRole('listitem').map(nameOf)
    expect(names()[1]).toMatch(/-1$/)
    rerender(<List items={['a', 'b', 'c']} />)
    expect(names()).toHaveLength(3)
    expect(names()[2]).toMatch(/-2$/)
    expect(sheet()).toContain(`::view-transition-group(${names()[2]}){animation-delay:100ms}`)
  })
})

describe('Transitions', () => {
  it('sets the page effect', () => {
    render(<Transitions page="slide-up" duration={450} />)
    expect(sheet()).toContain('::view-transition-group(*){animation-duration:450ms')
    expect(sheet()).toContain(
      '::view-transition-new(root){animation-name:uiness-vt-enter;--uiness-vt-y:calc(100%',
    )
  })

  it('changes state inside the transition, flushed for the new picture', async () => {
    const { seen } = fakeViewTransitions()
    function Tabs() {
      const [tab, setTab] = React.useState('one')
      const start = useViewTransition()
      return (
        <button type="button" onClick={() => start(() => setTab('two'))}>
          {tab}
        </button>
      )
    }
    render(<Tabs />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(seen).toEqual(['two'])
  })

  it('waits for the route to change before the new picture', async () => {
    const { seen } = fakeViewTransitions()
    function App() {
      const [route, setRoute] = React.useState('/')
      // A router that renders the new page a moment later, as one that loads data does.
      const push = (to: string) => setTimeout(() => setRoute(to), 20)
      return (
        <Transitions routeKey={route}>
          <Page route={route} push={push} />
        </Transitions>
      )
    }
    function Page({ route, push }: { route: string; push: (to: string) => void }) {
      const navigate = useNavigationTransition()
      return (
        <button type="button" onClick={() => navigate(() => push('/about'))}>
          {route}
        </button>
      )
    }
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
      await new Promise((resolve) => setTimeout(resolve, 60))
    })
    expect(seen).toEqual(['/about'])
  })

  it('takes over plain clicks on links, and leaves new tabs to the browser', async () => {
    fakeViewTransitions()
    const push = vi.fn()
    function Nav() {
      const onClick = useLinkTransition(push)
      return (
        // biome-ignore lint/a11y/useValidAnchor: a real link, its click taken over as routers do
        <a href="/docs/intro?tab=a#top" onClick={onClick}>
          Intro
        </a>
      )
    }
    render(
      <Transitions>
        <Nav />
      </Transitions>,
    )
    const link = screen.getByRole('link', { name: 'Intro' })
    await act(async () => {
      fireEvent.click(link, { ctrlKey: true })
    })
    expect(push).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(link)
    })
    expect(push).toHaveBeenCalledWith('/docs/intro?tab=a#top')
  })
})
