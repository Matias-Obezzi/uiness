'use client'

import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

/** Screenshot service used when no `image` is given. Swap it for your own. */
export const defaultPreviewUrl = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&viewport.width=1200&viewport.height=630`

export interface LinkPreviewProps extends React.ComponentProps<'a'> {
  href: string
  /** Preview image. Without it, `previewUrl` builds one from the link. */
  image?: string
  /** Builds a preview image URL for a link. Default a public screenshot service. */
  previewUrl?: (href: string) => string
  /** Preview width in pixels. Default 224. */
  width?: number
  /** Preview height in pixels. Default 126. */
  height?: number
  /** Milliseconds before the preview opens. Default 100. */
  openDelay?: number
  closeDelay?: number
  /** Classes for the preview card. */
  previewClassName?: string
}

/**
 * A link that shows a picture of its destination while you hover it. The card springs
 * up above the link and leans towards the pointer. Keyboard focus opens it too.
 */
function LinkPreview({
  href,
  image,
  previewUrl = defaultPreviewUrl,
  width = 224,
  height = 126,
  openDelay = 100,
  closeDelay = 150,
  previewClassName,
  className,
  children,
  onPointerMove,
  ...props
}: LinkPreviewProps) {
  const [lean, setLean] = React.useState(0)
  const [loaded, setLoaded] = React.useState(false)
  const src = image ?? previewUrl(href)

  return (
    <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardPrimitive.Trigger asChild>
        <a
          href={href}
          data-slot="link-preview"
          className={cn(
            'font-medium underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground',
            className,
          )}
          onPointerMove={(e) => {
            onPointerMove?.(e)
            const rect = e.currentTarget.getBoundingClientRect()
            setLean(((e.clientX - rect.left) / rect.width - 0.5) * 24)
          }}
          {...props}
        >
          {children}
        </a>
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="top"
          align="center"
          sideOffset={10}
          data-slot="link-preview-content"
          className={cn(
            'z-50 origin-(--radix-hover-card-content-transform-origin) rounded-xl border bg-popover p-1 shadow-xl data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90 data-[state=open]:ease-[linear(0,0.4_20%,1.1_50%,0.96_70%,1)] data-[state=open]:duration-500',
            previewClassName,
          )}
          style={{
            translate: `${lean.toFixed(1)}px 0`,
            transition: 'translate 150ms ease-out',
          }}
        >
          <a href={href} tabIndex={-1} className="block overflow-hidden rounded-lg bg-muted">
            <img
              src={src}
              alt=""
              width={width}
              height={height}
              onLoad={() => setLoaded(true)}
              className={cn(
                'block object-cover object-top transition-opacity duration-300',
                !loaded && 'opacity-0',
              )}
              style={{ width, height }}
            />
          </a>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  )
}

export { LinkPreview }
