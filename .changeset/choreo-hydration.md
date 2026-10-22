---
'@uiness/choreo': patch
---

No more hydration mismatches in Next.js (React 19) with streamed pages. Choreo wrote `data-choreo-role` and `data-choreo-hover` onto server rendered HTML before React hydrated it, so React warned about attributes it did not render. Now it writes nothing on the elements it animates: the role is kept in memory and written only with `debug`, for its outlines, and hover and press are Web Animations added on top, driven by pointer events, with no attribute and no stylesheet. Inside a React tree, an element React has not hydrated yet keeps its text as the server wrote it: it fades in whole instead of word by word, and its numbers do not count. Entrances on streamed content play as before.
