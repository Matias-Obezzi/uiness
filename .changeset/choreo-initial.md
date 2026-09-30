---
"@uiness/choreo": minor
---

Initial release: `choreograph()` inspects the DOM, works out what each element is (heading, text, media, card, grid item, button, divider, number) and plays an entrance for each as it scrolls into view, cascading what arrives together. Numbers count up to their original text, cards lift and buttons press on hover, elements added later are picked up, and `stop()` leaves the page as it was. Comes with `<Choreo />` and `useChoreo()` for React, `scan()` to inspect without animating, and a script tag build that runs on its own.
