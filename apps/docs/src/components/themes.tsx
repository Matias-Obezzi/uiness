import { PaletteIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { site } from '~/lib/site'
import { setCustomizerOpen, useThemeChoice } from '~/lib/theme-choice'
import { themeScope } from '~/lib/themes'
import { PresetGrid, ResetTheme, ThemeCodeDialog, themeName } from './theme-controls'
import { ThemesPreview } from './themes-preview'

/**
 * Every component in the reader's theme at once. The controls live in the Customize drawer,
 * the same one the header opens, so this page is the presets and a big preview.
 */
export function Themes() {
  const choice = useThemeChoice()

  useEffect(() => {
    document.title = `Themes · ${site.name}`
  }, [])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-bold text-4xl tracking-tight">Themes</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Start from a preset, or open Customize to pick a gray, a color and a radius and tune any
            color by hand. The theme follows you through the docs: every component preview wears it.
            Copy the result into your global stylesheet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCustomizerOpen(true)}>
            <PaletteIcon /> Customize
          </Button>
          <ThemeCodeDialog />
          <ResetTheme />
        </div>
      </div>

      <section aria-labelledby="presets-title" className="mt-8">
        <h2
          id="presets-title"
          className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide"
        >
          Presets
        </h2>
        <PresetGrid className="grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" />
      </section>

      <section aria-label={`Preview: ${themeName(choice)}`} className="mt-8">
        <div className="overflow-hidden rounded-2xl border">
          <div {...themeScope} className="bg-background p-3 sm:p-4">
            <ThemesPreview />
          </div>
        </div>
      </section>
    </div>
  )
}
