import { useState } from 'react'
import { LabelsProvider } from '@/lib/labels'
import { es } from '@/lib/labels-es'
import { CopyButton } from '@/ui/copy-button'
import { DateRangePicker } from '@/ui/date-range-picker'
import { Paginator } from '@/ui/pagination'
import { PasswordField } from '@/ui/password-field'
import { SegmentedControl, SegmentedControlItem } from '@/ui/segmented-control'

export default function LocalizationDemo() {
  const [language, setLanguage] = useState('es')
  const [page, setPage] = useState(3)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <SegmentedControl aria-label="Language" value={language} onValueChange={setLanguage}>
        <SegmentedControlItem value="en">English</SegmentedControlItem>
        <SegmentedControlItem value="es">Español</SegmentedControlItem>
      </SegmentedControl>

      <LabelsProvider
        labels={language === 'es' ? es : undefined}
        locale={language === 'es' ? 'es' : 'en'}
      >
        <div className="flex w-full flex-col gap-5">
          <div className="flex items-center gap-2">
            <DateRangePicker className="flex-1" />
            <CopyButton value="https://uiness.vercel.app" variant="outline" tooltip />
          </div>
          <PasswordField aria-label="Password" defaultValue="hunter2" strength />
          <Paginator page={page} total={120} onPageChange={setPage} compact />
        </div>
      </LabelsProvider>
    </div>
  )
}
