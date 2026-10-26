import * as React from 'react'
import { flushSync } from 'react-dom'
import {
  type Behavior,
  definePage,
  mark,
  type PageOptions,
  type TransitionOptions,
  transition,
  watchDirection,
} from './core'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Waits for the route to change, or gives up after this long so a slow page still shows. */
const ROUTE_TIMEOUT = 3000

interface TransitionsContextValue {
  /** Resolves once `routeKey` changes. */
  nextRoute(): Promise<void>
}

const TransitionsContext = React.createContext<TransitionsContextValue | null>(null)

export interface TransitionsProps extends PageOptions {
  /**
   * What changes with each page: the pathname, or React Router's `location.key`. Navigation
   * transitions wait for it to change before taking the new picture.
   */
  routeKey?: unknown
  children?: React.ReactNode
}

/**
 * Sets how pages change, for everything inside it, and keeps track of going back. Put it once
 * around the app, inside the router.
 */
export function Transitions({
  page,
  back,
  duration,
  easing,
  routeKey,
  children,
}: TransitionsProps) {
  useIsomorphicLayoutEffect(
    () => definePage({ page, back, duration, easing }),
    [page, back, duration, easing],
  )
  React.useEffect(() => watchDirection(), [])

  const waiting = React.useRef<(() => void)[]>([])
  // During the commit of the new route: the picture is taken after it.
  useIsomorphicLayoutEffect(() => {
    const resolve = waiting.current
    waiting.current = []
    for (const r of resolve) r()
  }, [routeKey])

  const value = React.useMemo<TransitionsContextValue>(
    () => ({
      nextRoute: () =>
        new Promise<void>((resolve) => {
          waiting.current.push(resolve)
          setTimeout(resolve, ROUTE_TIMEOUT)
        }),
    }),
    [],
  )
  return <TransitionsContext.Provider value={value}>{children}</TransitionsContext.Provider>
}

/**
 * Returns `start(update)`: runs a state change inside a view transition, for tabs, filters,
 * lists or opening a card. The update is flushed at once, so the new picture has it.
 */
export function useViewTransition() {
  return React.useCallback(
    (update: () => void, options?: TransitionOptions) =>
      transition(() => flushSync(update), options),
    [],
  )
}

/**
 * Returns `navigate(go)`: calls `go`, such as `() => router.push('/about')`, inside a view
 * transition that waits for the route to change. Needs `<Transitions routeKey>` around it.
 */
export function useNavigationTransition() {
  const context = React.useContext(TransitionsContext)
  return React.useCallback(
    (go: () => void, options?: TransitionOptions) =>
      transition(() => {
        const ready = context?.nextRoute() ?? Promise.resolve()
        go()
        return ready
      }, options),
    [context],
  )
}

/**
 * Returns a click handler for links that navigates with `push(href)` inside a view transition.
 * Clicks that open a new tab or window, downloads and other sites are left to the browser.
 */
export function useLinkTransition(push: (href: string) => void) {
  const navigate = useNavigationTransition()
  const pushRef = React.useRef(push)
  useIsomorphicLayoutEffect(() => {
    pushRef.current = push
  })
  return React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const a = event.currentTarget
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (a.target && a.target !== '_self') ||
        a.hasAttribute('download') ||
        a.origin !== window.location.origin
      )
        return
      event.preventDefault()
      void navigate(() => pushRef.current(a.pathname + a.search + a.hash))
    },
    [navigate],
  )
}

export interface TransitionProps extends Behavior {
  /** One element, which gets the name. With `stagger`, its children do. */
  children: React.ReactElement
}

/**
 * Says what its child does when the page or the state changes: morph into the element of the
 * same `name` on the other side, `persist`, `enter` and `exit` with an effect, or `stagger` its
 * children. It renders no element of its own.
 */
export function Transition({ children, ...behavior }: TransitionProps) {
  const ref = React.useRef<HTMLElement>(null)
  // Behaviors arrive as a fresh object every render; only their content should redo them.
  const key = JSON.stringify(behavior)
  const count = React.Children.count((children.props as { children?: React.ReactNode }).children)
  // `key` stands for the behavior, `count` for the children that stagger.
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return
    return mark(ref.current, behavior)
  }, [key, count])
  const own = (children.props as { ref?: React.Ref<HTMLElement> }).ref
  return React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, {
    ref: (node: HTMLElement | null) => {
      ref.current = node
      if (typeof own === 'function') return own(node)
      if (own) (own as React.RefObject<HTMLElement | null>).current = node
    },
  })
}
