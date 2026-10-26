import { crossDocument, type Effect } from './core'

/**
 * The drop-in build for sites of separate pages: `<script src=".../auto.iife.js"></script>`
 * in the `<head>` of every page. Options come from `data-*` attributes on the script tag:
 * `data-page="slide"`, `data-back="fade"`, `data-duration="400"` and `data-easing`.
 */
function start() {
  const script = document.currentScript ?? document.querySelector('script[data-transitions-auto]')
  const data = (script as HTMLElement | null)?.dataset ?? {}
  crossDocument({
    page: data.page as Effect | undefined,
    back: data.back as Effect | 'reverse' | undefined,
    duration: data.duration === undefined ? undefined : Number(data.duration),
    easing: data.easing,
  })
}

if (typeof document !== 'undefined') start()
