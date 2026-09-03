import { AlertContent, ConfirmContent } from './content'
import type {
  AlertOptions,
  ConfirmOptions,
  IslandEntry,
  IslandHandle,
  IslandOptions,
  IslandStore,
  PromiseState,
  PromiseStates,
} from './types'

let counter = 0
const nextId = () => `island-${++counter}`

const isOptions = (value: unknown): value is IslandOptions =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !('$$typeof' in value) &&
  ('content' in value || 'leading' in value || 'trailing' in value || 'mode' in value)

const toOptions = (value: PromiseState<never> | IslandOptions | undefined): IslandOptions =>
  isOptions(value) ? value : { mode: 'compact', content: value as IslandOptions['content'] }

interface Timer {
  handle: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

/** Creates an isolated island store. The package also exports a shared default one. */
export function createIsland(): IslandStore {
  let stack: IslandEntry[] = []
  const listeners = new Set<() => void>()
  const timers = new Map<string, Timer>()

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const clearTimer = (id: string) => {
    const timer = timers.get(id)
    if (timer?.handle) clearTimeout(timer.handle)
    timers.delete(id)
  }

  const startTimer = (id: string, remaining: number) => {
    clearTimer(id)
    if (!(remaining > 0)) return
    const handle = setTimeout(() => dismiss(id), remaining)
    timers.set(id, { handle, remaining, startedAt: Date.now() })
  }

  const normalize = (options: IslandOptions, id: string, createdAt: number): IslandEntry => {
    const mode =
      options.mode ??
      (options.leading == null && options.trailing == null && options.content != null
        ? 'expanded'
        : 'compact')
    return {
      ...options,
      id,
      mode,
      dismissible: options.dismissible ?? mode === 'expanded',
      createdAt,
    }
  }

  const getStack = () => stack
  const getCurrent = () => stack[stack.length - 1]

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const update = (id: string, patch: Partial<IslandOptions>) => {
    const index = stack.findIndex((entry) => entry.id === id)
    if (index === -1) return
    const previous = stack[index] as IslandEntry
    const next = normalize({ ...previous, ...patch }, id, previous.createdAt)
    stack = [...stack.slice(0, index), next, ...stack.slice(index + 1)]
    if ('duration' in patch) startTimer(id, patch.duration ?? 0)
    emit()
  }

  const dismiss = (id?: string) => {
    const target = id ?? getCurrent()?.id
    if (!target) return
    const entry = stack.find((item) => item.id === target)
    if (!entry) return
    clearTimer(target)
    stack = stack.filter((item) => item.id !== target)
    emit()
    entry.onDismiss?.()
  }

  const dismissAll = () => {
    const removed = stack
    for (const entry of removed) clearTimer(entry.id)
    stack = []
    emit()
    for (const entry of removed) entry.onDismiss?.()
  }

  const show = (options: IslandOptions): IslandHandle => {
    const id = options.id ?? nextId()
    const existing = stack.find((entry) => entry.id === id)
    if (existing) {
      update(id, options)
    } else {
      stack = [...stack, normalize(options, id, Date.now())]
      startTimer(id, options.duration ?? 0)
      emit()
    }
    return {
      id,
      update: (patch) => update(id, patch),
      dismiss: () => dismiss(id),
    }
  }

  const pause = (id: string) => {
    const timer = timers.get(id)
    if (!timer?.handle) return
    clearTimeout(timer.handle)
    timer.handle = null
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
  }

  const resume = (id: string) => {
    const timer = timers.get(id)
    if (!timer || timer.handle) return
    startTimer(id, timer.remaining)
  }

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      let settled = false
      const finish = (value: boolean) => {
        if (settled) return
        settled = true
        resolve(value)
      }
      const handle = show({
        mode: 'expanded',
        role: 'alertdialog',
        dismissible: options.dismissible ?? true,
        width: options.width,
        onDismiss: () => finish(false),
        content: (
          <ConfirmContent
            {...options}
            onConfirm={() => {
              finish(true)
              handle.dismiss()
            }}
            onCancel={() => {
              finish(false)
              handle.dismiss()
            }}
          />
        ),
      })
    })

  const alert = (options: AlertOptions) =>
    new Promise<void>((resolve) => {
      const mode = options.mode ?? 'expanded'
      const base: IslandOptions = {
        mode,
        role: 'alert',
        duration: options.duration ?? 4000,
        dismissible: options.dismissible ?? true,
        width: options.width,
        onDismiss: () => resolve(),
      }
      if (mode === 'compact') {
        show({ ...base, leading: options.icon, trailing: options.title })
      } else {
        show({ ...base, content: <AlertContent {...options} /> })
      }
    })

  const promise = <T, E = unknown>(
    input: Promise<T> | (() => Promise<T>),
    states: PromiseStates<T, E>,
  ): Promise<T> => {
    const pending = typeof input === 'function' ? input() : input
    const handle = show({ ...toOptions(states.loading), dismissible: false })
    const resolveState = <V,>(state: PromiseState<V> | undefined, value: V) =>
      typeof state === 'function' ? state(value) : state

    pending.then(
      (value) => {
        const next = resolveState(states.success, value)
        if (next === undefined) return handle.dismiss()
        handle.update({ ...toOptions(next), duration: states.successDuration ?? 2500 })
      },
      (error: E) => {
        const next = resolveState(states.error, error)
        if (next === undefined) return handle.dismiss()
        handle.update({ ...toOptions(next), duration: states.errorDuration ?? 4000 })
      },
    )
    return pending
  }

  return {
    getStack,
    getCurrent,
    subscribe,
    show,
    update,
    dismiss,
    dismissAll,
    pause,
    resume,
    confirm,
    alert,
    promise,
  }
}

/** Shared store used by `<Island />` and `useIsland()` when no store is provided. */
export const island: IslandStore = createIsland()
