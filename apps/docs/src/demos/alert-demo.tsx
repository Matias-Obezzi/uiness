import { TerminalIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert'

export default function AlertDemo() {
  return (
    <Alert className="max-w-md">
      <TerminalIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
  )
}
