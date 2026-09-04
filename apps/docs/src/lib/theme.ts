import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'uiness-theme'
const listeners = new Set<() => void>()

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

function setDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
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
  const toggle = useCallback(() => setDark(!isDark()), [])
  return { dark, toggle }
}
