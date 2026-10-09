# @uiness/choreo

## 0.2.0

### Minor Changes

- 58c96d0: Word by word entrances (`words`), two new effects (`rotate`, `flip`), scroll-linked entrances (`scrub`), an exit (`leave()`) and an `onEnter` callback. Entrances now end when their last animation does, and the drop-in script reads `data-max-stagger`, `data-offset`, `data-observe`, `data-scrub` and `data-reduced-motion` too.

## 0.1.1

### Patch Changes

- 551698b: The documentation moved to uiness.vercel.app: the package homepage points there, and the README links to the docs and the registry and shows how to add the registry items built on this package with the shadcn CLI.

## 0.1.0

### Minor Changes

- 88c63ca: Initial release: `choreograph()` inspects the DOM, works out what each element is (heading, text, media, card, grid item, button, divider, number) and plays an entrance for each as it scrolls into view, cascading what arrives together. Numbers count up to their original text, cards lift and buttons press on hover, elements added later are picked up, and `stop()` leaves the page as it was. Comes with `<Choreo />` and `useChoreo()` for React, `scan()` to inspect without animating, and a script tag build that runs on its own.
