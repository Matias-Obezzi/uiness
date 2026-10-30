# @uiness/transitions

## 0.1.0

### Minor Changes

- e06325f: Initial release: view transitions declared per element. `<Transition>` (or `mark`, or `data-transition-*` attributes) makes an element morph into the one with the same `name` on the other side, `persist` out of the page's animation, `enter` and `exit` with `fade`, `fade-up`, `fade-down`, `slide`, `slide-up`, `scale`, `blur` or `none`, or `stagger` its children. `<Transitions page back>` sets how pages change and plays slides the other way going back, from the Navigation API or React Router's history index. `useViewTransition` animates any state change, `useNavigationTransition` and `useLinkTransition` any router that can push (Next.js App Router included) by waiting for `routeKey` to change, and React Router's own `viewTransition` links pick up the same rules. `crossDocument`, or the `auto.iife.js` script tag, does the same between separate pages. Without view transitions or with reduced motion, updates just happen.
