import { CodeBlock } from '@/ui/code-block'

const config = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "registries": {
    "@uiness": "https://uiness.vercel.app/r/{name}.json"
  },
  "aliases": { "components": "@/components", "ui": "@/components/ui" }
}`

export default function CodeBlockPlain() {
  return <CodeBlock code={config} highlight={[4, 5, 6]} className="w-full" />
}
