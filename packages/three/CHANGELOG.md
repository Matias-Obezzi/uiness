# @uiness/three

## 0.3.0

### Minor Changes

- f4a423b: The wheel scrolls the page past a viewer and zooms it only with Ctrl or ⌘ held, which is also what a trackpad pinch sends; `wheelZoom` sets `'modifier'` (default), `'always'` or `'never'`. Keyboard shortcuts are configurable through `shortcuts`, laid over the exported `defaultShortcuts`: remap an action, drop one with `null`, or turn them all off with `false`. Keys held with Ctrl, ⌘ or Alt are left to the browser.

### Patch Changes

- f550e5c: Fix a frame loop that doubled every frame while the camera moved: an auto-rotating viewer froze the whole computer within a second, and any viewer stuttered for a moment after a drag. Moving the camera in a frame fired the controls' change, which scheduled the next frame, and the loop scheduled another on top.

## 0.2.0

### Minor Changes

- db516cf: Every viewer and stage on a page now draws with one shared WebGL renderer and copies its picture to its own canvas. Shaders and the studio lighting are prepared once per page, so the second viewer starts in a few milliseconds instead of the first one's hundred or more, and a page of viewers spends one WebGL context. A model's shaders compile with `compileAsync` before it shows, instead of freezing its first frame.
  
  Breaking: `createStage` no longer takes `antialias`, `alpha` or `powerPreference`, since the renderer is the page's, not the stage's; settings made on `ctx.renderer` apply to every stage. New: the `staticShadows` option and `updateShadows()`, for scenes whose shadows only change when told.

## 0.1.0

### Minor Changes

- ce204c6: Initial release: headless 3D model viewer and stage for React, with orbit controls, lighting, contact shadow, render on demand, lazy loading, and core controller without React.

## 0.1.0

### Minor Changes

- Initial release: headless 3D model viewer and stage for React, with orbit controls, lighting, contact shadows, render on demand, lazy loading, and core controller without React.
