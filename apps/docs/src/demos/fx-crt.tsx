import { crt, Fx } from '@/ui/fx'

export default function FxCrt() {
  return (
    <Fx
      src="/img/photo.png"
      alt="Lake on an old monitor"
      effects={crt()}
      className="w-full max-w-md"
    />
  )
}
