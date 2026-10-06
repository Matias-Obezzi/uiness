import { Sonar } from '@/components/ui/sonar'

export default function SonarDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-16">
      <div className="relative flex size-64 items-center justify-center overflow-hidden rounded-full">
        <Sonar rings={4} duration={4} scale={4} className="text-sky-500">
          <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-indigo-500 font-semibold text-lg text-white shadow-lg ring-4 ring-background">
            AL
          </div>
        </Sonar>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm">
          <Sonar variant="pulse" rings={1} duration={1.5} scale={2.6} className="text-red-500">
            <span className="size-2.5 rounded-full bg-red-500" />
          </Sonar>
          <span className="font-medium text-sm">Recording</span>
          <span className="text-muted-foreground text-sm tabular-nums">00:42</span>
        </div>
        <div className="flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm">
          <Sonar variant="pulse" rings={2} duration={2} scale={2.4} className="text-emerald-500">
            <span className="size-2.5 rounded-full bg-emerald-500" />
          </Sonar>
          <span className="font-medium text-sm">Mira is online</span>
        </div>
      </div>
    </div>
  )
}
