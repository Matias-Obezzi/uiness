export interface NavPage {
  /** Route slug after /docs/. Empty for the introduction. */
  slug: string
  title: string
  description: string
  /** Path of the MDX file under src/content. */
  file: string
}

export interface NavSection {
  title: string
  pages: NavPage[]
}

const page = (slug: string, title: string, description: string, file = slug): NavPage => ({
  slug,
  title,
  description,
  file: `${file}.mdx`,
})

export const nav: NavSection[] = [
  {
    title: 'Getting started',
    pages: [
      page(
        '',
        'Introduction',
        'What uiness is, what it is not, and how the pieces fit.',
        'introduction',
      ),
      page(
        'installation',
        'Installation',
        'Add the registry to your project and install your first component.',
      ),
      page('theming', 'Theming', 'CSS variables, dark mode and how to make it yours.'),
    ],
  },
  {
    title: 'Packages',
    pages: [
      page('image', 'Image', 'An <img> that loads with blur, pixels, reveals and real progress.'),
      page(
        'island',
        'Island',
        'A Dynamic Island for the web: statuses, live activities, alerts and confirms.',
      ),
      page('fx', 'Fx', 'Canvas image effects: pixelate, dither, palettes, glitch, CRT and more.'),
      page('toast', 'Toast', 'Notifications that stack, expand on hover and follow your promises.'),
    ],
  },
  {
    title: 'Components',
    pages: [
      page(
        'components/alert',
        'Alert',
        'An inline callout for information, success, warnings and errors.',
      ),
      page('components/avatar', 'Avatar', 'A picture of a user with a fallback.'),
      page('components/badge', 'Badge', 'A small label for statuses and counts.'),
      page('components/button', 'Button', 'Triggers an action, with variants and sizes.'),
      page('components/card', 'Card', 'A surface with header, content and footer.'),
      page('components/checkbox', 'Checkbox', 'A control that can be checked or unchecked.'),
      page('components/dialog', 'Dialog', 'A window over the page that asks for attention.'),
      page('components/dropdown-menu', 'Dropdown Menu', 'A menu of actions opened from a trigger.'),
      page('components/gallery', 'Gallery', 'An image grid with a full screen lightbox.'),
      page('components/input', 'Input', 'A text field.'),
      page('components/label', 'Label', 'An accessible caption for a control.'),
      page('components/popover', 'Popover', 'Rich content anchored to a trigger.'),
      page('components/progress', 'Progress', 'How far along a task is.'),
      page('components/separator', 'Separator', 'A visual divider.'),
      page('components/skeleton', 'Skeleton', 'A placeholder while content loads.'),
      page('components/switch', 'Switch', 'An on and off toggle.'),
      page('components/tabs', 'Tabs', 'Switch between views in the same space.'),
      page('components/textarea', 'Textarea', 'A multi line text field.'),
      page('components/tooltip', 'Tooltip', 'A short hint on hover or focus.'),
    ],
  },
]

export const pages: NavPage[] = nav.flatMap((section) => section.pages)

export const findPage = (slug: string): NavPage | undefined =>
  pages.find((p) => p.slug === slug.replace(/\/$/, ''))

export const pageHref = (p: NavPage) => (p.slug ? `/docs/${p.slug}` : '/docs')
