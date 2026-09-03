# uiness

UI primitives for React, published under the `@uiness` scope.

| Package | Description |
| --- | --- |
| [`@uiness/image`](packages/image) | `<img>` with loading transitions: blur, pixelate, fade, reveal, real download progress. |
| [`@uiness/island`](packages/island) | Dynamic Island for the web: morphing pill for statuses, live activities, alerts and confirms. |
| [`@uiness/fx`](packages/fx) | Canvas image effects: pixelate, dither, palettes, glitch, CRT, ASCII, composable and animatable. |
| [`@uiness/ui`](packages/ui) | Radix + Tailwind components distributed through a shadcn registry, includes island, image and fx items. |

## Development

```bash
pnpm install
pnpm --filter playground gen:images   # once, generates the sample images
pnpm --filter playground dev          # visual playground on http://localhost:5173
pnpm test
pnpm build
pnpm lint
```

Releases use [Changesets](https://github.com/changesets/changesets): run `pnpm changeset` with your change, merge, and the release workflow opens a version PR and publishes to npm when it lands.
