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
pnpm --filter docs dev                # documentation site on http://localhost:5174
pnpm test
pnpm build
pnpm lint
```

Releases use [Changesets](https://github.com/changesets/changesets): run `pnpm changeset` with your change, merge, and the release workflow opens a version PR and publishes to npm when it lands.

## Publishing

**Packages to npm.** Releases go through Changesets and the `Release` workflow:

1. Log in once (`npm login`) and create the `uiness` organization on npmjs.com so the `@uiness` scope is yours.
2. Create an npm granular access token with publish rights and add it to the GitHub repository as the `NPM_TOKEN` secret.
3. Every change that should ship gets a changeset (`pnpm changeset`). On push to `main`, the workflow opens a "Version Packages" pull request; merging it publishes the bumped packages with provenance.

To publish by hand instead: `pnpm version` then `pnpm release`.

**Docs to GitHub Pages.** The `Docs` workflow builds `apps/docs` and deploys it. In the repository settings, under Pages, set the source to GitHub Actions. The site lands on `https://<user>.github.io/<repo>/`, and the registry with it at `/r/<name>.json`, which is the URL the install pages show. If the GitHub handle or repo name differ from `Matias-Obezzi/uiness`, update `apps/docs/src/lib/site.ts`, `packages/ui/registry.json` and the `repository` fields of the packages.
