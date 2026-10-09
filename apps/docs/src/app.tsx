import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { Confirmer } from '@/components/ui/alert-dialog'
import { Island } from '@/components/ui/island'
import { Toaster } from '@/components/ui/toast'
import { DocPage } from './components/doc-page'
import { Home } from './components/home'
import { Layout } from './components/layout'
import { Themes } from './components/themes'
import { track } from './lib/metrics'
import { themeScope } from './lib/themes'

export function App() {
  const { pathname } = useLocation()
  useEffect(() => track('view', pathname), [pathname])

  return (
    <>
      {/* Demos raise these, so they wear the reader's theme like the previews do. */}
      <div {...themeScope} className="contents">
        <Island idle={false} />
        <Toaster closeButton />
      </div>
      <Confirmer />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="docs/*" element={<DocPage />} />
          <Route path="themes" element={<Themes />} />
        </Route>
      </Routes>
    </>
  )
}
