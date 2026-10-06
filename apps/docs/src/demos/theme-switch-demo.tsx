import { ThemeSwitch } from '@/components/ui/theme-switch'
import { useTheme } from '~/lib/theme'

const variants = ['eclipse', 'split', 'rise', 'fade'] as const

export default function ThemeSwitchDemo() {
  // useTheme is this site's own theme hook; pass yours, from next-themes or a context.
  const { theme, setTheme } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {variants.map((variant) => (
        <ThemeSwitch
          key={variant}
          variant={variant}
          theme={theme}
          onThemeChange={setTheme}
          buttonVariant="outline"
          aria-label={`Dark mode, ${variant}`}
          className="capitalize"
        >
          {variant}
        </ThemeSwitch>
      ))}
    </div>
  )
}
