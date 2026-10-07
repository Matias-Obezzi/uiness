import { OgPreview } from '@/components/ui/og-preview'

export default function OgPreviewDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <OgPreview
        url="https://uiness.vercel.app/docs/motion"
        title="uiness — Pure CSS and Canvas Motion Primitives"
        description="Craft delightful, accessible web interfaces without heavy dependencies. 100% deterministic, zero hydration mismatches."
        image="/img/gallery-3.png"
        siteName="uiness"
        variant="x"
      />
    </div>
  )
}
