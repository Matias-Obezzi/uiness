import type { ReactNode } from 'react'

export type IslandMode = 'compact' | 'expanded'

export type IslandRole = 'status' | 'alert' | 'dialog' | 'alertdialog'

export interface IslandOptions {
  /** Reuse an id to update an entry in place instead of stacking a new one. */
  id?: string
  /**
   * `compact` keeps the pill height and lays out `leading`, `content` and `trailing` in a row.
   * `expanded` grows into a panel for `content`. Defaults to `expanded` when only `content`
   * is given, otherwise `compact`.
   */
  mode?: IslandMode
  /** Left slot in compact mode (an icon, a spinner, an avatar). */
  leading?: ReactNode
  /** Right slot in compact mode (a label, a counter, a timer). */
  trailing?: ReactNode
  /** Center content in compact mode, the whole panel in expanded mode. */
  content?: ReactNode
  /** Auto dismiss after this many ms. Omit for a persistent entry. */
  duration?: number
  /**
   * Dismiss on Escape and on pointer down outside the island.
   * Defaults to `true` for expanded entries and `false` for compact ones.
   */
  dismissible?: boolean
  /** ARIA role of the island while this entry is shown. */
  role?: IslandRole
  /** Width of the expanded panel. Defaults to the content's width, capped to the viewport. */
  width?: number | string
  /** Called once the entry leaves the island, whatever the reason. */
  onDismiss?: () => void
}

export interface IslandEntry extends IslandOptions {
  id: string
  mode: IslandMode
  dismissible: boolean
  createdAt: number
}

export interface IslandHandle {
  id: string
  update: (patch: Partial<IslandOptions>) => void
  dismiss: () => void
}

export interface ConfirmOptions {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  confirmText?: ReactNode
  cancelText?: ReactNode
  /** Styles the confirm button as destructive. */
  destructive?: boolean
  width?: number | string
  /** Allow Escape and outside clicks to cancel. Default true. */
  dismissible?: boolean
}

export interface AlertOptions {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** `expanded` (default) or `compact` (icon left, title right). */
  mode?: IslandMode
  /** Auto dismiss delay in ms. Default 4000. */
  duration?: number
  width?: number | string
  dismissible?: boolean
}

export type PromiseState<T = unknown> =
  | ReactNode
  | IslandOptions
  | ((value: T) => ReactNode | IslandOptions)

export interface PromiseStates<T, E = unknown> {
  loading: ReactNode | IslandOptions
  success?: PromiseState<T>
  error?: PromiseState<E>
  /** How long the success state stays. Default 2500. */
  successDuration?: number
  /** How long the error state stays. Default 4000. */
  errorDuration?: number
}

export interface IslandStore {
  /** Full stack, bottom to top. The last entry is the visible one. */
  getStack: () => IslandEntry[]
  /** Visible entry, if any. */
  getCurrent: () => IslandEntry | undefined
  subscribe: (listener: () => void) => () => void
  /** Push an entry on top of the stack, or update it in place when `id` already exists. */
  show: (options: IslandOptions) => IslandHandle
  update: (id: string, patch: Partial<IslandOptions>) => void
  /** Dismiss one entry by id, or the visible one. */
  dismiss: (id?: string) => void
  dismissAll: () => void
  /** Pause the auto dismiss timer of an entry (used while hovering). */
  pause: (id: string) => void
  resume: (id: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: AlertOptions) => Promise<void>
  promise: <T, E = unknown>(
    promise: Promise<T> | (() => Promise<T>),
    states: PromiseStates<T, E>,
  ) => Promise<T>
}
