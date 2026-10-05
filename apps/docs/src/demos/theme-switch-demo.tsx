import { ThemeSwitch } from '@/ui/theme-switch'
import { useTheme } from '~/lib/theme'

const variants = ['eclipse', 'split', 'rise', 'fade'] as const

export default function ThemeSwitchDemo() {
  // useTheme is this site's own theme hook; pass yours, from next-themes or a context.
  const { dark, toggle } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {variants.map((variant) => (
        <ThemeSwitch
          key={variant}
          variant={variant}
          theme={dark ? 'dark' : 'light'}
          onThemeChange={toggle}
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
