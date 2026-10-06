import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { ScrollFade } from '@/components/ui/scroll-fade'
import {
  TabsContent as TabsContentPrimitive,
  TabsList,
  Tabs as TabsRoot,
  TabsTrigger,
} from '@/components/ui/tabs'

export interface DocTabProps {
  /** The tab's name. In the Markdown version of the page it becomes a heading. */
  title: string
  children?: ReactNode
}

/** One tab of `DocTabs`. Rendered by its parent; on its own it is just its content. */
export function DocTab({ children }: DocTabProps) {
  return <>{children}</>
}

const isTab = (child: ReactNode): child is ReactElement<DocTabProps> =>
  isValidElement<DocTabProps>(child) && typeof child.props.title === 'string'

/**
 * Alternatives in tabs, written in MDX as `<Tabs>` with a `<Tab title="…">` around each one's
 * Markdown. The row of names scrolls sideways when it does not fit, like on phones.
 */
export function DocTabs({ children }: { children?: ReactNode }) {
  const tabs = Children.toArray(children).filter(isTab)
  const first = tabs[0]?.props.title
  if (!first) return null
  return (
    <TabsRoot defaultValue={first} className="my-6 gap-0">
      <ScrollFade orientation="horizontal" hideScrollbar size={32}>
        <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-none bg-transparent p-0 shadow-[inset_0_-1px_0_var(--border)]">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.props.title}
              value={tab.props.title}
              className="h-auto flex-none rounded-none border-0 border-transparent border-b-2 px-3 py-2 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
            >
              {tab.props.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollFade>
      {tabs.map((tab) => (
        <TabsContentPrimitive
          key={tab.props.title}
          value={tab.props.title}
          className="mt-4 space-y-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
        >
          {tab.props.children}
        </TabsContentPrimitive>
      ))}
    </TabsRoot>
  )
}
