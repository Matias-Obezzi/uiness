<div align="center">

<img src="assets/logo.png" alt="" width="88" height="88" />

# uiness

*React UI primitives with a bit of magic.*

[Documentation](https://uiness.vercel.app) · [Components](https://uiness.vercel.app/docs/components/button) · [Issues](https://github.com/Matias-Obezzi/uiness/issues)

</div>

UI primitives for React, published under the `@uiness` scope.

| Package | Description |
| --- | --- |
| [`@uiness/image`](packages/image) | `<img>` with loading transitions: blur, pixelate, fade, reveal, real download progress. |
| [`@uiness/island`](packages/island) | Dynamic Island for the web: morphing pill for statuses, live activities, alerts and confirms. |
| [`@uiness/fx`](packages/fx) | Canvas image effects: pixelate, dither, palettes, glitch, CRT, ASCII, composable and animatable. |
| [`@uiness/toast`](packages/toast) | Toasts and notifications: `toast()` function, stacked `<Toaster />`, promises, actions, swipe to dismiss. |
| [`@uiness/scroll`](packages/scroll) | Scroll-linked motion: progress through the viewport, parallax, active section. Zero dependencies. |
| [`@uiness/dnd`](packages/dnd) | Drag and drop primitives: sortable lists, cards across columns, grids in two directions, free dragging. Pointer or keyboard, zero dependencies. |
| [`@uiness/choreo`](packages/choreo) | Animates a whole site from what is already on the page: inspects the DOM, gives every element an entrance, cascades, counters and hover touches. |
| [`@uiness/ui`](packages/ui) | Radix + Tailwind components distributed through a shadcn registry, includes island, image, fx and toast items, plus motion pieces: spotlights, marquees, typewriters, tilting cards. |

## Development

```bash
pnpm install
pnpm --filter docs dev   # docs and live demos on http://localhost:5174
pnpm test
pnpm build
pnpm lint
```

Every package and every registry component has a live demo in the docs site, under `apps/docs`. That is where you try a change: `src/demos` holds one file per demo and `src/content` the pages that show them.

Releases use [Changesets](https://github.com/changesets/changesets): run `pnpm changeset` with your change, merge, and the release workflow opens a version PR and publishes to npm when it lands.

## Publishing

**Packages to npm.** Releases go through Changesets and the `Release` workflow:

1. Log in once (`npm login`) and create the `uiness` organization on npmjs.com so the `@uiness` scope is yours.
2. Create an npm granular access token with publish rights and add it to the GitHub repository as the `NPM_TOKEN` secret.
3. Every change that should ship gets a changeset (`pnpm changeset`). On push to `main`, the workflow opens a "Version Packages" pull request; merging it publishes the bumped packages with provenance.

To publish by hand instead: `pnpm changeset:version` then `pnpm changeset:publish`.

**Docs on Vercel.** The site and the registry live at `https://uiness.vercel.app`, with the registry at `/r/<name>.json`, which is the URL the install pages show. The Vercel project uses `apps/docs` as its root directory: Vercel installs the workspace and runs the docs' own `build` script, which builds the registry too, and `apps/docs/vercel.json` adds the rewrite that sends every route to the single page app (registry JSON is left out of it, so a missing item is a real 404) and the registry headers. Each pull request gets a preview deployment.

**GitHub Pages, for old links and installs.** The `Docs` workflow no longer publishes the docs to `https://matias-obezzi.github.io/uiness/`. It publishes a small site built by `pnpm --filter docs pages:redirect`: the registry JSON, so projects whose `components.json` points at the old registry keep installing, and a page that sends every other path to the same page on uiness.vercel.app. Once nobody uses the old registry URL, delete `.github/workflows/pages.yml` and turn Pages off.

If the GitHub handle or repo name differ from `Matias-Obezzi/uiness`, update `apps/docs/src/lib/site.ts`, `packages/ui/registry.json` and the `repository` fields of the packages.
