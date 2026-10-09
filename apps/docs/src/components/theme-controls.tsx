import { CheckIcon, CodeIcon, MoonIcon, RotateCcwIcon, SunIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button, type ButtonProps } from '@/components/ui/button'
import { CopyButton, type CopyButtonProps } from '@/components/ui/copy-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control'
import { useThemeTransition } from '@/components/ui/theme-switch'
import { cn } from '@/lib/utils'
import { hexToOklch, oklchToHex, parseOklch } from '~/lib/color'
import { track } from '~/lib/metrics'
import { type SiteTheme, useTheme } from '~/lib/theme'
import { setThemeChoice, useThemeChoice } from '~/lib/theme-choice'
import {
  type AccentColorName,
  accentColors,
  type BaseColorName,
  baseColors,
  defaultTheme,
  editableGroups,
  presets,
  radii,
  sameTheme,
  siteChrome,
  type ThemeChoice,
  type ThemeMode,
  type ThemePreset,
  themeCss,
  themeVars,
} from '~/lib/themes'
import { CodeBlock } from './code-block'

/*
 * The theme controls, shared by the Customize drawer and the themes page. Each one reads and
 * writes the site wide choice, so wherever it is changed, every preview follows.
 */

const update = (patch: Partial<ThemeChoice>) => setThemeChoice((c) => ({ ...c, ...patch }))

/** How many colors were edited by hand, in both modes. */
export const editedCount = (choice: ThemeChoice) =>
  Object.keys(choice.custom.light).length + Object.keys(choice.custom.dark).length

/** A short name for the choice: the preset it matches, or what it is made of. */
export function themeName(choice: ThemeChoice) {
  const preset = presets.find((p) => sameTheme(p.theme, choice))
  if (preset) return preset.name
  return [
    baseColors[choice.base].label,
    choice.accent === 'none' ? null : accentColors[choice.accent].label,
    editedCount(choice) ? 'custom' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** A labelled group of controls. */
export function Field({
  label,
  children,
  className,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </legend>
      {children}
    </fieldset>
  )
}

export function PresetCard({
  preset,
  mode,
  active,
  compact,
  onClick,
}: {
  preset: ThemePreset
  mode: ThemeMode
  active: boolean
  compact?: boolean
  onClick: () => void
}) {
  const vars = themeVars(preset.theme)[mode]
  const radius = `${Math.min(preset.theme.radius, compact ? 0.5 : 0.75)}rem`
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col rounded-xl border bg-card text-left transition-[border-color,box-shadow] hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        compact ? 'gap-1.5 rounded-lg p-1.5 text-xs' : 'gap-2 p-2 text-sm',
        active && 'border-foreground ring-1 ring-foreground',
      )}
    >
      {/* A tiny screen in the preset's own colors: a surface, a heading, a muted line and a button. */}
      <span
        aria-hidden
        className={cn('flex flex-col justify-between border', compact ? 'h-10 p-1.5' : 'h-16 p-2')}
        style={{ background: vars.background, borderColor: vars.border, borderRadius: radius }}
      >
        <span className="flex flex-col gap-1">
          <span className="h-1.5 w-2/3 rounded-full" style={{ background: vars.foreground }} />
          {!compact && (
            <span
              className="h-1.5 w-1/2 rounded-full"
              style={{ background: vars['muted-foreground'] }}
            />
          )}
        </span>
        <span className="flex items-center gap-1">
          <span
            className={cn(compact ? 'h-2 w-5' : 'h-3 w-8')}
            style={{ background: vars.primary, borderRadius: radius }}
          />
          <span
            className={cn(compact ? 'h-2 w-3' : 'h-3 w-6')}
            style={{ background: vars.secondary, borderRadius: radius }}
          />
          <span
            className={cn('ml-auto rounded-full', compact ? 'size-2' : 'size-3')}
            style={{ background: vars['chart-2'] }}
          />
        </span>
      </span>
      <span className="flex items-center justify-between gap-1 px-0.5 font-medium">
        <span className="truncate">{preset.name}</span>
        {active && <CheckIcon className={cn('shrink-0', compact ? 'size-3' : 'size-3.5')} />}
      </span>
    </button>
  )
}

export function PresetGrid({ compact, className }: { compact?: boolean; className?: string }) {
  const choice = useThemeChoice()
  const { theme } = useTheme()
  return (
    <div className={cn('grid gap-2', className)}>
      {presets.map((preset) => (
        <PresetCard
          key={preset.name}
          preset={preset}
          mode={theme}
          compact={compact}
          active={sameTheme(preset.theme, choice)}
          onClick={() => {
            setThemeChoice(preset.theme)
            track('theme', { value: preset.name })
          }}
        />
      ))}
    </div>
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

export function AccentPicker() {
  const choice = useThemeChoice()
  const { theme } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Swatch
        label="None"
        color={baseColors[choice.base][theme].primary}
        active={choice.accent === 'none'}
        onClick={() => update({ accent: 'none' })}
      />
      {(Object.keys(accentColors) as Exclude<AccentColorName, 'none'>[]).map((name) => (
        <Swatch
          key={name}
          label={accentColors[name].label}
          color={accentColors[name][theme].primary}
          active={choice.accent === name}
          onClick={() => update({ accent: name })}
        />
      ))}
    </div>
  )
}

export function BasePicker() {
  const choice = useThemeChoice()
  return (
    <div className="flex flex-wrap items-center gap-1">
      {(Object.keys(baseColors) as BaseColorName[]).map((name) => (
        <Swatch
          key={name}
          label={baseColors[name].label}
          color={baseColors[name].swatch}
          active={choice.base === name}
          onClick={() => update({ base: name })}
        />
      ))}
    </div>
  )
}

export function RadiusPicker() {
  const choice = useThemeChoice()
  return (
    <SegmentedControl
      aria-label="Radius"
      size="sm"
      fullWidth
      value={String(choice.radius)}
      onValueChange={(v) => update({ radius: Number(v) })}
    >
      {radii.map((r) => (
        <SegmentedControlItem key={r} value={String(r)} className="px-1 font-mono">
          {r}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}

/** Light and dark for the whole site, with the same reveal as the header switch. */
export function ModePicker() {
  const { theme, setTheme } = useTheme()
  const transition = useThemeTransition()
  const ref = useRef<HTMLDivElement>(null)
  return (
    <SegmentedControl
      ref={ref}
      aria-label="Mode"
      size="sm"
      fullWidth
      value={theme}
      onValueChange={(v) =>
        void transition(() => setTheme(v as SiteTheme), {
          origin: ref.current?.querySelector(`[value=${v}]`) ?? ref.current,
        })
      }
    >
      <SegmentedControlItem value="light">
        <SunIcon /> Light
      </SegmentedControlItem>
      <SegmentedControlItem value="dark">
        <MoonIcon /> Dark
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

/** Back to the site's own theme. */
export function ResetTheme(props: ButtonProps) {
  const choice = useThemeChoice()
  return (
    <Button
      variant="ghost"
      disabled={sameTheme(choice, defaultTheme)}
      onClick={() => setThemeChoice(defaultTheme)}
      {...props}
    >
      <RotateCcwIcon /> Reset
    </Button>
  )
}

/** Copies the theme's CSS straight away, and confirms it on the button. */
export function CopyThemeCss(props: Omit<CopyButtonProps, 'value'>) {
  const choice = useThemeChoice()
  return (
    <CopyButton
      variant="default"
      value={() => themeCss(choice)}
      label="Copy theme CSS"
      {...props}
      onCopy={(text) => {
        track('theme-css', { value: themeName(choice) })
        props.onCopy?.(text)
      }}
    >
      Copy theme CSS
    </CopyButton>
  )
}

/** The theme's CSS in a dialog, to read before copying. */
export function ThemeCodeDialog({ trigger }: { trigger?: ReactNode }) {
  const choice = useThemeChoice()
  const css = themeCss(choice)
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <CodeIcon /> View code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(siteChrome, 'sm:max-w-2xl')}>
        <DialogHeader>
          <DialogTitle>Theme: {themeName(choice)}</DialogTitle>
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
          <CopyButton
            variant="default"
            value={css}
            label="Copy CSS"
            onCopy={() => track('theme-css', { value: themeName(choice) })}
          >
            Copy CSS
          </CopyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Every variable of the current mode, by hand. Switching the mode edits the other set. */
export function ColorEditor() {
  const choice = useThemeChoice()
  const { theme: mode } = useTheme()
  const vars = themeVars(choice)[mode]
  const custom = choice.custom[mode]
  const edited = Object.keys(custom).length
  const setColor = (name: string, value: string | null) =>
    setThemeChoice((c) => {
      const { [name]: _, ...rest } = c.custom[mode]
      return {
        ...c,
        custom: { ...c.custom, [mode]: value === null ? rest : { ...rest, [name]: value } },
      }
    })
  return (
    <div className="flex flex-col">
      <p className="text-muted-foreground text-xs">
        Editing the {mode} colors. Switch the mode to edit the other set.
      </p>
      <Accordion type="multiple" defaultValue={['Surfaces', 'Actions']}>
        {editableGroups.map((group) => (
          <AccordionItem key={group.label} value={group.label}>
            <AccordionTrigger className="py-3">{group.label}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2.5">
              {group.vars.map((name) => (
                <ColorRow
                  key={name}
                  name={name}
                  value={vars[name] ?? ''}
                  edited={name in custom}
                  onChange={(v) => setColor(name, v)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex items-center justify-between gap-2 pt-3">
        <p className="text-muted-foreground text-xs">
          {edited ? `${edited} edited in ${mode}` : 'Nothing edited yet'}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={!edited}
          onClick={() => update({ custom: { ...choice.custom, [mode]: {} } })}
        >
          <RotateCcwIcon /> Reset {mode}
        </Button>
      </div>
    </div>
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
