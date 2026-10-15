import { CreditCard } from '@/components/ui/credit-card'

// Test numbers each brand publishes for development: none of them can be charged.
const cards = [
  { number: '4242424242424242', name: 'Ana Duarte', expiry: '08/29' },
  { number: '5555555555554444', name: 'Leo Martín', expiry: '11/28' },
  { number: '378282246310005', name: 'Sofía Paz', expiry: '04/30' },
  { number: '6011111111111117', name: 'Iván Ríos', expiry: '02/27' },
]

export default function CreditCardBrands() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <CreditCard key={card.number} {...card} masked />
      ))}
    </div>
  )
}
