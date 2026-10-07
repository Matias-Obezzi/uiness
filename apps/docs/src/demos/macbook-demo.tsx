import { MacBook } from '@/components/ui/macbook'

export default function MacBookDemo() {
  return (
    <div className="flex w-full items-center justify-center p-6">
      <MacBook
        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80"
        alt="MacBook Wallpaper"
      />
    </div>
  )
}
