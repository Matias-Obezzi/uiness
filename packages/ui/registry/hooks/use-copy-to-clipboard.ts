'use client'

import * as React from 'react'

/**
 * Write text to the clipboard. Falls back to a hidden textarea and `execCommand` where the
 * Clipboard API is missing, which is the case on plain http pages, and where it refuses the
 * text, which it does when the document is not focused or the permission was denied. When the
 * fallback fails as well, the Clipboard API's own error is the one thrown.
 */
export async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      try {
        copyWithTextarea(text)
        return
      } catch {
        throw error
      }
    }
  }
  copyWithTextarea(text)
}

/** Copy through a hidden textarea and `execCommand`, the way it was done before the Clipboard API. */
function copyWithTextarea(text: string) {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  const focused = document.activeElement as HTMLElement | null
  area.select()
  try {
    if (!document.execCommand?.('copy')) throw new Error('Copy command was refused')
  } finally {
    area.remove()
    focused?.focus()
  }
}

/**
 * Copies text and says so for a moment: `copied` turns true for `timeout` milliseconds after a
 * copy that worked. `copy` resolves to whether it did.
 */
export function useCopyToClipboard({ timeout = 2000 }: { timeout?: number } = {}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = React.useCallback(
    async (text: string) => {
      window.clearTimeout(timer.current)
      try {
        await copyToClipboard(text)
      } catch {
        setCopied(false)
        return false
      }
      setCopied(true)
      timer.current = window.setTimeout(() => setCopied(false), timeout)
      return true
    },
    [timeout],
  )

  return { copied, copy }
}
