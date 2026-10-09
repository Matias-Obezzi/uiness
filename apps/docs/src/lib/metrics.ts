export type MetricType =
  | 'view'
  | 'install'
  | 'code'
  | 'search'
  | 'search-empty'
  | 'copy-page'
  | 'markdown'
  | 'theme'
  | 'theme-css'
  | 'not-found'

/**
 * Counts something a reader did: a page view, a copy, a search. A beacon: the browser sends it
 * in the background, even while the page is being left, and nothing on the page waits for it.
 * `value` says what: the words searched, the preset picked.
 */
export function track(type: MetricType, { path, value }: { path?: string; value?: string } = {}) {
  if (!import.meta.env.PROD) return
  navigator.sendBeacon?.(
    '/api/track',
    JSON.stringify({ type, path: path ?? location.pathname, value }),
  )
}
