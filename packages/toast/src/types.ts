import type { CSSProperties, MouseEvent, ReactNode } from 'react'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastAction {
  label: ReactNode
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export interface ToastOptions {
  /** Reuse an id to update a toast in place. */
  id?: string
  title?: ReactNode
  description?: ReactNode
  type?: ToastType
  /** Replaces the type icon. `null` hides it. */
  icon?: ReactNode | null
  /**
   * Auto dismiss delay in ms. `0` or `Infinity` keeps the toast until it is closed.
   * Defaults to the Toaster duration; loading toasts default to `Infinity`.
   */
  duration?: number
  /** Primary button. */
  action?: ToastAction
  /** Secondary button, closes the toast after `onClick`. */
  cancel?: ToastAction
  /** Swipe and click on the close button. Default true. */
  dismissible?: boolean
  /** Show a close button, overrides the Toaster setting. */
  closeButton?: boolean
  /** Position for this toast, overrides the Toaster setting. */
  position?: ToastPosition
  /** Announce assertively to screen readers. */
  important?: boolean
  className?: string
  style?: CSSProperties
  /** Called when the toast leaves for any reason. */
  onDismiss?: (toast: Toast) => void
  /** Called when the toast leaves because its timer ran out. */
  onAutoClose?: (toast: Toast) => void
  /** Replace the whole card with your own markup. */
  render?: (toast: Toast) => ReactNode
  /** A bar along the bottom that empties as the time runs out. Overrides the Toaster setting. */
  progress?: boolean
  /**
   * Fold a toast with the same type, title and description into the one already showing,
   * which counts up and starts its time again. Only for string titles. Default true.
   */
  dedupe?: boolean
}

export interface Toast extends ToastOptions {
  id: string
  type: ToastType
  dismissible: boolean
  createdAt: number
  /** Changes on every update, so anything timed from the toast can start over. */
  updatedAt: number
  /** How many identical toasts were folded into this one, itself included. */
  count: number
  /** Set while the exit animation plays. */
  removing?: boolean
}

export type PromiseState<T> = ReactNode | ToastOptions | ((value: T) => ReactNode | ToastOptions)

export interface PromiseOptions<T, E = unknown> {
  loading: ReactNode | ToastOptions
  success?: PromiseState<T>
  error?: PromiseState<E>
  /** Toast options shared by the three states. */
  options?: Omit<ToastOptions, 'type' | 'title'>
}

export interface ToastStore {
  getToasts: () => Toast[]
  subscribe: (listener: () => void) => () => void
  /** Add a toast, or update it in place when `id` already exists. Returns the id. */
  add: (options: ToastOptions) => string
  update: (id: string, patch: Partial<ToastOptions>) => void
  /** Start the exit animation. */
  dismiss: (id?: string) => void
  dismissAll: () => void
  /** Drop the toast after its exit animation. Called by the Toaster. */
  remove: (id: string) => void
  /** Pause every auto dismiss timer, for example while hovering. */
  pause: () => void
  resume: () => void
  /** Default duration for toasts without one. Set by the Toaster. */
  defaultDuration: number
}
