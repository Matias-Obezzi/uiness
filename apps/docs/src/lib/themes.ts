/**
 * Theme presets for the themes page: a gray to build on, a color for primary actions and a
 * radius. Values are Tailwind's palette in oklch, the same scales shadcn/ui themes use, so a
 * copied theme drops into either.
 */

interface BaseColor {
  label: string
  /** Swatch shown in the picker. */
  swatch: string
  light: {
    fg: string
    primary: string
    soft: string
    mutedFg: string
    border: string
    ring: string
    sidebar: string
  }
  dark: { bg: string; card: string; primary: string; soft: string; mutedFg: string; ring: string }
}

export const baseColors = {
  neutral: {
    label: 'Neutral',
    swatch: 'oklch(0.556 0 0)',
    light: {
      fg: 'oklch(0.145 0 0)',
      primary: 'oklch(0.205 0 0)',
      soft: 'oklch(0.97 0 0)',
      mutedFg: 'oklch(0.556 0 0)',
      border: 'oklch(0.922 0 0)',
      ring: 'oklch(0.708 0 0)',
      sidebar: 'oklch(0.985 0 0)',
    },
    dark: {
      bg: 'oklch(0.145 0 0)',
      card: 'oklch(0.205 0 0)',
      primary: 'oklch(0.922 0 0)',
      soft: 'oklch(0.269 0 0)',
      mutedFg: 'oklch(0.708 0 0)',
      ring: 'oklch(0.556 0 0)',
    },
  },
  stone: {
    label: 'Stone',
    swatch: 'oklch(0.553 0.013 58.071)',
    light: {
      fg: 'oklch(0.147 0.004 49.25)',
      primary: 'oklch(0.216 0.006 56.043)',
      soft: 'oklch(0.97 0.001 106.424)',
      mutedFg: 'oklch(0.553 0.013 58.071)',
      border: 'oklch(0.923 0.003 48.717)',
      ring: 'oklch(0.709 0.01 56.259)',
      sidebar: 'oklch(0.985 0.001 106.423)',
    },
    dark: {
      bg: 'oklch(0.147 0.004 49.25)',
      card: 'oklch(0.216 0.006 56.043)',
      primary: 'oklch(0.923 0.003 48.717)',
      soft: 'oklch(0.268 0.007 34.298)',
      mutedFg: 'oklch(0.709 0.01 56.259)',
      ring: 'oklch(0.553 0.013 58.071)',
    },
  },
  zinc: {
    label: 'Zinc',
    swatch: 'oklch(0.552 0.016 285.938)',
    light: {
      fg: 'oklch(0.141 0.005 285.823)',
      primary: 'oklch(0.21 0.006 285.885)',
      soft: 'oklch(0.967 0.001 286.375)',
      mutedFg: 'oklch(0.552 0.016 285.938)',
      border: 'oklch(0.92 0.004 286.32)',
      ring: 'oklch(0.705 0.015 286.067)',
      sidebar: 'oklch(0.985 0 0)',
    },
    dark: {
      bg: 'oklch(0.141 0.005 285.823)',
      card: 'oklch(0.21 0.006 285.885)',
      primary: 'oklch(0.92 0.004 286.32)',
      soft: 'oklch(0.274 0.006 286.033)',
      mutedFg: 'oklch(0.705 0.015 286.067)',
      ring: 'oklch(0.552 0.016 285.938)',
    },
  },
  slate: {
    label: 'Slate',
    swatch: 'oklch(0.554 0.046 257.417)',
    light: {
      fg: 'oklch(0.129 0.042 264.695)',
      primary: 'oklch(0.208 0.042 265.755)',
      soft: 'oklch(0.968 0.007 247.896)',
      mutedFg: 'oklch(0.554 0.046 257.417)',
      border: 'oklch(0.929 0.013 255.508)',
      ring: 'oklch(0.704 0.04 256.788)',
      sidebar: 'oklch(0.984 0.003 247.858)',
    },
    dark: {
      bg: 'oklch(0.129 0.042 264.695)',
      card: 'oklch(0.208 0.042 265.755)',
      primary: 'oklch(0.929 0.013 255.508)',
      soft: 'oklch(0.279 0.041 260.031)',
      mutedFg: 'oklch(0.704 0.04 256.788)',
      ring: 'oklch(0.551 0.027 264.364)',
    },
  },
  gray: {
    label: 'Gray',
    swatch: 'oklch(0.551 0.027 264.364)',
    light: {
      fg: 'oklch(0.13 0.028 261.692)',
      primary: 'oklch(0.21 0.034 264.665)',
      soft: 'oklch(0.967 0.003 264.542)',
      mutedFg: 'oklch(0.551 0.027 264.364)',
      border: 'oklch(0.928 0.006 264.531)',
      ring: 'oklch(0.707 0.022 261.325)',
      sidebar: 'oklch(0.985 0.002 247.839)',
    },
    dark: {
      bg: 'oklch(0.13 0.028 261.692)',
      card: 'oklch(0.21 0.034 264.665)',
      primary: 'oklch(0.928 0.006 264.531)',
      soft: 'oklch(0.278 0.033 256.848)',
      mutedFg: 'oklch(0.707 0.022 261.325)',
      ring: 'oklch(0.551 0.027 264.364)',
    },
  },
} satisfies Record<string, BaseColor>

interface AccentColor {
  label: string
  light: { primary: string; fg: string }
  dark: { primary: string; fg: string }
  /** Hue and chroma of the scale the chart colors are drawn from. */
  hue: number
  chroma: number
}

export const accentColors = {
  blue: {
    label: 'Blue',
    light: { primary: 'oklch(0.546 0.245 262.881)', fg: 'oklch(0.97 0.014 254.604)' },
    dark: { primary: 'oklch(0.623 0.214 259.815)', fg: 'oklch(0.97 0.014 254.604)' },
    hue: 262,
    chroma: 0.2,
  },
  green: {
    label: 'Green',
    light: { primary: 'oklch(0.627 0.194 149.214)', fg: 'oklch(0.982 0.018 155.826)' },
    dark: { primary: 'oklch(0.723 0.219 149.579)', fg: 'oklch(0.266 0.065 152.934)' },
    hue: 150,
    chroma: 0.17,
  },
  orange: {
    label: 'Orange',
    light: { primary: 'oklch(0.646 0.222 41.116)', fg: 'oklch(0.98 0.016 73.684)' },
    dark: { primary: 'oklch(0.705 0.213 47.604)', fg: 'oklch(0.98 0.016 73.684)' },
    hue: 45,
    chroma: 0.19,
  },
  rose: {
    label: 'Rose',
    light: { primary: 'oklch(0.586 0.253 17.585)', fg: 'oklch(0.969 0.015 12.422)' },
    dark: { primary: 'oklch(0.645 0.246 16.439)', fg: 'oklch(0.969 0.015 12.422)' },
    hue: 16,
    chroma: 0.2,
  },
  violet: {
    label: 'Violet',
    light: { primary: 'oklch(0.541 0.281 293.009)', fg: 'oklch(0.969 0.016 293.756)' },
    dark: { primary: 'oklch(0.606 0.25 292.717)', fg: 'oklch(0.969 0.016 293.756)' },
    hue: 293,
    chroma: 0.22,
  },
  yellow: {
    label: 'Yellow',
    light: { primary: 'oklch(0.795 0.184 86.047)', fg: 'oklch(0.421 0.095 57.708)' },
    dark: { primary: 'oklch(0.795 0.184 86.047)', fg: 'oklch(0.421 0.095 57.708)' },
    hue: 86,
    chroma: 0.17,
  },
  red: {
    label: 'Red',
    light: { primary: 'oklch(0.577 0.245 27.325)', fg: 'oklch(0.971 0.013 17.38)' },
    dark: { primary: 'oklch(0.637 0.237 25.331)', fg: 'oklch(0.971 0.013 17.38)' },
    hue: 27,
    chroma: 0.2,
  },
} satisfies Record<string, AccentColor>

export type BaseColorName = keyof typeof baseColors
export type AccentColorName = keyof typeof accentColors | 'none'

export const radii = [0, 0.3, 0.5, 0.625, 0.75, 1] as const

export interface ThemeChoice {
  base: BaseColorName
  accent: AccentColorName
  radius: number
}

/** What the site ships with: neutral, no accent, 0.75rem. */
export const defaultTheme: ThemeChoice = { base: 'neutral', accent: 'none', radius: 0.75 }

// The theme's own chart colors, used while no accent is picked.
const defaultCharts = {
  light: [
    'oklch(0.646 0.222 41.116)',
    'oklch(0.6 0.118 184.704)',
    'oklch(0.398 0.07 227.392)',
    'oklch(0.828 0.189 84.429)',
    'oklch(0.769 0.188 70.08)',
  ],
  dark: [
    'oklch(0.488 0.243 264.376)',
    'oklch(0.696 0.17 162.48)',
    'oklch(0.769 0.188 70.08)',
    'oklch(0.627 0.265 303.9)',
    'oklch(0.645 0.246 16.439)',
  ],
}

/** Five steps of the accent, light to dark, so charts read as one family. */
const accentCharts = ({ hue, chroma }: AccentColor) =>
  [0.81, 0.71, 0.62, 0.54, 0.46].map(
    (l, i) => `oklch(${l} ${(chroma * ([0.6, 0.85, 1, 1, 0.9][i] ?? 1)).toFixed(3)} ${hue})`,
  )

export type ThemeVars = Record<string, string>

export function themeVars({ base, accent, radius }: ThemeChoice): {
  light: ThemeVars
  dark: ThemeVars
} {
  const b = baseColors[base]
  const a = accent === 'none' ? null : accentColors[accent]
  const lightPrimary = a?.light.primary ?? b.light.primary
  const lightPrimaryFg = a?.light.fg ?? 'oklch(0.985 0 0)'
  const darkPrimary = a?.dark.primary ?? b.dark.primary
  const darkPrimaryFg = a?.dark.fg ?? b.dark.card
  const charts = a ? { light: accentCharts(a), dark: accentCharts(a) } : defaultCharts

  const light: ThemeVars = {
    radius: `${radius}rem`,
    background: 'oklch(1 0 0)',
    foreground: b.light.fg,
    card: 'oklch(1 0 0)',
    'card-foreground': b.light.fg,
    popover: 'oklch(1 0 0)',
    'popover-foreground': b.light.fg,
    primary: lightPrimary,
    'primary-foreground': lightPrimaryFg,
    secondary: b.light.soft,
    'secondary-foreground': b.light.primary,
    muted: b.light.soft,
    'muted-foreground': b.light.mutedFg,
    accent: b.light.soft,
    'accent-foreground': b.light.primary,
    destructive: 'oklch(0.577 0.245 27.325)',
    border: b.light.border,
    input: b.light.border,
    ring: a ? lightPrimary : b.light.ring,
    ...Object.fromEntries(charts.light.map((c, i) => [`chart-${i + 1}`, c])),
    sidebar: b.light.sidebar,
    'sidebar-foreground': b.light.fg,
    'sidebar-primary': lightPrimary,
    'sidebar-primary-foreground': lightPrimaryFg,
    'sidebar-accent': b.light.soft,
    'sidebar-accent-foreground': b.light.primary,
    'sidebar-border': b.light.border,
    'sidebar-ring': a ? lightPrimary : b.light.ring,
  }

  const dark: ThemeVars = {
    background: b.dark.bg,
    foreground: 'oklch(0.985 0 0)',
    card: b.dark.card,
    'card-foreground': 'oklch(0.985 0 0)',
    popover: b.dark.card,
    'popover-foreground': 'oklch(0.985 0 0)',
    primary: darkPrimary,
    'primary-foreground': darkPrimaryFg,
    secondary: b.dark.soft,
    'secondary-foreground': 'oklch(0.985 0 0)',
    muted: b.dark.soft,
    'muted-foreground': b.dark.mutedFg,
    accent: b.dark.soft,
    'accent-foreground': 'oklch(0.985 0 0)',
    destructive: 'oklch(0.704 0.191 22.216)',
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: a ? darkPrimary : b.dark.ring,
    ...Object.fromEntries(charts.dark.map((c, i) => [`chart-${i + 1}`, c])),
    sidebar: b.dark.card,
    'sidebar-foreground': 'oklch(0.985 0 0)',
    'sidebar-primary': darkPrimary,
    'sidebar-primary-foreground': darkPrimaryFg,
    'sidebar-accent': b.dark.soft,
    'sidebar-accent-foreground': 'oklch(0.985 0 0)',
    'sidebar-border': 'oklch(1 0 0 / 10%)',
    'sidebar-ring': a ? darkPrimary : b.dark.ring,
  }

  return { light, dark }
}

const block = (selector: string, vars: ThemeVars, indent = '  ') =>
  `${selector} {\n${Object.entries(vars)
    .map(([k, v]) => `${indent}--${k}: ${v};`)
    .join('\n')}\n}`

/** The CSS to paste into a project's global stylesheet. */
export function themeCss(choice: ThemeChoice) {
  const { light, dark } = themeVars(choice)
  return `${block(':root', light)}\n\n${block('.dark', dark)}\n`
}

/**
 * The same variables for previewing on this page. The selectors outrank the site's own
 * `:root` and `.dark`, and the dark block outranks the light one.
 */
export function previewCss(choice: ThemeChoice) {
  const { light, dark } = themeVars(choice)
  return `${block('html:root', light)}\n${block('html.dark:root', dark)}`
}
