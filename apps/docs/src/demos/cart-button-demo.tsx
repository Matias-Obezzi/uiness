import { useState } from 'react'
import { CartButton } from '@/components/ui/cart-button'

const items = [
  { id: 'latte', name: 'Oat latte', price: '$4.50' },
  { id: 'croissant', name: 'Almond croissant', price: '$3.80' },
]

export default function CartButtonDemo() {
  const [cart, setCart] = useState<Record<string, number>>({ croissant: 2 })
  return (
    <ul className="flex w-full max-w-sm flex-col divide-y rounded-xl border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 p-3">
          <div>
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-muted-foreground text-xs">{item.price}</p>
          </div>
          <CartButton
            item={item.name}
            quantity={cart[item.id] ?? 0}
            onQuantityChange={(quantity) => setCart((c) => ({ ...c, [item.id]: quantity }))}
          />
        </li>
      ))}
    </ul>
  )
}
