import { OgPreview } from '@/components/ui/og-preview'

export default function OgPreviewDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <OgPreview
        url="https://uiness.dev/docs/motion"
        title="uiness — Pure CSS and Canvas Motion Primitives"
        description="Craft delightful, accessible web interfaces without heavy dependencies. 100% deterministic, zero hydration mismatches."
        image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
        siteName="uiness"
        variant="x"
      />
    </div>
  )
}
