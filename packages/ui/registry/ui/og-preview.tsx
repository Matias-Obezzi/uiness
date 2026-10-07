'use client'

import { ExternalLink } from 'lucide-react'
import * as React from 'react'
import { useLabels } from '@/lib/labels'
import { cn } from '@/lib/utils'

export interface OgPreviewLabels {
  /** Accessible title prefix describing the link preview. */
  preview: (title: string) => string
}

export const defaultOgPreviewLabels: OgPreviewLabels = {
  preview: (title: string) => `Preview of ${title}`,
}

export type OgPreviewVariant = 'x' | 'slack' | 'discord' | 'imessage' | 'linkedin'

export interface OgPreviewProps extends Omit<React.ComponentProps<'a'>, 'title'> {
  /** URL of the target link. */
  url: string
  /** OpenGraph title. */
  title: string
  /** OpenGraph description. */
  description?: string
  /** URL to the preview banner image. */
  image?: string
  /** Website or application name. */
  siteName?: string
  /** Favicon image URL. */
  favicon?: string
  /** Custom accent theme color for sidebars/embed borders. */
  themeColor?: string
  /** Visual presentation style matching platform layouts. Default 'x'. */
  variant?: OgPreviewVariant
}

function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return rawUrl
  }
}

/**
 * Preview card representing how a shared link displays across social platforms and messaging apps.
 */
function OgPreview({
  url,
  title,
  description,
  image,
  siteName,
  favicon,
  themeColor,
  variant = 'x',
  className,
  ...props
}: OgPreviewProps) {
  const labels = useLabels('og-preview', defaultOgPreviewLabels)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const domain = extractDomain(url)

  const renderImage = (aspectClass = 'aspect-[1.91/1]') => {
    if (!image) return null
    return (
      <div className={cn('relative w-full overflow-hidden bg-muted/40', aspectClass)}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-all duration-300',
            imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
          )}
        />
      </div>
    )
  }

  // Variant: Slack
  if (variant === 'slack') {
    const barColor = themeColor || '#e2e8f0'
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-slot="og-preview"
        data-variant="slack"
        aria-label={labels.preview(title)}
        className={cn(
          'group/slack relative block max-w-xl rounded-sm border-l-4 bg-muted/20 p-3 pl-3.5 transition-colors hover:bg-muted/30',
          className,
        )}
        style={{ borderLeftColor: barColor }}
        {...props}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
          {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded-xs object-contain" />}
          <span>{siteName || domain}</span>
        </div>
        <h4 className="mt-1 font-bold text-primary hover:underline line-clamp-2 text-sm leading-snug">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
        {image && (
          <div className="mt-2.5 max-w-md rounded-lg overflow-hidden">
            {renderImage('aspect-[16/9]')}
          </div>
        )}
      </a>
    )
  }

  // Variant: Discord
  if (variant === 'discord') {
    const barColor = themeColor || '#5865F2'
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-slot="og-preview"
        data-variant="discord"
        aria-label={labels.preview(title)}
        className={cn(
          'group/discord relative block max-w-md rounded-md border-l-4 border-border/80 bg-card p-3 shadow-xs transition-opacity hover:opacity-95',
          className,
        )}
        style={{ borderLeftColor: barColor }}
        {...props}
      >
        {siteName && (
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {siteName}
          </div>
        )}
        <h4 className="mt-0.5 font-semibold text-primary hover:underline line-clamp-2 text-sm">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-xs text-card-foreground/80 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
        {image && (
          <div className="mt-2.5 rounded-md overflow-hidden">{renderImage('aspect-[16/9]')}</div>
        )}
      </a>
    )
  }

  // Variant: iMessage
  if (variant === 'imessage') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-slot="og-preview"
        data-variant="imessage"
        aria-label={labels.preview(title)}
        className={cn(
          'group/imessage relative block max-w-sm overflow-hidden rounded-3xl border border-border/70 bg-muted/40 shadow-sm transition-transform duration-150 active:scale-[0.98]',
          className,
        )}
        {...props}
      >
        {renderImage('aspect-[1.8/1]')}
        <div className="p-3 bg-card/60 backdrop-blur-xs">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
            {domain}
          </div>
          <h4 className="mt-0.5 font-medium text-foreground text-sm line-clamp-2 leading-snug">
            {title}
          </h4>
        </div>
      </a>
    )
  }

  // Variant: LinkedIn
  if (variant === 'linkedin') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-slot="og-preview"
        data-variant="linkedin"
        aria-label={labels.preview(title)}
        className={cn(
          'group/linkedin relative block max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md',
          className,
        )}
        {...props}
      >
        {renderImage('aspect-[1.91/1]')}
        <div className="p-3 bg-muted/20 border-t border-border/40">
          <h4 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">
            {title}
          </h4>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{domain}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </div>
        </div>
      </a>
    )
  }

  // Variant: X (Twitter) default
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-slot="og-preview"
      data-variant="x"
      aria-label={labels.preview(title)}
      className={cn(
        'group/x relative block max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-border/80 hover:shadow-md',
        className,
      )}
      {...props}
    >
      {renderImage('aspect-[1.91/1]')}
      <div className="p-3 leading-snug">
        <div className="text-xs text-muted-foreground truncate">{domain}</div>
        <h4 className="mt-1 font-semibold text-foreground text-sm line-clamp-2">{title}</h4>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </a>
  )
}

export { OgPreview }
