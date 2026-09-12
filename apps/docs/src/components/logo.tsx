/**
 * The mark: a rounded panel with a `u` cut out of it. One path and no colours of its own, so it
 * takes the colour it is given and needs no second copy for dark mode. Kept solid rather than
 * outlined because it has to survive being 16 pixels wide in a tab.
 */
export function Logo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M6 1h12a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5ZM7 7v6a5 5 0 0 0 10 0V7h-3v6a2 2 0 0 1-4 0V7H7Z"
      />
    </svg>
  )
}
