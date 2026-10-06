import {
  RadioCards,
  RadioCardsDescription,
  RadioCardsItem,
  RadioCardsPrice,
  RadioCardsTitle,
} from '@/components/ui/radio-cards'

const speeds = [
  { value: 'standard', title: 'Standard', description: '4 to 6 business days', price: 'Free' },
  { value: 'express', title: 'Express', description: '2 business days', price: '$9' },
  { value: 'overnight', title: 'Overnight', description: 'Next morning', price: '$24' },
]

export default function RadioCardsList() {
  return (
    <RadioCards
      aria-label="Shipping"
      defaultValue="express"
      className="w-full max-w-sm grid-cols-1"
    >
      {speeds.map((s) => (
        <RadioCardsItem key={s.value} value={s.value} className="grid grid-cols-[1fr_auto] gap-x-4">
          <RadioCardsTitle>{s.title}</RadioCardsTitle>
          <RadioCardsPrice className="row-span-2 mt-0 self-center pt-0 text-sm">
            {s.price}
          </RadioCardsPrice>
          <RadioCardsDescription>{s.description}</RadioCardsDescription>
        </RadioCardsItem>
      ))}
    </RadioCards>
  )
}
