import { IPad } from '@/components/ui/ipad'

export default function IPadDemo() {
  return (
    <div className="flex w-full items-center justify-center p-6">
      <IPad
        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80"
        alt="iPad Wallpaper"
        orientation="portrait"
      />
    </div>
  )
}
