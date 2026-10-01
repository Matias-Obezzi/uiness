import { useSyncExternalStore } from 'react'

export const packageManagers = ['pnpm', 'npm', 'yarn', 'bun'] as const
export type PackageManager = (typeof packageManagers)[number]

const KEY = 'uiness-package-manager'
const listeners = new Set<() => void>()

const isManager = (value: unknown): value is PackageManager =>
  packageManagers.includes(value as PackageManager)

function read(): PackageManager {
  try {
    const stored = localStorage.getItem(KEY)
    return isManager(stored) ? stored : 'pnpm'
  } catch {
    return 'pnpm'
  }
}

let current: PackageManager = typeof window === 'undefined' ? 'pnpm' : read()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab picked a manager: follow it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    current = read()
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function set(next: PackageManager) {
  current = next
  try {
    localStorage.setItem(KEY, next)
  } catch {}
  for (const listener of listeners) listener()
}

/** The package manager picked in any install block, shared by all of them and remembered. */
export function usePackageManager() {
  const value = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'pnpm' as const,
  )
  return [value, set] as const
}

/** Run a package without installing it, the way each manager spells it. */
export function runCommand(pm: PackageManager, args: string) {
  switch (pm) {
    case 'pnpm':
      return `pnpm dlx ${args}`
    case 'npm':
      return `npx ${args}`
    case 'yarn':
      return `yarn ${args}`
    case 'bun':
      return `bunx --bun ${args}`
  }
}

/** Add packages to the project. */
export function addCommand(pm: PackageManager, packages: string) {
  return pm === 'npm' ? `npm install ${packages}` : `${pm} add ${packages}`
}
