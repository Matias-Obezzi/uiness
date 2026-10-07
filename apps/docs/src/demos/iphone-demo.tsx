import { IPhone } from '@/components/ui/iphone'

export default function IPhoneDemo() {
  return (
    <div className="flex w-full items-center justify-center p-6">
      <IPhone
        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80"
        alt="iPhone Wallpaper"
      />
    </div>
  )
}
