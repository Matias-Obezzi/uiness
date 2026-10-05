import { useSyncExternalStore } from 'react'
import {
  accentColors,
  baseColors,
  defaultTheme,
  radii,
  sameTheme,
  scopedCss,
  type ThemeChoice,
} from './themes'

/**
 * The reader's theme for the component previews: one store for the whole site, so the
 * Customize drawer, the themes page and every preview agree, and the choice survives reloads.
 */

const KEY = 'uiness-themes-choice'
const STYLE_ID = 'uiness-preview-theme'

function read(): ThemeChoice {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (
      stored &&
      stored.base in baseColors &&
      (stored.accent === 'none' || stored.accent in accentColors) &&
      radii.includes(stored.radius)
    ) {
      const custom = stored.custom ?? {}
      return { ...stored, custom: { light: custom.light ?? {}, dark: custom.dark ?? {} } }
    }
  } catch {}
  return defaultTheme
}

let current: ThemeChoice = typeof window === 'undefined' ? defaultTheme : read()
const listeners = new Set<() => void>()

/**
 * Writes the scoped stylesheet. The default theme needs none: previews then read the site's
 * own variables, which are the defaults.
 */
function apply(choice: ThemeChoice) {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID)
  if (sameTheme(choice, defaultTheme)) {
    style?.remove()
    return
  }
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.append(style)
  }
  style.textContent = scopedCss(choice)
}

// Runs when main.tsx imports this, before React renders anything. Only previews wear the theme
// and they only exist once React has rendered, so they never paint in the wrong one.
apply(current)

export function setThemeChoice(next: ThemeChoice | ((choice: ThemeChoice) => ThemeChoice)) {
  current = typeof next === 'function' ? next(current) : next
  apply(current)
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {}
  for (const l of listeners) l()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useThemeChoice() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => defaultTheme,
  )
}

// Whether the Customize drawer is open. The header and the themes page both open it.
let customizing = false
const drawerListeners = new Set<() => void>()

export function setCustomizerOpen(open: boolean) {
  customizing = open
  for (const l of drawerListeners) l()
}

export function useCustomizerOpen() {
  return useSyncExternalStore(
    (l) => {
      drawerListeners.add(l)
      return () => {
        drawerListeners.delete(l)
      }
    },
    () => customizing,
    () => false,
  )
}
