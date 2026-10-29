'use client'

import * as React from 'react'

export interface UseAutoResizeTextareaOptions {
  /** The height it never shrinks below, in pixels. */
  minHeight: number
  /** The height it stops growing at and scrolls instead. Default no limit. */
  maxHeight?: number
}

/**
 * Grows a textarea with its text, between `minHeight` and `maxHeight`. Call `adjustHeight` on
 * change, and `adjustHeight(true)` after clearing it to drop back to the minimum. Where only
 * Chromium matters, CSS `field-sizing: content` does the same without script.
 */
export function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaOptions) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(
    (reset?: boolean) => {
      const el = textareaRef.current
      if (!el) return
      // Shrink first, so scrollHeight measures the text and not the old height.
      el.style.height = `${minHeight}px`
      if (reset) return
      el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight ?? Infinity))}px`
    },
    [minHeight, maxHeight],
  )

  React.useEffect(() => {
    adjustHeight()
    // The text rewraps when the width changes.
    const onResize = () => adjustHeight()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}
