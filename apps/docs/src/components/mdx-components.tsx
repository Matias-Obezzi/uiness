import type { MDXComponents } from 'mdx/types'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'
import { ComponentPreview } from './component-preview'
import { Install, InstallPackage } from './install'

const slug = (children: ReactNode) =>
  String(childrenText(children))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function childrenText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(childrenText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return childrenText((children as ReactElement<{ children?: ReactNode }>).props.children)
  }
  return ''
}

const heading =
  (Tag: 'h1' | 'h2' | 'h3' | 'h4') =>
  ({ children, className, ...props }: ComponentProps<'h2'>) => {
    const id = slug(children)
    return (
      <Tag id={id} className={cn('group', className)} {...props}>
        <a href={`#${id}`} className="!no-underline !font-inherit text-inherit">
          {children}
        </a>
      </Tag>
    )
  }

function Pre({ children }: { children?: ReactNode }) {
  const child = children as ReactElement<{ className?: string; children?: string }> | undefined
  const code =
    typeof child?.props.children === 'string' ? child.props.children : childrenText(children)
  const lang = child?.props.className?.replace('language-', '') ?? 'tsx'
  return <CodeBlock code={code} lang={lang} className="my-6" />
}

function Anchor({ href = '', children, ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

function Steps({ children }: { children?: ReactNode }) {
  return (
    <div className="[&>h3]:step steps mb-12 ml-4 border-l pl-8 [counter-reset:step]">
      {children}
    </div>
  )
}

function Callout({ children, title }: { children?: ReactNode; title?: string }) {
  return (
    <div className="my-6 rounded-lg border bg-muted/40 px-4 py-3 text-sm [&>p]:mt-1">
      {title && <p className="font-medium">{title}</p>}
      {children}
    </div>
  )
}

export const mdxComponents: MDXComponents = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  pre: Pre,
  a: Anchor,
  table: ({ className, ...props }: ComponentProps<'table'>) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className={cn('my-0', className)} {...props} />
    </div>
  ),
  ComponentPreview,
  Install,
  InstallPackage,
  Steps,
  Callout,
}
