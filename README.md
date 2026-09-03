# uiness

UI primitives for React, published under the `@uiness` scope.

| Package | Description |
| --- | --- |
| [`@uiness/image`](packages/image) | `<img>` with loading transitions: blur, pixelate, fade, reveal, real download progress. |
| [`@uiness/island`](packages/island) | Dynamic Island for the web: morphing pill for statuses, live activities, alerts and confirms. |
| `@uiness/ui` | Radix based components distributed through a shadcn registry. Planned. |

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
