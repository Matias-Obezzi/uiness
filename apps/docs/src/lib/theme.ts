import { useCallback, useSyncExternalStore } from 'react'

/**
 * Light or dark for the whole site. The class on <html> is the source of truth: the boot
 * script in index.html sets it from the same storage key before the first paint, and every
 * change goes through `setTheme`, so the header switch, the Customize drawer and the demos
 * all read and write one value.
 */
export type SiteTheme = 'light' | 'dark'

const KEY = 'uiness-theme'
const listeners = new Set<() => void>()

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

export function setTheme(theme: SiteTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(KEY, theme)
  } catch {}
  for (const l of listeners) l()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true)
  const toggle = useCallback(() => setTheme(isDark() ? 'light' : 'dark'), [])
  const theme: SiteTheme = dark ? 'dark' : 'light'
  return { dark, theme, setTheme, toggle }
}
