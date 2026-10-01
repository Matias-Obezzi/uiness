import { RocketIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert'

export default function AlertIcon() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="info" icon={<RocketIcon />}>
        <AlertTitle>Deploying to production</AlertTitle>
        <AlertDescription>Your own icon in place of the one the variant brings.</AlertDescription>
      </Alert>
      <Alert variant="warning" icon={null}>
        <AlertTitle>No icon at all</AlertTitle>
        <AlertDescription>The text starts at the edge.</AlertDescription>
      </Alert>
    </div>
  )
}
