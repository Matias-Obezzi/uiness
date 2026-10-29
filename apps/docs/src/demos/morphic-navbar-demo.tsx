import { useState } from 'react'
import { MorphicNavbar } from '@/components/ui/morphic-navbar'

export default function MorphicNavbarDemo() {
  const [page, setPage] = useState('work')
  return (
    <div className="flex max-w-full flex-col items-center gap-4 overflow-x-auto p-1">
      <MorphicNavbar
        value={page}
        onValueChange={setPage}
        items={[
          { id: 'home', label: 'Home' },
          { id: 'work', label: 'Work' },
          { id: 'about', label: 'About' },
          { id: 'blog', label: 'Blog' },
        ]}
      />
      <p className="text-muted-foreground text-sm">On {page} · drag along the bar to scrub</p>
    </div>
  )
}
