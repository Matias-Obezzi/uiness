import { CodeComparison } from '@/components/ui/code-comparison'

const beforeCode = `function calculateTotal(items: CartItem[]): number {
  let total = 0
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity
  }
  return total
}`

const afterCode = `function calculateTotal(items: CartItem[]): number {
  return items.reduce(
    (total, { price, quantity }) => total + price * quantity,
    0,
  )
}`

export default function CodeComparisonDemo() {
  return (
    <div className="w-full max-w-2xl p-4">
      <CodeComparison
        before={beforeCode}
        after={afterCode}
        beforeLabel="imperative.ts"
        afterLabel="functional.ts"
        language="typescript"
        focus
      />
    </div>
  )
}
