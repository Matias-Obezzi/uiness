// What a page sends to /api/track, checked before it gets anywhere near the database: anyone
// can post here, so only known kinds and plain paths are kept.

export const EVENT_TYPES = ['view', 'install', 'code']

/** @typedef {{ type: string, path: string }} TrackEvent */

/** The event in a beacon's body, or null for anything else. */
export function parseEvent(/** @type {string} */ body) {
  try {
    const { type, path } = JSON.parse(body)
    if (EVENT_TYPES.includes(type) && typeof path === 'string' && /^\/[\w\-./]{0,199}$/.test(path))
      return /** @type {TrackEvent} */ ({ type, path })
  } catch {}
  return null
}
