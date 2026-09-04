import { installCommand } from '~/lib/site'
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
