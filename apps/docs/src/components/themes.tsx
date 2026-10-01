import { CheckIcon, CopyIcon, MoonIcon, RotateCcwIcon, SunIcon } from 'lucide-react'
import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { useTheme } from '~/lib/theme'
import {
  type AccentColorName,
  accentColors,
  type BaseColorName,
  baseColors,
  defaultTheme,
  previewCss,
  radii,
  type ThemeChoice,
  themeCss,
} from '~/lib/themes'
import { CodeBlock } from './code-block'
import { ThemesPreview } from './themes-preview'

const KEY = 'uiness-themes-choice'

function readChoice(): ThemeChoice {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (
      stored &&
      stored.base in baseColors &&
      (stored.accent === 'none' || stored.accent in accentColors) &&
      radii.includes(stored.radius)
    ) {
      return stored
    }
  } catch {}
  return defaultTheme
}

export function Themes() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)
  const { dark, toggle } = useTheme()

  // The picked theme recolors the whole page while it is open, menus and dialogs included,
  // since those render outside any wrapper. Leaving the page puts the site's theme back.
  useLayoutEffect(() => {
    const style = document.createElement('style')
    style.dataset.themesPreview = ''
    style.textContent = previewCss(choice)
    document.head.append(style)
    return () => style.remove()
  }, [choice])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(choice))
    } catch {}
  }, [choice])

  const update = (patch: Partial<ThemeChoice>) => setChoice((c) => ({ ...c, ...patch }))
  const isDefault =
    choice.base === defaultTheme.base &&
    choice.accent === defaultTheme.accent &&
    choice.radius === defaultTheme.radius

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="font-bold text-4xl tracking-tight">Themes</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Pick a gray, a color and a radius. Every component below reads the same CSS variables, so
          what you see is your app. Copy the result into your global stylesheet.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-5 rounded-xl border bg-card p-4">
        <Picker label="Base">
          {(Object.keys(baseColors) as BaseColorName[]).map((name) => (
            <Swatch
              key={name}
              label={baseColors[name].label}
              color={baseColors[name].swatch}
              active={choice.base === name}
              onClick={() => update({ base: name })}
            />
          ))}
        </Picker>

        <Picker label="Color">
          <Swatch
            label="None"
            color={baseColors[choice.base].light.primary}
            active={choice.accent === 'none'}
            onClick={() => update({ accent: 'none' })}
          />
          {(Object.keys(accentColors) as Exclude<AccentColorName, 'none'>[]).map((name) => (
            <Swatch
              key={name}
              label={accentColors[name].label}
              color={accentColors[name].light.primary}
              active={choice.accent === name}
              onClick={() => update({ accent: name })}
            />
          ))}
        </Picker>

        <Picker label="Radius">
          {radii.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={choice.radius === r ? 'default' : 'outline'}
              aria-pressed={choice.radius === r}
              className="h-8 min-w-11 px-2 font-mono text-xs"
              onClick={() => update({ radius: r })}
            >
              {r}
            </Button>
          ))}
        </Picker>

        <Picker label="Mode">
          <Button
            size="sm"
            variant={dark ? 'outline' : 'default'}
            aria-pressed={!dark}
            className="h-8"
            onClick={() => dark && toggle()}
          >
            <SunIcon /> Light
          </Button>
          <Button
            size="sm"
            variant={dark ? 'default' : 'outline'}
            aria-pressed={dark}
            className="h-8"
            onClick={() => !dark && toggle()}
          >
            <MoonIcon /> Dark
          </Button>
        </Picker>

        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            disabled={isDefault}
            onClick={() => setChoice(defaultTheme)}
          >
            <RotateCcwIcon /> Reset
          </Button>
          <CopyTheme choice={choice} />
        </div>
      </div>

      <div className="mt-8">
        <ThemesPreview />
      </div>
    </div>
  )
}

function Picker({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </fieldset>
  )
}

function Swatch({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-full border-2 border-transparent transition-[border-color,transform] hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none',
        active && 'border-foreground',
      )}
    >
      <span
        className="flex size-6 items-center justify-center rounded-full text-white"
        style={{ background: color }}
      >
        {active && <CheckIcon className="size-3.5 drop-shadow" />}
      </span>
    </button>
  )
}

function CopyTheme({ choice }: { choice: ThemeChoice }) {
  const css = themeCss(choice)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])
  const name = [
    baseColors[choice.base].label,
    choice.accent === 'none' ? null : accentColors[choice.accent].label,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <CopyIcon /> Copy code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Theme: {name}</DialogTitle>
          <DialogDescription>
            Paste this into your global stylesheet, in place of the theme's <code>:root</code> and{' '}
            <code>.dark</code> blocks. The names match shadcn/ui, so it works there too.
          </DialogDescription>
        </DialogHeader>
        <CodeBlock
          code={css}
          lang="css"
          collapsible={false}
          className="max-h-[55vh] overflow-y-auto"
        />
        <DialogFooter>
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(css)
                setCopied(true)
              } catch {}
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy CSS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
