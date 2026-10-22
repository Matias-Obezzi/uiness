# @uiness/choreo

## 0.2.1

### Patch Changes

- 77f5fbe: No more hydration mismatches in Next.js (React 19) with streamed pages. Choreo wrote `data-choreo-role` and `data-choreo-hover` onto server rendered HTML before React hydrated it, so React warned about attributes it did not render. Now it writes nothing on the elements it animates: the role is kept in memory and written only with `debug`, for its outlines, and hover and press are Web Animations added on top, driven by pointer events, with no attribute and no stylesheet. Inside a React tree, an element React has not hydrated yet keeps its text as the server wrote it: it fades in whole instead of word by word, and its numbers do not count. Entrances on streamed content play as before.

## 0.2.0

### Minor Changes

- 58c96d0: Word by word entrances (`words`), two new effects (`rotate`, `flip`), scroll-linked entrances (`scrub`), an exit (`leave()`) and an `onEnter` callback. Entrances now end when their last animation does, and the drop-in script reads `data-max-stagger`, `data-offset`, `data-observe`, `data-scrub` and `data-reduced-motion` too.

## 0.1.1

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.0

### Minor Changes

- 88c63ca: Initial release: `choreograph()` inspects the DOM, works out what each element is (heading, text, media, card, grid item, button, divider, number) and plays an entrance for each as it scrolls into view, cascading what arrives together. Numbers count up to their original text, cards lift and buttons press on hover, elements added later are picked up, and `stop()` leaves the page as it was. Comes with `<Choreo />` and `useChoreo()` for React, `scan()` to inspect without animating, and a script tag build that runs on its own.
