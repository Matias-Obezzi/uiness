import { Terminal, TerminalLine, TerminalSpinner, TerminalTyping } from '@/ui/terminal'

export default function TerminalDemo() {
  return (
    <Terminal title="~/my-app — zsh" loop loopDelay={4000}>
      <TerminalTyping>pnpm dlx shadcn add @uiness/terminal</TerminalTyping>
      <TerminalSpinner duration={900} done="Checked registry dependencies.">
        Checking registry dependencies
      </TerminalSpinner>
      <TerminalSpinner duration={1100} done="Installed lucide-react.">
        Installing dependencies
      </TerminalSpinner>
      <TerminalSpinner duration={700} done="Created 3 files:">
        Writing components
      </TerminalSpinner>
      <TerminalLine className="pl-6 text-muted-foreground">
        - components/ui/terminal.tsx
      </TerminalLine>
      <TerminalLine className="pl-6 text-muted-foreground">- hooks/use-in-view.ts</TerminalLine>
      <TerminalLine className="pl-6 text-muted-foreground">
        - hooks/use-reduced-motion.ts
      </TerminalLine>
      <TerminalLine delay={500} className="mt-2">
        <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold text-background text-xs">
          DONE
        </span>{' '}
        Terminal is ready. Happy shipping.
      </TerminalLine>
    </Terminal>
  )
}
