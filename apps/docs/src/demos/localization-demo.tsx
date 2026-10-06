import { useState } from 'react'
import { type LabelsPack, LabelsProvider } from '@/lib/labels'
import { en } from '@/lib/labels-en'
import { es } from '@/lib/labels-es'
import { fr } from '@/lib/labels-fr'
import { it } from '@/lib/labels-it'
import { pt } from '@/lib/labels-pt'
import { zh } from '@/lib/labels-zh'
import { CopyButton } from '@/ui/copy-button'
import { DateRangePicker } from '@/ui/date-range-picker'
import { Paginator } from '@/ui/pagination'
import { PasswordField } from '@/ui/password-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'

const languages: Record<string, { name: string; labels: LabelsPack; locale: string }> = {
  en: { name: 'English', labels: en, locale: 'en' },
  es: { name: 'Español', labels: es, locale: 'es' },
  pt: { name: 'Português', labels: pt, locale: 'pt-BR' },
  fr: { name: 'Français', labels: fr, locale: 'fr' },
  it: { name: 'Italiano', labels: it, locale: 'it' },
  zh: { name: '中文', labels: zh, locale: 'zh-CN' },
}

export default function LocalizationDemo() {
  const [language, setLanguage] = useState('es')
  const [page, setPage] = useState(3)
  const current = languages[language] ?? languages.en

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger aria-label="Language" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languages).map(([code, { name }]) => (
            <SelectItem key={code} value={code} lang={code}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <LabelsProvider labels={current?.labels} locale={current?.locale}>
        <div lang={current?.locale} className="flex w-full flex-col gap-5">
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
