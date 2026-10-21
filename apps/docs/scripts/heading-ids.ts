// Gives every heading of an MDX page an id, unique within the page: the second "Price" becomes
// `price-1`, as on GitHub. Without it two headings with the same text share an id, so their
// anchor links both go to the first and the page's table of contents repeats a key.

interface Node {
  type: string
  value?: string
  depth?: number
  children?: Node[]
  data?: { hProperties?: Record<string, unknown> }
}

/** The same slug the heading component falls back to. */
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const textOf = (node: Node): string => node.value ?? (node.children ?? []).map(textOf).join('')

export function headingIds() {
  return (tree: Node) => {
    const seen = new Map<string, number>()
    const visit = (node: Node) => {
      if (node.type === 'heading') {
        const base = slug(textOf(node))
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        node.data ??= {}
        node.data.hProperties = { ...node.data.hProperties, id: count ? `${base}-${count}` : base }
      }
      for (const child of node.children ?? []) visit(child)
    }
    visit(tree)
  }
}
