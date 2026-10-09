// What a page sends to /api/track, checked before it gets anywhere near the database: anyone
// can post here, so only known kinds, plain paths and a short plain value are kept.

export const EVENT_TYPES = [
  'view',
  'install',
  'code',
  'search',
  'search-empty',
  'copy-page',
  'markdown',
  'theme',
  'theme-css',
  'not-found',
]

/** The event in a beacon's body, or null for anything else. */
export function parseEvent(/** @type {string} */ body) {
  try {
    const { type, path, value } = JSON.parse(body)
    if (!EVENT_TYPES.includes(type)) return null
    if (typeof path !== 'string' || !/^\/[\w\-./]{0,199}$/.test(path)) return null
    /** @type {import('./events.js').UsageEvent} */
    const event = { type, path }
    if (value !== undefined) {
      // A search or a preset name: one line of text, no control characters, kept short.
      const control = (/** @type {string} */ c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127
      if (typeof value !== 'string' || Array.from(value).some(control)) return null
      const trimmed = value.trim().slice(0, 100)
      if (trimmed) event.value = trimmed
    }
    return event
  } catch {}
  return null
}
