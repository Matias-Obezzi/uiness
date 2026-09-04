export const site = {
  name: 'uiness',
  description: 'React UI primitives with a bit of magic.',
  github: 'https://github.com/matiasobezzi/uiness',
  /** Public registry URL pattern, used in install commands and components.json snippets. */
  registry: 'https://uiness.dev/r/{name}.json',
  registryNamespace: '@uiness',
}

export const installCommand = (name: string) =>
  `npx shadcn@latest add ${site.registryNamespace}/${name}`
