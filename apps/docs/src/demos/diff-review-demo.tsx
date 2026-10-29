import { useEffect, useState } from 'react'
import { DiffReview, type FileEdit } from '@/components/ui/diff-review'

const before = `export function total(items) {
  let sum = 0
  for (const item of items) sum += item.price
  return sum
}`
const after = `export function total(items: Item[], tax = 0) {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0)
  return Math.round(sum * (1 + tax) * 100) / 100
}`
const config = `export default {
  currency: 'USD',
}`
const configAfter = `export default {
  currency: 'USD',
  tax: 0.21,
}`

export default function DiffReviewDemo() {
  // The second file streams in line by line, as an agent writes it.
  const [lines, setLines] = useState(0)
  const total = configAfter.split('\n').length
  useEffect(() => {
    if (lines >= total) return
    const timer = setTimeout(() => setLines(lines + 1), 700)
    return () => clearTimeout(timer)
  }, [lines, total])

  const files: FileEdit[] = [
    { path: 'src/cart/total.ts', before, after },
    {
      path: 'src/config.ts',
      before: config,
      after: configAfter.split('\n').slice(0, lines).join('\n'),
      streaming: lines < total,
    },
    {
      path: 'src/cart/item.ts',
      before: '',
      after: 'export interface Item {\n  price: number\n  qty: number\n}',
    },
  ]
  return <DiffReview className="w-full max-w-xl" files={files} />
}
