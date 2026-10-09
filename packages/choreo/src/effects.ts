import type { Effect } from './types'

export interface Frames {
  /** Opacity, filter and clip: replace whatever the element has, ending on its own values. */
  own: Keyframe[]
  /** Transforms: added on top of the element's own transform, so nothing it has is lost. */
  added: Keyframe[] | null
}

/**
 * Keyframes for an effect. Movement is added to the element's transform rather than replacing
 * it, so a centered `translate(-50%)` or a rotation survives the entrance untouched.
 */
export function framesFor(
  effect: Effect,
  { distance, opacity, fadeOnly }: { distance: number; opacity: number; fadeOnly: boolean },
): Frames {
  const fade: Keyframe[] = [{ opacity: 0 }, { opacity }]
  if (fadeOnly || effect === 'fade') return { own: fade, added: null }
  const d = `${distance}px`
  switch (effect) {
    case 'up':
      return { own: fade, added: [{ transform: `translateY(${d})` }, { transform: 'none' }] }
    case 'down':
      return { own: fade, added: [{ transform: `translateY(-${d})` }, { transform: 'none' }] }
    case 'left':
      return { own: fade, added: [{ transform: `translateX(${d})` }, { transform: 'none' }] }
    case 'right':
      return { own: fade, added: [{ transform: `translateX(-${d})` }, { transform: 'none' }] }
    case 'scale':
      return { own: fade, added: [{ transform: 'scale(0.94)' }, { transform: 'none' }] }
    case 'zoom':
      return {
        own: fade,
        added: [{ transform: `translateY(${distance / 2}px) scale(1.06)` }, { transform: 'none' }],
      }
    case 'blur':
      return {
        own: [
          { opacity: 0, filter: 'blur(10px)' },
          { opacity, filter: 'blur(0px)' },
        ],
        added: [{ transform: `translateY(${distance / 2}px)` }, { transform: 'none' }],
      }
    case 'clip':
      return {
        own: [
          { opacity, clipPath: 'inset(0 0 100% 0)' },
          { opacity, clipPath: 'inset(0 0 0% 0)' },
        ],
        added: [{ transform: `translateY(${distance}px)` }, { transform: 'none' }],
      }
    case 'rotate':
      return {
        own: fade,
        added: [{ transform: `translateY(${d}) rotate(-4deg)` }, { transform: 'none' }],
      }
    case 'flip':
      return {
        own: [
          { opacity: 0, transformOrigin: 'center top' },
          { opacity, transformOrigin: 'center top' },
        ],
        added: [{ transform: 'perspective(800px) rotateX(-60deg)' }, { transform: 'none' }],
      }
    case 'words':
      // Each word gets this; the element itself stays put.
      return {
        own: [
          { opacity: 0, filter: 'blur(6px)' },
          { opacity: 1, filter: 'blur(0px)' },
        ],
        added: [{ transform: 'translateY(0.35em)' }, { transform: 'none' }],
      }
    case 'draw':
      return {
        own: [
          { opacity: 0, transformOrigin: 'left center' },
          { opacity, transformOrigin: 'left center' },
        ],
        added: [{ transform: 'scaleX(0)' }, { transform: 'none' }],
      }
    default:
      return { own: [], added: null }
  }
}
