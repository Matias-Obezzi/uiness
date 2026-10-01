import registry from '../../../../packages/ui/registry.json'
import { pageHref, pages } from './nav'

interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryItem {
  name: string
  type: string
  title?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
}

const items = new Map((registry.items as RegistryItem[]).map((item) => [item.name, item]))

export const registryItem = (name: string) => items.get(name)

// Loaded only when someone opens the manual steps, so the sources stay out of the page bundle.
// The tests sit next to the components and must never be pulled in (see block-preview.tsx).
const sources = import.meta.glob(
  [
    '../../../../packages/ui/registry/**/*.{ts,tsx}',
    '!../../../../packages/ui/registry/**/*.test.{ts,tsx}',
  ],
  { query: '?raw', import: 'default' },
) as Record<string, () => Promise<string>>

export function loadSource(file: RegistryFile): Promise<string> {
  const load = sources[`../../../../packages/ui/${file.path}`]
  return load ? load() : Promise.reject(new Error(`No source for ${file.path}`))
}

const folders: Record<string, string> = {
  'registry:ui': 'components/ui',
  'registry:block': 'components',
  'registry:hook': 'hooks',
  'registry:lib': 'lib',
}

/** Where the CLI would write the file in a project. */
export function targetPath(file: RegistryFile) {
  if (file.target) return file.target
  const base = file.path.split('/').pop() ?? file.path
  return `${folders[file.type] ?? 'components'}/${base}`
}

/** Turn the registry import paths into the ones a project gets after installing. */
export const toProjectImports = (source: string) =>
  source.replace(/from '@\/ui\//g, "from '@/components/ui/")

/** The docs page of a registry item, when it has one. */
export function itemHref(name: string) {
  const page = pages.find((p) => p.slug === name || p.slug.endsWith(`/${name}`))
  return page ? pageHref(page) : undefined
}

/** `@uiness/button` → `button`. */
export const localName = (dependency: string) => dependency.replace(/^@uiness\//, '')
