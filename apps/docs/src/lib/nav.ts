import {
  BookOpenIcon,
  ComponentIcon,
  GripVerticalIcon,
  LayoutTemplateIcon,
  type LucideIcon,
  PackageIcon,
  SparklesIcon,
} from 'lucide-react'

export interface NavPage {
  /** Route slug after /docs/. Empty for the introduction. */
  slug: string
  title: string
  description: string
  /** Path of the MDX file under src/content. */
  file: string
  /** The day it shipped, ISO. Pages are tagged new for a while after it. */
  added?: string
}

export interface NavGroup {
  title: string
  pages: NavPage[]
}

export interface NavSection {
  title: string
  /** Drawn before the title in the sidebar and the search. */
  icon: LucideIcon
  pages: NavPage[]
  /** Keep the pages in the order written, for sections meant to be read top to bottom. */
  ordered?: boolean
  /** The same pages split into smaller lists, for the sidebar of the long sections. */
  groups?: NavGroup[]
}

const page = (slug: string, title: string, description: string, file = slug): NavPage => ({
  slug,
  title,
  description,
  file: `${file}.mdx`,
})

const sections: NavSection[] = [
  {
    title: 'Getting started',
    icon: BookOpenIcon,
    ordered: true,
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
      page(
        'localization',
        'Localization',
        'Every word of every component in your language, one at a time or all at once.',
      ),
      page(
        'ai',
        'AI and MCP',
        'Give coding agents the registry: an MCP server, Markdown docs, llms.txt and a skill.',
      ),
    ],
  },
  {
    title: 'Packages',
    icon: PackageIcon,
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
      page(
        'choreo',
        'Choreo',
        'Animates a whole site from what is already on the page, no markup changes.',
      ),
    ],
  },
  {
    title: 'Components',
    icon: ComponentIcon,
    pages: [
      page(
        'components/accordion',
        'Accordion',
        'Sections that open in place, with closed answers still findable.',
      ),
      page(
        'components/alert',
        'Alert',
        'An inline callout for information, success, warnings and errors.',
      ),
      page(
        'components/alert-dialog',
        'Alert Dialog',
        'Asks for a decision before going on, declared or awaited with confirm().',
      ),
      page('components/avatar', 'Avatar', 'A picture of a user with a fallback.'),
      page('components/badge', 'Badge', 'A small label for statuses and counts.'),
      page(
        'components/bar-chart',
        'Bar Chart',
        'Grouped or stacked bars from a list of series, on recharts.',
      ),
      page('components/bento-grid', 'Bento Grid', 'A grid of cards with spans and a hover lift.'),
      page('components/button', 'Button', 'Triggers an action, with variants and sizes.'),
      page('components/calendar', 'Calendar', 'Pick a day, several days or a range.'),
      page('components/chart', 'Chart', 'The shadcn chart API on recharts, styled with the theme.'),
      page('components/card', 'Card', 'A surface with header, content and footer.'),
      page(
        'components/chat-thread',
        'Chat Thread',
        'A conversation from data: grouped messages, reactions, read receipts and a composer.',
      ),
      page('components/checkbox', 'Checkbox', 'A control that can be checked or unchecked.'),
      page(
        'components/chip-group',
        'Chip Group',
        'Filter chips that fill in and slide a check in when picked.',
      ),
      page(
        'components/inline-edit',
        'Inline Edit',
        'Text that becomes a field where it stands, with no layout shift.',
      ),
      page(
        'components/multi-select',
        'Multi Select',
        'Pick several options from a searchable list, shown as tags.',
      ),
      page(
        'components/number-field',
        'Number Field',
        'A bounded number with steppers, held repeat and Intl formatting.',
      ),
      page(
        'components/password-field',
        'Password Field',
        'A password input with a reveal toggle, a strength meter and rules.',
      ),
      page(
        'components/radio-cards',
        'Radio Cards',
        'Option cards with a selection ring that slides between them.',
      ),
      page(
        'components/search-field',
        'Search Field',
        'A search input with clear, loading, a shortcut and an expanding mode.',
      ),
      page('components/tag-input', 'Tag Input', 'Typed values that turn into removable tags.'),
      page(
        'components/collapsible',
        'Collapsible',
        'A section that opens and closes, findable while closed.',
      ),
      page('components/combobox', 'Combobox', 'A searchable select, single or multiple.'),
      page(
        'components/color-picker',
        'Color Picker',
        'Area, hue and opacity, four formats, eye dropper, saved colors and contrast.',
      ),
      page(
        'components/comment-thread',
        'Comment Thread',
        'Comments with replies, reactions, mentions, inline edits and resolve.',
      ),
      page(
        'components/context-menu',
        'Context Menu',
        'Right click menus declared once by name, picked per element with a hook.',
      ),
      page('components/date-picker', 'Date Picker', 'A button that opens a calendar.'),
      page(
        'components/date-range-picker',
        'Date Range Picker',
        'Two months side by side with presets, and Apply and Cancel.',
      ),
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
        'components/mention-input',
        'Mention Input',
        'A textarea where @ and # open suggestions at the caret.',
      ),
      page(
        'components/money-input',
        'Money Input',
        'A currency field that groups as you type and returns minor units.',
      ),
      page(
        'components/phone-input',
        'Phone Input',
        'A country picker and a number that formats as you type, out in E.164.',
      ),
      page(
        'components/line-chart',
        'Line Chart',
        'Lines and areas over time from a list of series, on recharts.',
      ),
      page(
        'components/navbar',
        'Navbar',
        'Site navigation that becomes a menu or a bottom bar on phones.',
      ),
      page(
        'components/notification-center',
        'Notification Center',
        'A bell with the unread count that opens notifications in tabs, grouped by day.',
      ),
      page('components/popover', 'Popover', 'Rich content anchored to a trigger.'),
      page('components/progress', 'Progress', 'How far along a task is.'),
      page('components/radio-group', 'Radio Group', 'Pick one of several options.'),
      page('components/scroll-area', 'Scroll Area', 'A scrollable region with themed bars.'),
      page(
        'components/scroll-fade',
        'Scroll Fade',
        'Edges that fade out where there is more to scroll, on any background.',
      ),
      page(
        'components/rich-text-editor',
        'Rich Text Editor',
        'A lightweight editor with Markdown shortcuts, a toolbar, a slash menu and Markdown out.',
      ),
      page('components/select', 'Select', 'Pick one option from a list.'),
      page('components/separator', 'Separator', 'A visual divider.'),
      page(
        'components/signature-pad',
        'Signature Pad',
        'Ink that thins with speed, with undo, replay and PNG or SVG export.',
      ),
      page(
        'components/sidebar',
        'Sidebar',
        'An app sidebar with groups, stacked menus and a remembered state. A drawer on phones.',
      ),
      page('components/skeleton', 'Skeleton', 'A placeholder while content loads.'),
      page('components/slider', 'Slider', 'Pick a number, or a range.'),
      page('components/spinner', 'Spinner', 'Shows that something is loading.'),
      page('components/switch', 'Switch', 'An on and off toggle.'),
      page(
        'components/table',
        'Table',
        'Rows and columns with a border, sideways scroll and a sticky header.',
      ),
      page('components/tabs', 'Tabs', 'Switch between views in the same space.'),
      page('components/textarea', 'Textarea', 'A multi line text field.'),
      page(
        'components/time-picker',
        'Time Picker',
        'Hour and minute segments for the keyboard, with an optional list.',
      ),
      page('components/toggle', 'Toggle', 'A button that stays pressed, alone or in a group.'),
      page('components/tooltip', 'Tooltip', 'A short hint on hover or focus.'),
      page(
        'components/activity-heatmap',
        'Activity Heatmap',
        'A year of days shaded by activity, with a tooltip and arrow keys.',
      ),
      page(
        'components/avatar-group',
        'Avatar Group',
        'Overlapping avatars with a +N counter that lists the rest.',
      ),
      page(
        'components/billing-toggle',
        'Billing Toggle',
        'A monthly and yearly switch, with prices that roll.',
      ),
      page(
        'components/code-block',
        'Code Block',
        'Code with line numbers, marked lines, wrap, copy and any highlighter.',
      ),
      page(
        'components/data-table',
        'Data Table',
        'A sortable, filterable table with selection and pages, no library.',
      ),
      page(
        'components/donut-chart',
        'Donut Chart',
        'Parts of a whole as a ring, with the total rolling in the centre.',
      ),
      page('components/gauge', 'Gauge', 'A value against a range, with colored bands. A meter.'),
      page(
        'components/json-viewer',
        'JSON Viewer',
        'A JSON tree with search, paging and copy value or path.',
      ),
      page(
        'components/metric-card',
        'Metric Card',
        'A KPI with its change, a comparison and a sparkline.',
      ),
      page(
        'components/sparkline',
        'Sparkline',
        'A trend the size of a word, as a line, an area or bars.',
      ),
      page(
        'components/usage-meter',
        'Usage Meter',
        'What fills an allowance, as one stacked bar with a legend.',
      ),
      page(
        'components/button-group',
        'Button Group',
        'Related buttons in one surface, with a highlight that glides between them.',
      ),
      page(
        'components/confirm-morph',
        'Confirm Morph',
        'A button that asks to confirm in place, then shows progress and Undo.',
      ),
      page('components/copy-button', 'Copy Button', 'Copies a value and confirms it at once.'),
      page(
        'components/expanding-button-group',
        'Expanding Button Group',
        'Icon buttons that grow to show their label on hover and focus.',
      ),
      page(
        'components/hold-to-confirm',
        'Hold to Confirm',
        'A button that acts only after being pressed and held.',
      ),
      page('components/kbd', 'Kbd', 'Key caps and shortcuts, ⌘ on a Mac and Ctrl elsewhere.'),
      page(
        'components/segmented-control',
        'Segmented Control',
        'Pick one of a few views, with a thumb that slides.',
      ),
      page('components/split-button', 'Split Button', 'A main action with a menu of related ones.'),
      page(
        'components/theme-switch',
        'Theme Switch',
        'A light and dark switch that sweeps the new theme over the page.',
      ),
      page(
        'components/tour',
        'Tour',
        'Guided tours declared once by name, with a spotlight around each step.',
      ),
      page(
        'components/announcement-bar',
        'Announcement Bar',
        'A top banner that rotates messages, counts down and folds away when dismissed.',
      ),
      page(
        'components/breadcrumb',
        'Breadcrumb',
        'Where a page sits, with the middle folding into a menu when it does not fit.',
      ),
      page(
        'components/empty-state',
        'Empty State',
        'A drawing, a few words and the next step when there is nothing to show.',
      ),
      page(
        'components/expandable-card',
        'Expandable Card',
        'A card that grows out of the grid into a larger view and folds back.',
      ),
      page('components/hover-card', 'Hover Card', 'A preview of a person or a link on hover.'),
      page(
        'components/pagination',
        'Pagination',
        'Pages with ellipses worked out for you, and "Page 2 of 10" on phones.',
      ),
      page(
        'components/resizable-panels',
        'Resizable Panels',
        'Panels that trade space by dragging or the keyboard, remembered.',
      ),
      page(
        'components/stepper',
        'Stepper',
        'The steps of a flow, with lines that fill as you advance.',
      ),
      page(
        'components/swipe-actions',
        'Swipe Actions',
        'List rows that reveal actions when swiped, with the same actions in a menu.',
      ),
      page(
        'components/tree-view',
        'Tree View',
        'Nested folders with the tree keyboard, checkboxes and lazy loading.',
      ),
    ],
  },
  {
    title: 'Blocks',
    icon: LayoutTemplateIcon,
    pages: [
      page('blocks/hero', 'Hero', 'The first thing a page says: headline, lead and actions.'),
      page('blocks/features', 'Features', 'What the product does: feature grids and live bentos.'),
      page('blocks/logos', 'Logos', 'Customer wordmarks in an endless, fading row.'),
      page('blocks/stats', 'Stats', 'Big figures that count up, with labels and captions.'),
      page('blocks/navbar', 'Navbar', 'The bar across the top: wordmark, links and the way in.'),
      page('blocks/footer', 'Footer', 'Links, a newsletter signup and the small print.'),
      page('blocks/cta', 'Call to Action', 'A closing section that asks for the next step.'),
      page('blocks/auth', 'Auth', 'Sign in forms with providers and a side panel.'),
      page('blocks/pricing', 'Pricing', 'Plans side by side with a billing switch.'),
      page('blocks/testimonials', 'Testimonials', 'Quotes from customers, in moving rows.'),
      page('blocks/faq', 'FAQ', 'Questions and answers that open in place.'),
      page('blocks/changelog', 'Changelog', 'Release notes filtered by tag and grouped by month.'),
      page('blocks/newsletter', 'Newsletter', 'An email signup framed by a stack of past issues.'),
      page('blocks/comparison', 'Comparison', 'Us versus them, as a table or stacked cards.'),
      page('blocks/contact', 'Contact', 'A checked form, support channels and office clocks.'),
      page('blocks/blog', 'Blog', 'A post index with filters, pages and an in-place reader.'),
      page(
        'blocks/page-header',
        'Page Header',
        'A project header that folds into a sticky tab bar.',
      ),
      page(
        'blocks/notifications',
        'Notifications',
        'Updates grouped by day, with read state and details.',
      ),
      page(
        'blocks/command-palette',
        'Command Palette',
        'A ⌘K search over pages and actions, with nested lists.',
      ),
      page(
        'blocks/file-upload',
        'File Upload',
        'Dropped files with progress, errors, retry and a total.',
      ),
    ],
  },
  {
    title: 'Drag and drop',
    icon: GripVerticalIcon,
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
    icon: SparklesIcon,
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
      page('motion/gradient-text', 'Gradient Text', 'Text filled with a flowing gradient.'),
      page('motion/scramble-text', 'Scramble Text', 'Text that decodes itself from random glyphs.'),
      page('motion/odometer', 'Odometer', 'Digits that roll to their new value.'),
      page('motion/text-reveal', 'Text Reveal', 'Words that light up as you scroll.'),
      page('motion/confetti', 'Confetti', 'Bursts of confetti from a function or a button.'),
      page('motion/orbit', 'Orbit', 'Items circling a center.'),
      page('motion/sonar', 'Sonar', 'Rings pulsing out from a center.'),
      page('motion/retro-grid', 'Retro Grid', 'A perspective grid rolling towards you.'),
      page('motion/animated-list', 'Animated List', 'A feed that adds items one at a time.'),
      page('motion/card-stack', 'Card Stack', 'A pile of cards that goes round.'),
      page('motion/velocity-marquee', 'Velocity Marquee', 'Text rows that speed up as you scroll.'),
      page('motion/terminal', 'Terminal', 'A terminal that plays a session.'),
      page('motion/magnetic', 'Magnetic', 'Content that pulls towards a nearby pointer.'),
      page('motion/ripple', 'Ripple', 'An ink ripple from where you press.'),
      page('motion/dock', 'Dock', 'A dock that magnifies under the pointer.'),
      page('motion/flip-card', 'Flip Card', 'A card that turns over to show its back.'),
      page(
        'motion/text-morph',
        'Text Morph',
        'A label that morphs into its next value, letter by letter.',
      ),
    ],
  },
]

/** Pages that shipped on the same day. Add a batch here when new pages land. */
const releases: Record<string, string[]> = {
  '2026-10-06': ['localization', 'ai'],
  '2026-10-04': [
    'blocks/blog',
    'blocks/changelog',
    'blocks/command-palette',
    'blocks/comparison',
    'blocks/contact',
    'blocks/file-upload',
    'blocks/newsletter',
    'blocks/notifications',
    'blocks/page-header',
    'components/activity-heatmap',
    'components/announcement-bar',
    'components/avatar-group',
    'components/billing-toggle',
    'components/breadcrumb',
    'components/button-group',
    'components/chat-thread',
    'components/chip-group',
    'components/code-block',
    'components/color-picker',
    'components/comment-thread',
    'components/confirm-morph',
    'components/copy-button',
    'components/data-table',
    'components/date-range-picker',
    'components/donut-chart',
    'components/empty-state',
    'components/expandable-card',
    'components/expanding-button-group',
    'components/gauge',
    'components/hold-to-confirm',
    'components/hover-card',
    'components/inline-edit',
    'components/json-viewer',
    'components/kbd',
    'components/mention-input',
    'components/metric-card',
    'components/money-input',
    'components/multi-select',
    'components/notification-center',
    'components/number-field',
    'components/pagination',
    'components/password-field',
    'components/phone-input',
    'components/radio-cards',
    'components/resizable-panels',
    'components/rich-text-editor',
    'components/scroll-fade',
    'components/search-field',
    'components/segmented-control',
    'components/signature-pad',
    'components/sparkline',
    'components/split-button',
    'components/stepper',
    'components/swipe-actions',
    'components/tag-input',
    'components/theme-switch',
    'components/time-picker',
    'components/tree-view',
    'components/usage-meter',
    'motion/text-morph',
  ],
  '2026-10-01': [
    'components/accordion',
    'components/alert-dialog',
    'components/bar-chart',
    'components/chart',
    'components/collapsible',
    'components/line-chart',
    'components/sidebar',
    'components/spinner',
    'components/table',
    'components/tour',
  ],
  '2026-09-30': [
    'blocks/features',
    'blocks/logos',
    'blocks/stats',
    'blocks/navbar',
    'blocks/footer',
    'blocks/cta',
    'blocks/auth',
    'blocks/hero',
    'blocks/pricing',
    'blocks/testimonials',
    'blocks/faq',
    'choreo',
    'components/context-menu',
    'motion/gradient-text',
    'motion/scramble-text',
    'motion/odometer',
    'motion/text-reveal',
    'motion/confetti',
    'motion/orbit',
    'motion/sonar',
    'motion/retro-grid',
    'motion/animated-list',
    'motion/card-stack',
    'motion/velocity-marquee',
    'motion/terminal',
    'motion/magnetic',
    'motion/ripple',
    'motion/dock',
    'motion/flip-card',
  ],
}

/**
 * Smaller lists inside the long sections, in the order the sidebar shows them. The pages
 * stay alphabetical inside each one. A page left out lands in a last "More" list, so a new
 * page still shows up before it gets a home here.
 */
const groups: Record<string, Record<string, string[]>> = {
  Components: {
    Actions: [
      'button',
      'button-group',
      'billing-toggle',
      'confirm-morph',
      'copy-button',
      'expanding-button-group',
      'hold-to-confirm',
      'kbd',
      'segmented-control',
      'split-button',
      'theme-switch',
      'toggle',
    ],
    Inputs: [
      'form',
      'inline-edit',
      'input',
      'input-otp',
      'label',
      'mention-input',
      'money-input',
      'number-field',
      'password-field',
      'phone-input',
      'rich-text-editor',
      'search-field',
      'signature-pad',
      'tag-input',
      'textarea',
    ],
    Selection: [
      'calendar',
      'checkbox',
      'chip-group',
      'color-picker',
      'combobox',
      'date-picker',
      'date-range-picker',
      'multi-select',
      'radio-cards',
      'radio-group',
      'select',
      'slider',
      'switch',
      'time-picker',
    ],
    Overlays: [
      'alert-dialog',
      'command',
      'context-menu',
      'dialog',
      'drawer',
      'dropdown-menu',
      'hover-card',
      'popover',
      'tooltip',
      'tour',
    ],
    Navigation: ['breadcrumb', 'navbar', 'pagination', 'sidebar', 'stepper', 'tabs', 'tree-view'],
    Layout: [
      'accordion',
      'bento-grid',
      'card',
      'carousel',
      'collapsible',
      'expandable-card',
      'gallery',
      'resizable-panels',
      'scroll-area',
      'scroll-fade',
      'separator',
      'swipe-actions',
    ],
    'Data display': [
      'activity-heatmap',
      'avatar',
      'avatar-group',
      'badge',
      'code-block',
      'data-table',
      'gauge',
      'json-viewer',
      'metric-card',
      'table',
      'usage-meter',
    ],
    Charts: ['bar-chart', 'chart', 'donut-chart', 'line-chart', 'sparkline'],
    Feedback: [
      'alert',
      'announcement-bar',
      'empty-state',
      'notification-center',
      'progress',
      'skeleton',
      'spinner',
    ],
    Conversations: ['chat-thread', 'comment-thread'],
  },
  Blocks: {
    Marketing: [
      'blog',
      'changelog',
      'comparison',
      'contact',
      'cta',
      'faq',
      'features',
      'footer',
      'hero',
      'logos',
      'navbar',
      'newsletter',
      'pricing',
      'stats',
      'testimonials',
    ],
    Application: ['auth', 'command-palette', 'file-upload', 'notifications', 'page-header'],
  },
  Motion: {
    Text: [
      'flip-words',
      'gradient-text',
      'number-ticker',
      'odometer',
      'scramble-text',
      'shimmer',
      'text-generate',
      'text-morph',
      'text-reveal',
      'typewriter',
    ],
    Backgrounds: [
      'aurora',
      'meteors',
      'parallax-grid',
      'pattern',
      'retro-grid',
      'sparkles',
      'spotlight',
    ],
    Scroll: ['marquee', 'reveal', 'sticky-scroll', 'timeline', 'tracing-beam', 'velocity-marquee'],
    Pointer: [
      'animated-tooltip',
      'dock',
      'hover-highlight',
      'link-preview',
      'magnetic',
      'moving-border',
      'ripple',
      'tilt-card',
    ],
    'Cards and effects': [
      'animated-list',
      'card-stack',
      'compare',
      'confetti',
      'flip-card',
      'orbit',
      'path-morph',
      'sonar',
      'terminal',
    ],
  },
}

/** A section's pages split by `groups`, matching on the last part of the slug. */
function groupPages(title: string, pages: NavPage[]): NavGroup[] | undefined {
  const table = groups[title]
  if (!table) return undefined
  const name = (p: NavPage) => p.slug.slice(p.slug.lastIndexOf('/') + 1)
  const placed = new Set<NavPage>()
  const out = Object.entries(table).map(([group, names]) => {
    const list = pages.filter((p) => names.includes(name(p)))
    for (const p of list) placed.add(p)
    return { title: group, pages: list }
  })
  const rest = pages.filter((p) => !placed.has(p))
  if (rest.length) out.push({ title: 'More', pages: rest })
  return out.filter((g) => g.pages.length > 0)
}

const addedOn = new Map(
  Object.entries(releases).flatMap(([date, slugs]) => slugs.map((slug) => [slug, date] as const)),
)

/** Every section alphabetical, apart from the ones meant to be read in order, with its groups. */
export const nav: NavSection[] = sections.map((section) => {
  const pages = section.pages.map((p) => ({ ...p, added: addedOn.get(p.slug) }))
  if (!section.ordered) pages.sort((a, b) => a.title.localeCompare(b.title))
  return { ...section, pages, groups: groupPages(section.title, pages) }
})

export const pages: NavPage[] = nav.flatMap((section) => section.pages)

/** How long a page is called new after it ships. */
const NEW_FOR_DAYS = 7

/** Only the latest releases count, so a busy week doesn't mark half the site as new. */
const NEW_RELEASES = 2

const latestReleases = new Set(Object.keys(releases).sort().slice(-NEW_RELEASES))

export const isNew = (p: NavPage, now = Date.now()) =>
  p.added !== undefined &&
  latestReleases.has(p.added) &&
  now - Date.parse(p.added) < NEW_FOR_DAYS * 24 * 60 * 60 * 1000

export const findPage = (slug: string): NavPage | undefined =>
  pages.find((p) => p.slug === slug.replace(/\/$/, ''))

export const pageHref = (p: NavPage) => (p.slug ? `/docs/${p.slug}` : '/docs')
