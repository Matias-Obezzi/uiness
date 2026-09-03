import { createContext, useContext, useSyncExternalStore } from 'react'
import { island as defaultStore } from './store'
import type { IslandEntry, IslandStore } from './types'

export const IslandContext = createContext<IslandStore | null>(null)

/**
 * Scope `useIsland()` to a custom store created with `createIsland()`.
 * Only needed when running more than one island, or for isolation in tests.
 */
export const IslandProvider = IslandContext.Provider

/** The island API: `show`, `update`, `dismiss`, `confirm`, `alert`, `promise`... */
export function useIsland(store?: IslandStore): IslandStore {
  const contextStore = useContext(IslandContext)
  return store ?? contextStore ?? defaultStore
}

const EMPTY: IslandEntry[] = []
const getServerStack = () => EMPTY
const getServerCurrent = () => undefined

/** The entry currently shown by the island, or `undefined` when idle. */
export function useIslandEntry(store?: IslandStore): IslandEntry | undefined {
  const target = useIsland(store)
  return useSyncExternalStore(target.subscribe, target.getCurrent, getServerCurrent)
}

/** Whole stack of entries, bottom to top. */
export function useIslandStack(store?: IslandStore): IslandEntry[] {
  const target = useIsland(store)
  return useSyncExternalStore(target.subscribe, target.getStack, getServerStack)
}
