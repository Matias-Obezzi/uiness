'use client'

import { DropdownMenu as DropdownMenuPrimitive, Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/ui/dropdown-menu'

export interface ContextMenuItemAction {
  type?: 'item'
  /** Stable key. Defaults to the position in the list. */
  id?: string
  label: React.ReactNode
  icon?: React.ReactNode
  /** Shown on the right, like `⌘C`. It is only a hint: bind the keys yourself. */
  shortcut?: string
  variant?: 'default' | 'destructive'
  disabled?: boolean
  onSelect: (event: Event) => void
}

export interface ContextMenuCheckboxAction {
  type: 'checkbox'
  id?: string
  label: React.ReactNode
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

export interface ContextMenuSubAction {
  type: 'sub'
  id?: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  actions: ContextMenuAction[]
}

export interface ContextMenuLabelAction {
  type: 'label'
  id?: string
  label: React.ReactNode
}

/**
 * One entry in a menu. `'separator'` draws a line; `false`, `null` and `undefined` are
 * dropped, so `canDelete && { ... }` reads naturally. Separators that end up doubled or at an
 * edge once entries are dropped are removed too.
 */
export type ContextMenuAction =
  | ContextMenuItemAction
  | ContextMenuCheckboxAction
  | ContextMenuSubAction
  | ContextMenuLabelAction
  | 'separator'
  | false
  | null
  | undefined

export interface ContextMenuTarget<T = unknown> {
  /** Whatever the element passed as `data`. */
  data: T
  /** The element that was right clicked, or pressed and held. */
  element: HTMLElement
}

/** A named menu: turns the target into its actions. */
export type ContextMenuDefinition<T = unknown> = (
  target: ContextMenuTarget<T>,
) => ContextMenuAction[]

// `never` lets definitions ask for any data type and still fit in one map.
export type ContextMenus = Record<string, ContextMenuDefinition<never>>

/** Declares the menus the app knows about. Only here for type inference. */
export function defineContextMenus<M extends ContextMenus>(menus: M): M {
  return menus
}

export interface UseContextMenuOptions<T = unknown> {
  /** Name of a menu declared on the provider. */
  context?: string
  /** Handed to the menu, so one declaration serves every item. */
  data?: T
  /** Actions for this element alone. Given, they replace the named menu. */
  actions?: ContextMenuAction[] | ((target: ContextMenuTarget<T>) => ContextMenuAction[])
  /** Change the named menu for this element: add to it, remove from it, reorder it. */
  extend?: (actions: ContextMenuAction[], target: ContextMenuTarget<T>) => ContextMenuAction[]
  /** Leave the browser's own menu in place. */
  disabled?: boolean
}

type Point = { x: number; y: number }

interface MenuState {
  open: boolean
  point: Point
  actions: ContextMenuAction[]
  /** Changes on every opening, so the menu animates in afresh at a new spot. */
  key: number
}

interface ContextMenuContextValue {
  resolve: (options: UseContextMenuOptions<unknown>, element: HTMLElement) => ContextMenuAction[]
  show: (point: Point, actions: ContextMenuAction[]) => void
  close: () => void
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null)

function useContextMenuContext(hook: string) {
  const value = React.useContext(ContextMenuContext)
  if (!value) throw new Error(`${hook} must be used inside <ContextMenuProvider>.`)
  return value
}

/** Drops empty entries, and separators left at an edge or next to each other. */
function tidy(actions: ContextMenuAction[]) {
  const out: Exclude<ContextMenuAction, false | null | undefined>[] = []
  for (const action of actions) {
    if (!action) continue
    if (action === 'separator' && (out.length === 0 || out[out.length - 1] === 'separator'))
      continue
    out.push(action)
  }
  while (out[out.length - 1] === 'separator') out.pop()
  return out
}

/** Where a menu opened from the keyboard goes: the corner of the focused element. */
function pointFor(event: React.MouseEvent | MouseEvent, element: HTMLElement): Point {
  if (event.clientX === 0 && event.clientY === 0) {
    const rect = element.getBoundingClientRect()
    return { x: rect.left, y: rect.bottom }
  }
  return { x: event.clientX, y: event.clientY }
}

function renderActions(actions: ContextMenuAction[]): React.ReactNode {
  return tidy(actions).map((action, i) => {
    if (action === 'separator') {
      // biome-ignore lint/suspicious/noArrayIndexKey: separators have nothing else to key on
      return <DropdownMenuSeparator key={`separator-${i}`} />
    }
    const key = action.id ?? `${action.type ?? 'item'}-${i}`
    switch (action.type) {
      case 'label':
        return <DropdownMenuLabel key={key}>{action.label}</DropdownMenuLabel>
      case 'checkbox':
        return (
          <DropdownMenuCheckboxItem
            key={key}
            checked={action.checked}
            disabled={action.disabled}
            onCheckedChange={(checked) => action.onCheckedChange(checked === true)}
          >
            {action.label}
          </DropdownMenuCheckboxItem>
        )
      case 'sub':
        return (
          <DropdownMenuSub key={key}>
            <DropdownMenuSubTrigger disabled={action.disabled}>
              {action.icon}
              {action.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{renderActions(action.actions)}</DropdownMenuSubContent>
          </DropdownMenuSub>
        )
      default:
        return (
          <DropdownMenuItem
            key={key}
            variant={action.variant}
            disabled={action.disabled}
            onSelect={action.onSelect}
          >
            {action.icon}
            {action.label}
            {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
          </DropdownMenuItem>
        )
    }
  })
}

export interface ContextMenuProviderProps {
  /** The menus the app knows about, by name. */
  menus?: ContextMenus
  /** Menu for a right click anywhere no element claimed. Without it the browser's shows. */
  fallback?: string
  /** Class for the menu panel. */
  className?: string
  children?: React.ReactNode
}

/**
 * Holds the named menus and draws the one menu the whole app shares. Mount it once near the
 * root; elements then pick a menu with `useContextMenu` or `ContextMenuArea`.
 */
function ContextMenuProvider({ menus, fallback, className, children }: ContextMenuProviderProps) {
  const [state, setState] = React.useState<MenuState>({
    open: false,
    point: { x: 0, y: 0 },
    actions: [],
    key: 0,
  })
  const menusRef = React.useRef(menus)
  menusRef.current = menus
  const returnFocus = React.useRef<HTMLElement | null>(null)
  // Set as it happens, not on render: a menu closing late must know a new one is open.
  const isOpen = React.useRef(false)

  const resolve = React.useCallback(
    (options: UseContextMenuOptions<unknown>, element: HTMLElement) => {
      const target: ContextMenuTarget<unknown> = { data: options.data, element }
      if (options.actions) {
        return typeof options.actions === 'function' ? options.actions(target) : options.actions
      }
      const definition = options.context
        ? (menusRef.current?.[options.context] as ContextMenuDefinition<unknown> | undefined)
        : undefined
      const actions = definition ? definition(target) : []
      return options.extend ? options.extend(actions, target) : actions
    },
    [],
  )

  const show = React.useCallback((point: Point, actions: ContextMenuAction[]) => {
    const active = document.activeElement
    returnFocus.current = active instanceof HTMLElement ? active : null
    isOpen.current = true
    setState((s) => ({ open: true, point, actions, key: s.key + 1 }))
  }, [])

  const close = React.useCallback(() => {
    isOpen.current = false
    setState((s) => ({ ...s, open: false }))
  }, [])

  // A right click nobody claimed opens the fallback menu, when there is one.
  React.useEffect(() => {
    if (!fallback) return
    const onContextMenu = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLElement)) return
      const actions = tidy(resolve({ context: fallback }, event.target))
      if (actions.length === 0) return
      event.preventDefault()
      show(pointFor(event, event.target), actions)
    }
    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [fallback, resolve, show])

  // Like a native menu, it goes away when the page moves under it.
  React.useEffect(() => {
    if (!state.open) return
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, { capture: true })
    }
  }, [state.open, close])

  const value = React.useMemo(() => ({ resolve, show, close }), [resolve, show, close])

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <DropdownMenuPrimitive.Root
        open={state.open}
        onOpenChange={(open) => !open && close()}
        modal={false}
      >
        <DropdownMenuPrimitive.Trigger asChild>
          <span
            aria-hidden
            tabIndex={-1}
            data-slot="context-menu-anchor"
            style={{
              position: 'fixed',
              left: state.point.x,
              top: state.point.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuContent
          key={state.key}
          data-slot="context-menu"
          align="start"
          side="bottom"
          sideOffset={2}
          collisionPadding={8}
          className={cn('min-w-44', className)}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            // A right click elsewhere closes this menu and opens the next one before this
            // one is gone. Handing focus back now would pull it out of the new menu, which
            // would take that as a click outside and close too.
            if (isOpen.current) return
            // Back to whatever had focus before, not to the invisible anchor.
            returnFocus.current?.focus({ preventScroll: true })
          }}
        >
          {renderActions(state.actions)}
        </DropdownMenuContent>
      </DropdownMenuPrimitive.Root>
    </ContextMenuContext.Provider>
  )
}

const LONG_PRESS = 550
const SLOP = 10

export interface ContextMenuTriggerProps {
  onContextMenu: React.MouseEventHandler<HTMLElement>
  onPointerDown: React.PointerEventHandler<HTMLElement>
  onPointerMove: React.PointerEventHandler<HTMLElement>
  onPointerUp: React.PointerEventHandler<HTMLElement>
  onPointerCancel: React.PointerEventHandler<HTMLElement>
  'data-context-menu': string
}

/**
 * Gives an element a context menu: a named one from the provider, its own actions, or a
 * named one adjusted with `extend`. Spread the result on the element. Opens on right click,
 * on Shift+F10 or the menu key when focused, and on a long press on touch screens. The
 * innermost element with a menu wins.
 */
function useContextMenu<T = unknown>(options: UseContextMenuOptions<T>): ContextMenuTriggerProps {
  const { resolve, show } = useContextMenuContext('useContextMenu')
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const press = React.useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(
    null,
  )

  const cancelPress = React.useCallback(() => {
    if (press.current) clearTimeout(press.current.timer)
    press.current = null
  }, [])

  React.useEffect(() => cancelPress, [cancelPress])

  const open = React.useCallback(
    (point: Point, element: HTMLElement) => {
      const current = optionsRef.current
      if (current.disabled) return false
      const actions = tidy(resolve(current as UseContextMenuOptions<unknown>, element))
      if (actions.length === 0) return false
      show(point, actions)
      return true
    },
    [resolve, show],
  )

  return React.useMemo(
    () => ({
      'data-context-menu': options.context ?? 'custom',
      onContextMenu: (event) => {
        cancelPress()
        // An element inside already opened its menu.
        if (event.defaultPrevented) return
        if (open(pointFor(event, event.currentTarget), event.currentTarget)) event.preventDefault()
      },
      onPointerDown: (event) => {
        if (event.pointerType !== 'touch') return
        cancelPress()
        const element = event.currentTarget
        const { clientX: x, clientY: y } = event
        press.current = {
          x,
          y,
          timer: setTimeout(() => {
            press.current = null
            open({ x, y }, element)
          }, LONG_PRESS),
        }
      },
      onPointerMove: (event) => {
        const p = press.current
        if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > SLOP) cancelPress()
      },
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
    }),
    [options.context, open, cancelPress],
  )
}

/** Opens and closes the shared menu from code, for a "more" button for instance. */
function useContextMenuControls() {
  const { resolve, show, close } = useContextMenuContext('useContextMenuControls')
  return React.useMemo(
    () => ({
      /** Opens at a point, or under an element, with a named menu or its own actions. */
      open<T = unknown>(at: Point | HTMLElement, options: UseContextMenuOptions<T>) {
        const element = at instanceof HTMLElement ? at : document.body
        const point =
          at instanceof HTMLElement
            ? { x: at.getBoundingClientRect().left, y: at.getBoundingClientRect().bottom }
            : at
        const actions = tidy(resolve(options as UseContextMenuOptions<unknown>, element))
        if (actions.length > 0) show(point, actions)
      },
      close,
    }),
    [resolve, show, close],
  )
}

export interface ContextMenuAreaProps<T = unknown>
  extends UseContextMenuOptions<T>,
    Omit<React.ComponentProps<'div'>, keyof UseContextMenuOptions<T>> {
  /** Put the menu on the child element instead of a wrapping `div`. */
  asChild?: boolean
}

const HANDLERS = [
  'onContextMenu',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel',
] as const

/** `useContextMenu` as an element, composing with the handlers it already has. */
function ContextMenuArea<T = unknown>({
  context,
  data,
  actions,
  extend,
  disabled,
  asChild,
  ...props
}: ContextMenuAreaProps<T>) {
  const menu = useContextMenu<T>({ context, data, actions, extend, disabled })
  const merged: Record<string, unknown> = { ...props, ...menu }
  for (const name of HANDLERS) {
    const theirs = props[name] as ((event: never) => void) | undefined
    const ours = menu[name] as (event: never) => void
    // Theirs first: a handler that prevents the default keeps the browser's menu.
    if (theirs)
      merged[name] = (event: never) => {
        theirs(event)
        ours(event)
      }
  }
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp data-slot="context-menu-area" {...merged} />
}

export { ContextMenuArea, ContextMenuProvider, useContextMenu, useContextMenuControls }
