import { installCommand, registryUrl, site } from '~/lib/site'
import { CodeBlock } from './code-block'

/** Install block for a registry item. */
export function Install({ name, extra }: { name: string; extra?: string }) {
  return (
    <div className="not-prose my-6 space-y-3">
      <CodeBlock code={installCommand(name)} lang="bash" />
      {extra && <p className="text-muted-foreground text-sm">{extra}</p>}
    </div>
  )
}

/** Install block for an npm package. */
export function InstallPackage({ name }: { name: string }) {
  return (
    <div className="not-prose my-6">
      <CodeBlock code={`pnpm add ${name}`} lang="bash" />
    </div>
  )
}

/** The components.json snippet, pointing at wherever this site is served from. */
export function RegistryConfig() {
  const json = JSON.stringify({ registries: { [site.registryNamespace]: registryUrl() } }, null, 2)
  return (
    <div className="not-prose my-6">
      <CodeBlock code={json} lang="json" title="components.json" />
    </div>
  )
}

/** Inline link to one registry item's JSON. */
export function RegistryLink({ name }: { name: string }) {
  const url = registryUrl(name)
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <code>{url}</code>
    </a>
  )
}
