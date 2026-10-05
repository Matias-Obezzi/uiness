import { useRef, useState } from 'react'
import { Button } from '@/ui/button'
import { SignaturePad, type SignaturePadHandle } from '@/ui/signature-pad'

export default function SignaturePadDemo() {
  const pad = useRef<SignaturePadHandle>(null)
  const [png, setPng] = useState<string | null>(null)
  const [svgSize, setSvgSize] = useState<number | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SignaturePad
        ref={pad}
        onChange={() => {
          setPng(null)
          setSvgSize(null)
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPng(pad.current?.toDataURL() ?? null)}
        >
          Export PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSvgSize(pad.current?.toSVG().length ?? null)}
        >
          Export SVG
        </Button>
        {svgSize !== null && (
          <span className="text-muted-foreground text-xs">SVG string, {svgSize} characters</span>
        )}
      </div>
      {png && (
        <img src={png} alt="Exported signature" className="h-20 w-fit rounded-md border bg-muted" />
      )}
    </div>
  )
}
