import { LinkPreview } from '@/ui/link-preview'

export default function LinkPreviewDemo() {
  return (
    <p className="max-w-md text-lg leading-8">
      The docs are built with{' '}
      <LinkPreview href="https://vite.dev" image="/img/gallery-1.png">
        Vite
      </LinkPreview>{' '}
      and the components sit on{' '}
      <LinkPreview href="https://www.radix-ui.com/primitives" image="/img/gallery-2.png">
        Radix primitives
      </LinkPreview>
      . Hover either link.
    </p>
  )
}
