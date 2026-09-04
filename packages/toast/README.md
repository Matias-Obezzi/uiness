# @uiness/toast

Toasts and notifications for React. Stacked with the newest in front, expand on hover, swipe to dismiss, promise tracking, actions, six positions. Zero dependencies.

```bash
pnpm add @uiness/toast
```

## Usage

```tsx
import { Toaster, toast } from '@uiness/toast'

function App() {
  return (
    <>
      <Toaster />
      <Page />
    </>
  )
}

toast('Event created')
toast.success('Saved', { description: 'All changes are in.' })
toast.error('Could not save')
toast('Deleted', { action: { label: 'Undo', onClick: restore } })
toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Could not save' })
```

### `toast()` options

| Option | Description |
| --- | --- |
| `id` | Reuse to update a toast in place. |
| `title`, `description` | Content. |
| `type` | `default`, `success`, `error`, `info`, `warning`, `loading`. |
| `icon` | Replace the type icon, `null` hides it. |
| `duration` | Auto dismiss in ms, `Infinity` to keep. Loading toasts default to `Infinity`. |
| `action`, `cancel` | `{ label, onClick }` buttons. Actions close the toast unless `event.preventDefault()` is called. |
| `dismissible` | Swipe and close button. Default true. |
| `closeButton`, `position`, `important` | Per toast overrides. |
| `render` | Replace the card with your own markup, see `toast.custom`. |
| `onDismiss`, `onAutoClose` | Callbacks. |

`toast.dismiss(id)` closes one, `toast.dismiss()` closes all.

### `<Toaster />` props

| Prop | Default | Description |
| --- | --- | --- |
| `position` | `'bottom-right'` | Any corner or center of the top and bottom edges. |
| `expand` | `false` | Keep the stack expanded instead of collapsing until hovered. |
| `visibleToasts` | `3` | Toasts visible in the collapsed stack. |
| `richColors` | `false` | Colored backgrounds per type. |
| `closeButton` | `false` | Close button on every toast. |
| `duration` | `4000` | Default auto dismiss delay. |
| `gap`, `offset` | `14`, `24` | Spacing in px. |
| `icons` | | Custom icons per type. |
| `toastClassName`, `toastStyle` | | Applied to every card. |
| `store` | shared | A store from `createToastStore()` for isolated toasters. |

### Theming

```css
--toast-bg, --toast-color, --toast-border, --toast-shadow, --toast-radius, --toast-font,
--toast-width, --toast-action-bg, --toast-action-color,
--toast-success-bg / -color / -border, same for error, info and warning (with richColors)
```

Data attributes for CSS: `data-uiness-toaster`, `data-position`, `data-expanded` on the region; `data-toast`, `data-type`, `data-index`, `data-front`, `data-removing` on each card.

### Accessibility

The region is labelled "Notifications". Each toast is a polite live region, or assertive with `important`. Timers pause while hovering and while the page is hidden.

## License

MIT
