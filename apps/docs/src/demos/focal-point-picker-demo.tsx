import { FocalPointPicker } from '@/components/ui/focal-point-picker'

export default function FocalPointPickerDemo() {
  return (
    <FocalPointPicker
      src="/img/gallery-3.png"
      alt="Mountains over a lake at dusk"
      defaultValue={{ x: 0.62, y: 0.42 }}
      className="max-w-lg"
    />
  )
}
