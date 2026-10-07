---
'@uiness/three': minor
---

Every viewer and stage on a page now draws with one shared WebGL renderer and copies its picture to its own canvas. Shaders and the studio lighting are prepared once per page, so the second viewer starts in a few milliseconds instead of the first one's hundred or more, and a page of viewers spends one WebGL context. A model's shaders compile with `compileAsync` before it shows, instead of freezing its first frame.

Breaking: `createStage` no longer takes `antialias`, `alpha` or `powerPreference`, since the renderer is the page's, not the stage's; settings made on `ctx.renderer` apply to every stage. New: the `staticShadows` option and `updateShadows()`, for scenes whose shadows only change when told.
