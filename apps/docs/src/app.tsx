import { Route, Routes } from 'react-router'
import { Island } from '@/ui/island'
import { DocPage } from './components/doc-page'
import { Home } from './components/home'
import { Layout } from './components/layout'

export function App() {
  return (
    <>
      <Island idle={false} />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="docs/*" element={<DocPage />} />
        </Route>
      </Routes>
    </>
  )
}
