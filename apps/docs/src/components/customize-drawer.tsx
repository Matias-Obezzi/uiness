import { ChevronRightIcon, PaletteIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/collapsible'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/ui/drawer'
import { setCustomizerOpen, useCustomizerOpen, useThemeChoice } from '~/lib/theme-choice'
import { siteChrome } from '~/lib/themes'
import {
  AccentPicker,
  BasePicker,
  ColorEditor,
  CopyThemeCss,
  editedCount,
  Field,
  ModePicker,
  PresetGrid,
  RadiusPicker,
  ResetTheme,
} from './theme-controls'

/**
 * The theme, from any page. A sheet from the right with no dimming, so the previews behind it
 * can be watched while they change. It is part of the site, so it keeps the site's own look.
 */
export function CustomizeDrawer() {
  const open = useCustomizerOpen()
  const choice = useThemeChoice()
  const edited = editedCount(choice)
  return (
    <Drawer open={open} onOpenChange={setCustomizerOpen}>
      <DrawerContent
        side="right"
        overlay={false}
        className={cn(siteChrome, 'w-full max-w-full shadow-2xl sm:max-w-sm')}
      >
        <DrawerHeader className="border-b px-5 pt-5">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <PaletteIcon className="size-4" /> Customize
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Themes every component preview on the site. The docs keep their own look.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-6 px-5 py-5">
          <Field label="Presets">
            <PresetGrid compact className="grid-cols-4" />
          </Field>
          <Field label="Accent color">
            <AccentPicker />
          </Field>
          <Field label="Base gray">
            <BasePicker />
          </Field>
          <Field label="Radius">
            <RadiusPicker />
          </Field>
          <Field label="Theme">
            <ModePicker />
          </Field>
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <ChevronRightIcon className="size-4 text-muted-foreground transition-transform duration-(--duration-fast,150ms) group-data-[state=open]:rotate-90" />
              Edit colors
              {edited > 0 && (
                <Badge variant="secondary" className="ml-auto font-mono">
                  {edited} edited
                </Badge>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-3 pt-3 pb-3">
              <ColorEditor />
            </CollapsibleContent>
          </Collapsible>
          <Link
            to="/themes"
            onClick={() => setCustomizerOpen(false)}
            className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
          >
            See every component in this theme
          </Link>
        </DrawerBody>
        <DrawerFooter className="flex-row border-t px-5">
          <CopyThemeCss className="flex-1" />
          <ResetTheme variant="outline" />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
