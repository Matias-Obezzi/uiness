import {
  CheckIcon,
  CopyIcon,
  MoonIcon,
  PaletteIcon,
  RotateCcwIcon,
  SunIcon,
  XIcon,
} from 'lucide-react'
import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/accordion'
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
import { hexToOklch, oklchToHex, parseOklch } from '~/lib/color'
import { useTheme } from '~/lib/theme'
import {
  type AccentColorName,
  accentColors,
  type BaseColorName,
  baseColors,
  defaultTheme,
  editableGroups,
  presets,
  previewCss,
  radii,
  sameTheme,
  type ThemeChoice,
  type ThemeMode,
  type ThemePreset,
  themeCss,
  themeVars,
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
      const custom = stored.custom ?? {}
      return { ...stored, custom: { light: custom.light ?? {}, dark: custom.dark ?? {} } }
    }
  } catch {}
  return defaultTheme
}

export function Themes() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)
  const [editing, setEditing] = useState(false)
  const { dark, toggle } = useTheme()
  const mode: ThemeMode = dark ? 'dark' : 'light'

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
  const setColor = (name: string, value: string | null) =>
    setChoice((c) => {
      const { [name]: _, ...rest } = c.custom[mode]
      return {
        ...c,
        custom: { ...c.custom, [mode]: value === null ? rest : { ...rest, [name]: value } },
      }
    })
  const customCount =
    Object.keys(choice.custom.light).length + Object.keys(choice.custom.dark).length

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="font-bold text-4xl tracking-tight">Themes</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Start from a preset or pick a gray, a color and a radius, then tune any color by hand.
          Every component below reads the same CSS variables, so what you see is your app. Copy the
          result into your global stylesheet.
        </p>
      </div>

      <section aria-labelledby="presets-title" className="mt-8">
        <h2
          id="presets-title"
          className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide"
        >
          Presets
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {presets.map((preset) => (
            <PresetCard
              key={preset.name}
              preset={preset}
              mode={mode}
              active={sameTheme(preset.theme, choice)}
              onClick={() => setChoice(preset.theme)}
            />
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5 rounded-xl border bg-card p-4">
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

        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant={editing ? 'secondary' : 'outline'}
            size="sm"
            className="h-8"
            aria-pressed={editing}
            aria-controls="theme-editor"
            onClick={() => setEditing((e) => !e)}
          >
            <PaletteIcon /> Customize
            {customCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 font-mono text-[10px] text-primary-foreground">
                {customCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            disabled={sameTheme(choice, defaultTheme)}
            onClick={() => setChoice(defaultTheme)}
          >
            <RotateCcwIcon /> Reset
          </Button>
          <CopyTheme choice={choice} />
        </div>
      </div>

      <div
        className={cn(
          'mt-8',
          editing &&
            'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start',
        )}
      >
        {editing && (
          <ColorEditor
            choice={choice}
            mode={mode}
            onChange={setColor}
            onReset={() => update({ custom: { ...choice.custom, [mode]: {} } })}
            onClose={() => setEditing(false)}
          />
        )}
        <ThemesPreview compact={editing} />
      </div>
    </div>
  )
}

function PresetCard({
  preset,
  mode,
  active,
  onClick,
}: {
  preset: ThemePreset
  mode: ThemeMode
  active: boolean
  onClick: () => void
}) {
  const vars = themeVars(preset.theme)[mode]
  const radius = `${Math.min(preset.theme.radius, 0.75)}rem`
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-card p-2 text-left text-sm transition-[border-color,box-shadow] hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active && 'border-foreground ring-1 ring-foreground',
      )}
    >
      {/* A tiny screen in the preset's own colors: a surface, a heading, a muted line and a button. */}
      <span
        aria-hidden
        className="flex h-16 flex-col justify-between border p-2"
        style={{ background: vars.background, borderColor: vars.border, borderRadius: radius }}
      >
        <span className="flex flex-col gap-1">
          <span className="h-1.5 w-2/3 rounded-full" style={{ background: vars.foreground }} />
          <span
            className="h-1.5 w-1/2 rounded-full"
            style={{ background: vars['muted-foreground'] }}
          />
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-8" style={{ background: vars.primary, borderRadius: radius }} />
          <span className="h-3 w-6" style={{ background: vars.secondary, borderRadius: radius }} />
          <span className="ml-auto size-3 rounded-full" style={{ background: vars['chart-2'] }} />
        </span>
      </span>
      <span className="flex items-center justify-between px-0.5 font-medium">
        {preset.name}
        {active && <CheckIcon className="size-3.5" />}
      </span>
    </button>
  )
}

function ColorEditor({
  choice,
  mode,
  onChange,
  onReset,
  onClose,
}: {
  choice: ThemeChoice
  mode: ThemeMode
  onChange: (name: string, value: string | null) => void
  onReset: () => void
  onClose: () => void
}) {
  const vars = themeVars(choice)[mode]
  const custom = choice.custom[mode]
  const edited = Object.keys(custom).length
  return (
    <aside
      id="theme-editor"
      aria-label="Customize colors"
      className="rounded-xl border bg-card lg:sticky lg:top-20 lg:order-last lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
    >
      <div className="sticky top-0 z-(--z-raised,10) flex items-start justify-between gap-2 border-b bg-card p-4">
        <div>
          <h2 className="font-semibold">Customize</h2>
          <p className="text-muted-foreground text-xs">
            Editing the {mode} colors. Switch the mode to edit the other set.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      <Accordion type="multiple" defaultValue={['Surfaces', 'Actions']} className="px-4">
        {editableGroups.map((group) => (
          <AccordionItem key={group.label} value={group.label}>
            <AccordionTrigger>{group.label}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2.5">
              {group.vars.map((name) => (
                <ColorRow
                  key={name}
                  name={name}
                  value={vars[name] ?? ''}
                  edited={name in custom}
                  onChange={(v) => onChange(name, v)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex items-center justify-between gap-2 p-4">
        <p className="text-muted-foreground text-xs">
          {edited ? `${edited} edited in ${mode}` : 'Nothing edited yet'}
        </p>
        <Button variant="outline" size="sm" disabled={!edited} onClick={onReset}>
          <RotateCcwIcon /> Reset {mode}
        </Button>
      </div>
    </aside>
  )
}

/** Best effort hex for the native picker, which only speaks `#rrggbb`. */
function toHex(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  return oklchToHex(value) ?? '#000000'
}

function ColorRow({
  name,
  value,
  edited,
  onChange,
}: {
  name: string
  value: string
  edited: boolean
  onChange: (value: string | null) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    const next = draft.trim()
    if (next === value) return
    if (next && CSS.supports('color', next)) onChange(next)
    else setDraft(value)
  }
  const id = `color-${name}`
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-xs"
        style={{ background: value }}
      >
        <span className="sr-only">Pick {name}</span>
        <input
          type="color"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={toHex(value)}
          onChange={(e) => onChange(hexToOklch(e.target.value, parseOklch(value)?.alpha))}
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={id} className="flex items-center gap-1.5 font-medium text-xs">
          {name}
          {edited && (
            <>
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              <span className="sr-only">(edited)</span>
            </>
          )}
        </label>
        <input
          id={id}
          value={draft}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setDraft(value)
          }}
          className="w-full truncate bg-transparent font-mono text-muted-foreground text-xs outline-none focus:text-foreground"
        />
      </div>
      {edited && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={`Reset ${name}`}
          onClick={() => onChange(null)}
        >
          <RotateCcwIcon />
        </Button>
      )}
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
        className="flex size-6 items-center justify-center rounded-full text-white ring-1 ring-foreground/15 ring-inset"
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
  const preset = presets.find((p) => sameTheme(p.theme, choice))
  const edited = Object.keys(choice.custom.light).length + Object.keys(choice.custom.dark).length
  const name =
    preset?.name ??
    [
      baseColors[choice.base].label,
      choice.accent === 'none' ? null : accentColors[choice.accent].label,
      edited ? 'custom' : null,
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
