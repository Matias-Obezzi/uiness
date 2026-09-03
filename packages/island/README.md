# @uiness/island

A Dynamic Island for the web. A pill fixed to the top of the page that morphs with a spring to show statuses, live activities, alerts and confirms. React, zero dependencies, driven by an imperative API like a toast library.

```bash
pnpm add @uiness/island
```

## Usage

Mount `<Island />` once, then call the API from anywhere. The island floats over your page like a notch, so leave some room at the top of the layout (around 60px) for the idle pill.

```tsx
import { Island, island } from '@uiness/island'

function App() {
  return (
    <>
      <Island />
      <Page />
    </>
  )
}

// Compact status with slots on both sides
const upload = island.show({ leading: <Spinner />, trailing: '0%' })
upload.update({ trailing: '60%' })
upload.dismiss()

// Expanded panel with your own content
island.show({ content: <NowPlaying />, width: 340 })

// Built-ins
const ok = await island.confirm({ title: 'Delete photo?', destructive: true, confirmText: 'Delete' })
await island.alert({ title: 'AirPods connected', icon: <Headphones /> })
island.promise(save(), { loading: 'Saving', success: 'Saved', error: 'Could not save' })
```

Inside components you can use the hook, which also respects `<IslandProvider>`:

```tsx
const island = useIsland()
```

### Entries and the stack

`island.show(options)` pushes an entry and returns a handle with `update` and `dismiss`. Entries stack: a confirm pushed on top of a live activity gives the activity back when it closes. Reusing an `id` updates that entry in place instead of stacking.

| Option | Description |
| --- | --- |
| `mode` | `'compact'` keeps the pill height with `leading`, `content` and `trailing` in a row. `'expanded'` grows into a panel. Inferred when omitted. |
| `leading`, `trailing` | Compact slots, left and right. |
| `content` | Center content in compact mode, the whole panel in expanded mode. |
| `duration` | Auto dismiss in ms. Timers pause while hovering. |
| `dismissible` | Escape and outside click. Default `true` for expanded, `false` for compact. |
| `role` | `status`, `alert`, `dialog` or `alertdialog`. Dialogs receive focus and give it back. |
| `width` | Width of the expanded panel. |
| `onDismiss` | Called when the entry leaves, whatever the reason. |

### `<Island />` props

| Prop | Default | Description |
| --- | --- | --- |
| `position` | `'top'` | `'top'` or `'bottom'`, safe area aware. |
| `offset` | `12` | Distance from the edge in px, added to the safe area inset. |
| `anchor` | `'safe-area'` | `'edge'` ignores the safe area inset. Used with `hardwareIsland` in installed apps. |
| `idle` | empty pill | Content while nothing is shown. `false` hides the island when idle. |
| `idleWidth`, `idleHeight` | `120`, `36` | Size of the idle pill and of compact entries. |
| `expandedRadius` | `28` | Corner radius of expanded entries. |
| `spring` | `{ stiffness: 380, damping: 28 }` | `'smooth'`, `'bouncy'`, `'stiff'` or a config object. |
| `pauseOnHover` | `true` | Pause auto dismiss timers while hovered. |
| `store` | shared | A store from `createIsland()` for isolated islands. |

### Theming

The box takes CSS variables, so pass them through `style` or set them on an ancestor:

```css
--island-bg: #000;
--island-color: #fff;
--island-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
--island-accent: #0a84ff;   /* confirm button */
--island-danger: #ff453a;   /* destructive confirm button */
--island-muted: rgba(255, 255, 255, 0.14); /* cancel button, icon background */
--island-padding: 16px;
--island-max-width: min(420px, calc(100vw - 24px));
--island-font: system-ui, sans-serif;
```

`data-mode` (`idle`, `compact`, `expanded`) and `data-entry` are exposed on the box for CSS.

### How the animation works

The island measures its content, then animates width, height and radius from the previous size with the Web Animations API. The easing is a real damped spring sampled into a CSS `linear()` function, so it overshoots like the iOS one and can be interrupted mid-flight. Browsers without `linear()` fall back to an ease-out curve. `prefers-reduced-motion` disables the morph and the blur cross fades.

Give expanded content a stable width (the `width` option or a fixed width inside) so it does not reflow while the box is animating, and add `max-width: 100%` so it still fits on narrow screens. The panel is capped at `100vw - 24px` with 16px of padding, so about 319px remain for content on a 375px phone.

### Wrapping the real Dynamic Island

In a browser tab the island can never sit where the hardware one is: the browser toolbar and the status bar live above the page, and no web content can draw there. It becomes possible when the site runs as an installed app, where the page extends under the status bar.

1. Add the tags that let the page cover the status bar:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

2. Turn on `hardware` mode when running standalone:

```tsx
import { Island, useStandalone } from '@uiness/island'

const standalone = useStandalone()
<Island hardware={standalone} />
```

Devices differ by a few points and a web page cannot read the cutout geometry, so hardware mode never tries to match the cutout exactly. Instead:

- The idle state is the cutout itself. Nothing is drawn until an entry shows up, then the box grows out of the cutout and shrinks back into it.
- The box is always a little larger than the cutout (5px margin by default) and pure black, so the cutout disappears inside it.
- Compact slots sit on both sides of the cutout, with both sides the same width so the cutout stays centered. Center `content` moves next to the trailing slot. Each side gets about 80px on a 375px phone, so keep compact labels short and use expanded alerts for sentences; text that does not fit gets an ellipsis.
- Expanded content stacks below the cutout band instead of beside it, and the band also clears `env(safe-area-inset-top)`: iOS blurs whatever an installed app draws under the status bar, so text placed there would look smudged. Compact slots live beside the cutout by design and do get that blur, which the app cannot disable, so keep them to icons and short numbers.
- No shadow, which would read as a smudge on the status bar.

Prefer a shape that reads as part of the system? `hardware={{ mode: 'stack' }}` makes the box two rows: the top row is the island line, kept empty and black even when there is nothing to show there, and every entry lives on the row below. Both rows grow horizontally together as one shape, compact entries lay out like a plain pill on the second row, and nothing sits under the status bar blur.

Pass an object to change the geometry: `hardware={{ width: 126, height: 37, top: 11, margin: 5 }}` are the defaults, matching the iPhone 14 Pro to 16 family in points. Keep your app's content below `env(safe-area-inset-top)` as usual.

### Multiple islands

```tsx
const notifications = createIsland()

<Island store={notifications} position="bottom" />
notifications.show({ content: 'Hello from the bottom' })
```

## License

MIT
