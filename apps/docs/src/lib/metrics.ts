export type MetricType = 'view' | 'install' | 'code'

/**
 * Counts a page view or a copy. A beacon: the browser sends it in the background, even while
 * the page is being left, and nothing on the page waits for it or hears back.
 */
export function track(type: MetricType, path = location.pathname) {
  if (!import.meta.env.PROD) return
  navigator.sendBeacon?.('/api/track', JSON.stringify({ type, path }))
}
