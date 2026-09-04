export const site = {
  name: 'uiness',
  description: 'React UI primitives with a bit of magic.',
  /** Replace with your GitHub handle and repo if they differ. */
  github: 'https://github.com/matiasobezzi/uiness',
  registryNamespace: '@uiness',
}

/**
 * Where this deployment serves the registry. Computed at runtime so it is right on
 * localhost, on GitHub Pages under a subpath, or on a custom domain.
 */
export function registryUrl(name = '{name}'): string {
  const origin = typeof location !== 'undefined' ? location.origin : 'https://example.com'
  return `${origin}${import.meta.env.BASE_URL}r/${name}.json`
}

export const installCommand = (name: string) =>
  `npx shadcn@latest add ${site.registryNamespace}/${name}`
