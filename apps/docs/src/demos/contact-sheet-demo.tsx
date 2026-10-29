import { ContactSheet } from '@/components/ui/contact-sheet'

const frames = [
  { id: '1', src: '/img/gallery-1.png', alt: 'Peaks at sunset' },
  { id: '2', src: '/img/gallery-2.png', alt: 'Green hills at noon' },
  { id: '3', src: '/img/gallery-3.png', alt: 'Ridges at dusk' },
  { id: '4', src: '/img/gallery-4.png', alt: 'The bay at night' },
  { id: '5', src: '/img/gallery-5.png', alt: 'Hills in fog' },
  { id: '6', src: '/img/gallery-6.png', alt: 'Pale morning' },
]

export default function ContactSheetDemo() {
  return (
    <ContactSheet
      frames={frames}
      defaultValue={{ '3': 'pick', '5': 'strike' }}
      className="max-w-xl"
    />
  )
}
