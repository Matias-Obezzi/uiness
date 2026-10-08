import type { ReactNode } from 'react'
import {
  AlertContent,
  Check,
  ChooseContent,
  ConfirmContent,
  Countdown,
  ProgressRing,
  PromptContent,
  Spinner,
} from './content'
import type {
  AlertOptions,
  ChooseOptions,
  ConfirmOptions,
  IslandEntry,
  IslandHandle,
  IslandOptions,
  IslandStore,
  ProgressHandle,
  ProgressOptions,
  PromiseState,
  PromiseStates,
  PromptOptions,
  TimerOptions,
  UndoOptions,
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

  // Entries paused by the caller (the pointer over the island), apart from the ones waiting
  // under another: only the entry on screen counts down, so nothing expires unseen.
  const held = new Set<string>()

  const clearTimer = (id: string) => {
    const timer = timers.get(id)
    if (timer?.handle) clearTimeout(timer.handle)
    timers.delete(id)
  }

  const stop = (timer: Timer) => {
    if (!timer.handle) return
    clearTimeout(timer.handle)
    timer.handle = null
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt))
  }

  const run = (id: string, timer: Timer) => {
    if (timer.handle) return
    timer.startedAt = Date.now()
    timer.handle = setTimeout(() => dismiss(id), timer.remaining)
  }

  /** Run the visible entry's timer, unless held, and stop every other. */
  const sync = () => {
    const top = getCurrent()?.id
    for (const [id, timer] of timers) {
      if (id === top && !held.has(id)) run(id, timer)
      else stop(timer)
    }
  }

  const startTimer = (id: string, remaining: number) => {
    clearTimer(id)
    if (!(remaining > 0)) return
    timers.set(id, { handle: null, remaining, startedAt: Date.now() })
    sync()
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
    held.delete(target)
    stack = stack.filter((item) => item.id !== target)
    sync()
    emit()
    entry.onDismiss?.()
  }

  const dismissAll = () => {
    const removed = stack
    for (const entry of removed) clearTimer(entry.id)
    held.clear()
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
      sync()
      emit()
    }
    return {
      id,
      update: (patch) => update(id, patch),
      dismiss: () => dismiss(id),
    }
  }

  const pause = (id: string) => {
    held.add(id)
    sync()
  }

  const resume = (id: string) => {
    held.delete(id)
    sync()
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

  /** A dialog entry that settles once, with whatever ended it. */
  const ask = <T,>(
    options: { dismissible?: boolean; width?: number | string },
    content: (finish: (value: T | null) => void) => ReactNode,
  ) =>
    new Promise<T | null>((resolve) => {
      let settled = false
      const finish = (value: T | null) => {
        if (settled) return
        settled = true
        resolve(value)
        handle.dismiss()
      }
      const handle = show({
        mode: 'expanded',
        role: 'dialog',
        dismissible: options.dismissible ?? true,
        width: options.width,
        onDismiss: () => finish(null),
        content: content(finish),
      })
    })

  const prompt = (options: PromptOptions) =>
    ask<string>(options, (finish) => (
      <PromptContent {...options} onSubmit={finish} onCancel={() => finish(null)} />
    ))

  const choose = <T,>(options: ChooseOptions<T>) =>
    ask<T>(options, (finish) => (
      <ChooseContent<T> {...options} onChoose={finish} onCancel={() => finish(null)} />
    ))

  const undo = (message: ReactNode, options: UndoOptions = {}) =>
    new Promise<boolean>((resolve) => {
      let undone = false
      const handle = show({
        id: options.id,
        mode: 'compact',
        role: 'status',
        leading: options.icon,
        content: message,
        duration: options.duration ?? 5000,
        onDismiss: () => resolve(undone),
        trailing: (
          <button
            type="button"
            data-island-undo=""
            onClick={() => {
              undone = true
              handle.dismiss()
            }}
            style={{
              font: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              background: 'var(--island-muted, rgba(255, 255, 255, 0.14))',
            }}
          >
            {options.undoText ?? 'Undo'}
          </button>
        ),
      })
    })

  const progress = ({ value, ...options }: ProgressOptions): ProgressHandle => {
    const ring = (v: number | undefined) =>
      v === undefined ? <Spinner /> : <ProgressRing value={v} />
    const handle = show({ mode: 'compact', role: 'status', ...options, leading: ring(value) })
    return {
      ...handle,
      set: (next) => handle.update({ leading: ring(next) }),
      done: (patch = {}) => handle.update({ leading: <Check />, duration: 2000, ...patch }),
    }
  }

  const timer = ({ seconds, onEnd, ...options }: TimerOptions): IslandHandle => {
    const endsAt = Date.now() + seconds * 1000
    // Its own clock, not the entry's duration: a countdown keeps going under the pointer and
    // under other entries, where an auto dismiss waits.
    const end = setTimeout(() => {
      onEnd?.()
      handle.dismiss()
    }, seconds * 1000)
    const handle = show({
      mode: 'compact',
      role: 'timer',
      ...options,
      trailing: <Countdown endsAt={endsAt} />,
      onDismiss: () => {
        clearTimeout(end)
        options.onDismiss?.()
      },
    })
    return handle
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
    prompt,
    choose,
    undo,
    progress,
    timer,
  }
}

/** Shared store used by `<Island />` and `useIsland()` when no store is provided. */
export const island: IslandStore = createIsland()
