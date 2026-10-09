declare module '*.mdx' {
  import type { ComponentType } from 'react'

  const Component: ComponentType<Record<string, unknown>>
  export default Component
}

declare module 'virtual:page-meta' {
  const meta: Record<string, import('../../scripts/page-meta').PageMeta>
  export default meta
}
