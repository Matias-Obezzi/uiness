<div align="center">

<img src="https://raw.githubusercontent.com/Matias-Obezzi/uiness/main/assets/logo.png" alt="" width="72" height="72" />

</div>

# @uiness/transitions

View transitions between pages and between states, declared per element. Say what each thing does when the page changes: a cover grows into the page it opens, the header stays put, a list cascades in, and the page slides back the way it came. React Router, the Next.js App Router, sites of separate pages or any state change, on the browser's own View Transitions API. Zero dependencies, ESM and CommonJS, typed, and the core works without React.

[Documentation](https://uiness.vercel.app/docs/transitions) · [GitHub](https://github.com/Matias-Obezzi/uiness)

```bash
pnpm add @uiness/transitions
```

## React

```tsx
import { Transition, Transitions, useViewTransition } from '@uiness/transitions'

<Transitions page="slide" back="reverse">
  <Transition persist>
    <header>…</header>
  </Transition>

  <Transition name={`cover-${album.id}`}>
    <img src={album.cover} alt="" />
  </Transition>

  <Transition stagger enter="fade-up">
    <ol>…</ol>
  </Transition>
</Transitions>

const start = useViewTransition()
start(() => setOpen(album.id))
```

- `name`: the same name on both sides morphs from one place and size to the other.
- `persist`: stays still and on top while the rest changes.
- `enter`, `exit`: `fade`, `fade-up`, `fade-down`, `slide`, `slide-up`, `scale`, `blur` or `none`, when the other side has nothing like it.
- `stagger`: each child in turn, 40ms apart or the milliseconds given.
- `duration`, `easing`, `delay`.

`Transitions` sets the page effect, and `back="reverse"` plays slides the other way going back, worked out from the Navigation API or React Router's history index.

## Routers

- **React Router**: its `viewTransition` links, in data and framework modes, pick up the same rules.
- **Next.js App Router**: `<Transitions routeKey={usePathname()}>` and `useLinkTransition((href) => router.push(href))` as a link's `onClick`.
- **Any router**: `useNavigationTransition()` returns `navigate(() => push(to))`, which waits for `routeKey` to change.

## Sites of separate pages

```html
<script src="https://unpkg.com/@uiness/transitions/dist/auto.iife.js" data-page="slide"></script>

<header data-transition-persist>…</header>
<img data-transition-name="cover-12" src="cover.jpg" alt="" />
```

## Without React

```ts
import { mark, transition } from '@uiness/transitions/core'

mark(document.querySelector('header'), { persist: true })
await transition(() => renderPage(next))
```

Without view transitions, or with `prefers-reduced-motion`, updates just happen.

## License

MIT
