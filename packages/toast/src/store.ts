import type {
  PromiseOptions,
  PromiseState,
  Toast,
  ToastOptions,
  ToastStore,
  ToastType,
} from './types'

let counter = 0
const nextId = () => `toast-${++counter}`

const isOptions = (value: unknown): value is ToastOptions =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !('$$typeof' in value) &&
  ('title' in value || 'description' in value || 'type' in value || 'id' in value)

const toOptions = (value: PromiseState<never> | ToastOptions | undefined): ToastOptions =>
  isOptions(value) ? value : { title: value as ToastOptions['title'] }

interface Timer {
  handle: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

export function createToastStore(): ToastStore {
  let toasts: Toast[] = []
  const listeners = new Set<() => void>()
  const timers = new Map<string, Timer>()
  let paused = false

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const clearTimer = (id: string) => {
    const timer = timers.get(id)
    if (timer?.handle) clearTimeout(timer.handle)
    timers.delete(id)
  }

  const durationOf = (options: ToastOptions): number => {
    if (options.duration !== undefined) return options.duration
    return options.type === 'loading' ? Number.POSITIVE_INFINITY : store.defaultDuration
  }

  const startTimer = (id: string, remaining: number) => {
    clearTimer(id)
    if (!Number.isFinite(remaining) || remaining <= 0) return
    if (paused) {
      timers.set(id, { handle: null, remaining, startedAt: Date.now() })
      return
    }
    const handle = setTimeout(() => {
      const toast = toasts.find((t) => t.id === id)
      if (!toast) return
      toast.onAutoClose?.(toast)
      dismiss(id)
    }, remaining)
    timers.set(id, { handle, remaining, startedAt: Date.now() })
  }

  const getToasts = () => toasts

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const update = (id: string, patch: Partial<ToastOptions>) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index === -1) return
    const previous = toasts[index] as Toast
    const merged: Toast = {
      ...previous,
      ...patch,
      id,
      type: patch.type ?? previous.type,
      dismissible: patch.dismissible ?? previous.dismissible,
      removing: false,
    }
    toasts = [...toasts.slice(0, index), merged, ...toasts.slice(index + 1)]
    if ('duration' in patch || 'type' in patch) startTimer(id, durationOf(merged))
    emit()
  }

  const add = (options: ToastOptions): string => {
    const id = options.id ?? nextId()
    if (toasts.some((t) => t.id === id)) {
      update(id, options)
      return id
    }
    const toast: Toast = {
      ...options,
      id,
      type: options.type ?? 'default',
      dismissible: options.dismissible ?? true,
      createdAt: Date.now(),
    }
    toasts = [...toasts, toast]
    startTimer(id, durationOf(toast))
    emit()
    return id
  }

  const remove = (id: string) => {
    const toast = toasts.find((t) => t.id === id)
    if (!toast) return
    clearTimer(id)
    toasts = toasts.filter((t) => t.id !== id)
    emit()
    toast.onDismiss?.(toast)
  }

  const dismiss = (id?: string) => {
    const target = id ?? toasts[toasts.length - 1]?.id
    if (!target) return
    const toast = toasts.find((t) => t.id === target)
    if (!toast || toast.removing) return
    clearTimer(target)
    toasts = toasts.map((t) => (t.id === target ? { ...t, removing: true } : t))
    emit()
    // Without a Toaster nothing animates, so make sure it still goes away.
    setTimeout(() => remove(target), 1000)
  }

  const dismissAll = () => {
    for (const toast of toasts) dismiss(toast.id)
  }

  const pause = () => {
    if (paused) return
    paused = true
    for (const timer of timers.values()) {
      if (!timer.handle) continue
      clearTimeout(timer.handle)
      timer.handle = null
      timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
    }
  }

  const resume = () => {
    if (!paused) return
    paused = false
    for (const [id, timer] of timers) {
      if (timer.handle) continue
      startTimer(id, timer.remaining)
    }
  }

  const store: ToastStore = {
    getToasts,
    subscribe,
    add,
    update,
    dismiss,
    dismissAll,
    remove,
    pause,
    resume,
    defaultDuration: 4000,
  }
  return store
}

export interface ToastFunction {
  (title: ToastOptions['title'] | ToastOptions, options?: ToastOptions): string
  success: (title: ToastOptions['title'], options?: ToastOptions) => string
  error: (title: ToastOptions['title'], options?: ToastOptions) => string
  info: (title: ToastOptions['title'], options?: ToastOptions) => string
  warning: (title: ToastOptions['title'], options?: ToastOptions) => string
  loading: (title: ToastOptions['title'], options?: ToastOptions) => string
  /** Render your own card. The function gets the toast so it can dismiss itself. */
  custom: (render: NonNullable<ToastOptions['render']>, options?: ToastOptions) => string
  promise: <T, E = unknown>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T, E>,
  ) => Promise<T>
  dismiss: (id?: string) => void
  /** The store behind this function, for `<Toaster store>` and custom renderers. */
  store: ToastStore
}

/** Build a `toast()` function bound to a store. */
export function createToast(store: ToastStore): ToastFunction {
  const withType =
    (type: ToastType) =>
    (title: ToastOptions['title'], options: ToastOptions = {}) =>
      store.add({ ...options, title, type })

  const fn = ((title, options = {}) =>
    isOptions(title)
      ? store.add({ ...options, ...title })
      : store.add({ ...options, title })) as ToastFunction

  fn.success = withType('success')
  fn.error = withType('error')
  fn.info = withType('info')
  fn.warning = withType('warning')
  fn.loading = withType('loading')
  fn.custom = (render, options = {}) => store.add({ ...options, render })
  fn.dismiss = (id) => (id ? store.dismiss(id) : store.dismissAll())
  fn.store = store

  fn.promise = <T, E = unknown>(
    input: Promise<T> | (() => Promise<T>),
    { loading, success, error, options = {} }: PromiseOptions<T, E>,
  ): Promise<T> => {
    const pending = typeof input === 'function' ? input() : input
    const id = store.add({ ...options, ...toOptions(loading), type: 'loading' })
    const resolveState = <V>(state: PromiseState<V> | undefined, value: V) =>
      typeof state === 'function' ? state(value) : state
    pending.then(
      (value) => {
        const next = resolveState(success, value)
        if (next === undefined) return store.dismiss(id)
        store.update(id, { ...toOptions(next), type: 'success', duration: options.duration })
      },
      (reason: E) => {
        const next = resolveState(error, reason)
        if (next === undefined) return store.dismiss(id)
        store.update(id, { ...toOptions(next), type: 'error', duration: options.duration })
      },
    )
    return pending
  }

  return fn
}

/** Shared store and `toast()` used by `<Toaster />` when no store is provided. */
export const toastStore: ToastStore = createToastStore()
export const toast: ToastFunction = createToast(toastStore)
