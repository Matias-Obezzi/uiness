import { SquareTerminalIcon } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control'
import {
  addCommand,
  type PackageManager,
  packageManagers,
  runCommand,
  usePackageManager,
} from '~/lib/package-manager'
import {
  itemHref,
  loadSource,
  localName,
  registryItem,
  targetPath,
  toProjectImports,
} from '~/lib/registry'
import { registryUrl, site } from '~/lib/site'
import { CodeBlock } from './code-block'

/** A command in every package manager's spelling. The choice is shared by every block on the site. */
export function PackageManagerCommand({
  command,
  className,
}: {
  command: (pm: PackageManager) => string
  className?: string
}) {
  const [pm, setPm] = usePackageManager()
  return (
    <CodeBlock
      code={command(pm)}
      lang="bash"
      className={className}
      toolbar={
        <div className="flex items-center gap-2">
          <SquareTerminalIcon aria-hidden className="size-4 text-muted-foreground" />
          <SegmentedControl
            aria-label="Package manager"
            size="sm"
            value={pm}
            onValueChange={(v) => setPm(v as PackageManager)}
            className="h-7"
          >
            {packageManagers.map((name) => (
              <SegmentedControlItem key={name} value={name} className="px-2 font-mono">
                {name}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
      }
    />
  )
}

/** `shadcn` run through the picked package manager. */
export function ShadcnCommand({ args }: { args: string }) {
  return (
    <div className="not-prose my-6">
      <PackageManagerCommand command={(pm) => runCommand(pm, `shadcn@latest ${args}`)} />
    </div>
  )
}

/** Install block for a registry item: the CLI command, or the files to copy by hand. */
export function Install({ name, extra }: { name: string; extra?: string }) {
  const [tab, setTab] = useState<'command' | 'manual'>('command')
  return (
    <div className="not-prose my-6">
      <div role="tablist" aria-label="How to install" className="flex items-center gap-1 border-b">
        {(['command', 'manual'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 font-medium text-sm capitalize transition-colors',
              tab === t
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-3 space-y-3">
        {tab === 'command' ? (
          <>
            <PackageManagerCommand
              command={(pm) =>
                runCommand(pm, `shadcn@latest add ${site.registryNamespace}/${name}`)
              }
            />
            {extra && <p className="text-muted-foreground text-sm">{extra}</p>}
          </>
        ) : (
          <ManualSteps name={name} />
        )}
      </div>
    </div>
  )
}

const noFiles: never[] = []

function ManualSteps({ name }: { name: string }) {
  const item = registryItem(name)
  const files = item?.files ?? noFiles
  const [sources, setSources] = useState<string[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(files.map(loadSource)).then(
      (loaded) => !cancelled && setSources(loaded),
      () => !cancelled && setFailed(true),
    )
    return () => {
      cancelled = true
    }
  }, [files])

  if (!item) return <p className="text-muted-foreground text-sm">Item not found.</p>

  if (files.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing to copy: this item only writes CSS variables into your global stylesheet. Take them
        from{' '}
        <a href={itemHref('theming')} className="text-foreground underline underline-offset-4">
          Theming
        </a>
        .
      </p>
    )
  }

  const dependencies = item.dependencies ?? []
  const registryDependencies = (item.registryDependencies ?? []).map(localName)
  let step = 0

  return (
    <ol className="space-y-6 text-sm">
      {dependencies.length > 0 && (
        <Step n={++step} title="Install the dependencies">
          <PackageManagerCommand command={(pm) => addCommand(pm, dependencies.join(' '))} />
        </Step>
      )}
      {registryDependencies.length > 0 && (
        <Step n={++step} title="Add the items it builds on">
          <p className="text-muted-foreground">
            Follow the manual steps for each of these first, or install them with the command:{' '}
            {registryDependencies.map((dep, i) => (
              <span key={dep}>
                {i > 0 && ', '}
                <a
                  href={itemHref(dep) ?? registryUrl(dep)}
                  className="font-mono text-foreground underline underline-offset-4"
                >
                  {dep}
                </a>
              </span>
            ))}
            .
          </p>
        </Step>
      )}
      <Step
        n={++step}
        title={
          files.length > 1
            ? 'Copy these files into your project'
            : 'Copy this file into your project'
        }
      >
        <div className="space-y-3">
          {files.map((file, i) => (
            <CodeBlock
              key={file.path}
              title={targetPath(file)}
              code={
                failed
                  ? `// Could not load ${file.path}. Open ${registryUrl(name)} instead.`
                  : sources
                    ? toProjectImports(sources[i] ?? '')
                    : '// Loading…'
              }
              lang={file.path.endsWith('.ts') ? 'ts' : 'tsx'}
            />
          ))}
        </div>
      </Step>
      <Step n={++step} title="Update the import paths to match your project setup" />
    </ol>
  )
}

function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <li className="space-y-3">
      <p className="flex items-center gap-2 font-medium text-foreground">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted font-mono text-xs">
          {n}
        </span>
        {title}
      </p>
      {children}
    </li>
  )
}

/** Install block for an npm package. */
export function InstallPackage({ name }: { name: string }) {
  return (
    <div className="not-prose my-6">
      <PackageManagerCommand command={(pm) => addCommand(pm, name)} />
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
