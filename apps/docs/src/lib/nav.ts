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
      page(
        'scroll',
        'Scroll',
        'Scroll progress, parallax and the active section, for any element.',
      ),
      page(
        'dnd',
        'Dnd',
        'Headless drag and drop: sortable lists, boards, grids and free dragging, with the keyboard.',
      ),
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
      page('components/bento-grid', 'Bento Grid', 'A grid of cards with spans and a hover lift.'),
      page('components/button', 'Button', 'Triggers an action, with variants and sizes.'),
      page('components/calendar', 'Calendar', 'Pick a day, several days or a range.'),
      page('components/card', 'Card', 'A surface with header, content and footer.'),
      page('components/checkbox', 'Checkbox', 'A control that can be checked or unchecked.'),
      page('components/combobox', 'Combobox', 'A searchable select, single or multiple.'),
      page('components/date-picker', 'Date Picker', 'A button that opens a calendar.'),
      page(
        'components/command',
        'Command',
        'A command palette with fuzzy search, groups and a keyboard shortcut.',
      ),
      page('components/dialog', 'Dialog', 'A window over the page that asks for attention.'),
      page(
        'components/drawer',
        'Drawer',
        'A panel from any edge, dragged to close, with snap points.',
      ),
      page('components/dropdown-menu', 'Dropdown Menu', 'A menu of actions opened from a trigger.'),
      page('components/form', 'Form', 'Fields that wire label, description and error together.'),
      page(
        'components/carousel',
        'Carousel',
        'A horizontal run of items of any width and any content.',
      ),
      page('components/gallery', 'Gallery', 'An image grid with a full screen lightbox.'),
      page('components/input', 'Input', 'A text field.'),
      page('components/input-otp', 'Input OTP', 'A one time code field.'),
      page('components/label', 'Label', 'An accessible caption for a control.'),
      page(
        'components/navbar',
        'Navbar',
        'Site navigation that becomes a menu or a bottom bar on phones.',
      ),
      page('components/popover', 'Popover', 'Rich content anchored to a trigger.'),
      page('components/progress', 'Progress', 'How far along a task is.'),
      page('components/radio-group', 'Radio Group', 'Pick one of several options.'),
      page('components/scroll-area', 'Scroll Area', 'A scrollable region with themed bars.'),
      page('components/select', 'Select', 'Pick one option from a list.'),
      page('components/separator', 'Separator', 'A visual divider.'),
      page(
        'components/sidebar',
        'Sidebar',
        'A collapsible sidebar that becomes a drawer on phones.',
      ),
      page('components/skeleton', 'Skeleton', 'A placeholder while content loads.'),
      page('components/slider', 'Slider', 'Pick a number, or a range.'),
      page('components/switch', 'Switch', 'An on and off toggle.'),
      page('components/tabs', 'Tabs', 'Switch between views in the same space.'),
      page('components/textarea', 'Textarea', 'A multi line text field.'),
      page('components/toggle', 'Toggle', 'A button that stays pressed, alone or in a group.'),
      page('components/tooltip', 'Tooltip', 'A short hint on hover or focus.'),
    ],
  },
  {
    title: 'Drag and drop',
    pages: [
      page('dnd/sortable', 'Sortable', 'A list you reorder by dragging, or with the keyboard.'),
      page('dnd/kanban', 'Kanban', 'Columns of cards, moved inside a column or across them.'),
      page(
        'dnd/reorderable-grid',
        'Reorderable Grid',
        'Tiles rearranged in two directions, the way app icons move.',
      ),
      page(
        'dnd/draggable',
        'Draggable',
        'Anything you can pick up and move, optionally kept inside its parent.',
      ),
      page(
        'dnd/dropzone',
        'Dropzone',
        'Files dropped in from the desktop, checked by type, size and count.',
      ),
    ],
  },
  {
    title: 'Motion',
    pages: [
      page(
        'motion/spotlight',
        'Spotlight',
        'A light that follows the pointer, and cards whose borders glow.',
      ),
      page('motion/aurora', 'Aurora', 'Drifting blurred color for a background.'),
      page('motion/meteors', 'Meteors', 'Streaks falling across a background.'),
      page('motion/pattern', 'Pattern', 'Grid or dot background that fades at the edges.'),
      page('motion/sparkles', 'Sparkles', 'Twinkling particles on a canvas.'),
      page(
        'motion/text-generate',
        'Text Generate',
        'Words that appear one after another from a blur.',
      ),
      page('motion/typewriter', 'Typewriter', 'Text typed one character at a time.'),
      page('motion/flip-words', 'Flip Words', 'One word from a list at a time.'),
      page('motion/shimmer', 'Shimmer', 'A highlight sweeping across text.'),
      page('motion/number-ticker', 'Number Ticker', 'A number that counts up into view.'),
      page('motion/reveal', 'Reveal', 'Content that transitions in when it scrolls into view.'),
      page('motion/tilt-card', 'Tilt Card', 'A card that tilts towards the pointer in 3D.'),
      page('motion/marquee', 'Marquee', 'Content that scrolls forever.'),
      page('motion/moving-border', 'Moving Border', 'A light running around a border.'),
      page('motion/animated-tooltip', 'Animated Tooltip', 'Avatars with a springy name card.'),
      page('motion/hover-highlight', 'Hover Highlight', 'A highlight that slides between items.'),
      page('motion/compare', 'Compare', 'Drag a divider between two layers.'),
      page('motion/tracing-beam', 'Tracing Beam', 'A line that lights up as you scroll.'),
      page('motion/parallax-grid', 'Parallax Grid', 'Columns that scroll at different speeds.'),
      page('motion/sticky-scroll', 'Sticky Scroll', 'A sticky panel that swaps as you read.'),
      page('motion/timeline', 'Timeline', 'Entries down a line that lights up as you scroll.'),
      page('motion/path-morph', 'Path Morph', 'Morphs between any SVG paths.'),
      page('motion/link-preview', 'Link Preview', 'A picture of the destination on hover.'),
    ],
  },
]

export const pages: NavPage[] = nav.flatMap((section) => section.pages)

export const findPage = (slug: string): NavPage | undefined =>
  pages.find((p) => p.slug === slug.replace(/\/$/, ''))

export const pageHref = (p: NavPage) => (p.slug ? `/docs/${p.slug}` : '/docs')
