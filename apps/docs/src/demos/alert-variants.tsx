import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, OctagonXIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert'

export default function AlertVariants() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>A new version is available</AlertTitle>
        <AlertDescription>Refresh to get the latest features.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle2Icon />
        <AlertTitle>Payment received</AlertTitle>
        <AlertDescription>Your invoice has been marked as paid.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTriangleIcon />
        <AlertTitle>Storage almost full</AlertTitle>
        <AlertDescription>You have used 95% of your plan.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <OctagonXIcon />
        <AlertTitle>Unable to process your payment</AlertTitle>
        <AlertDescription>
          <p>Please verify your billing information and try again.</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
