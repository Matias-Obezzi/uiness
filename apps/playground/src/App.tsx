import { useEffect, useState } from 'react'
import { ImageDemo } from './ImageDemo'
import { IslandDemo } from './IslandDemo'
import { UiDemo } from './UiDemo'

const pages = {
  image: { title: '@uiness/image', Component: ImageDemo },
  island: { title: '@uiness/island', Component: IslandDemo },
  ui: { title: '@uiness/ui', Component: UiDemo },
} as const

type Page = keyof typeof pages

const readHash = (): Page => {
  const hash = window.location.hash.replace('#', '')
  return hash in pages ? (hash as Page) : 'island'
}

export function App() {
  const [page, setPage] = useState<Page>(readHash)

  useEffect(() => {
    const onHash = () => setPage(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const { Component } = pages[page]

  return (
    <>
      <nav className="nav">
        {(Object.keys(pages) as Page[]).map((key) => (
          <a key={key} href={`#${key}`} data-active={key === page || undefined}>
            {pages[key].title}
          </a>
        ))}
      </nav>
      <Component />
    </>
  )
}
