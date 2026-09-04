import { useEffect, useState } from 'react'
import { Progress } from '@/ui/progress'

export default function ProgressDemo() {
  const [value, setValue] = useState(13)
  useEffect(() => {
    const timer = setInterval(() => setValue((v) => (v >= 100 ? 13 : v + 9)), 900)
    return () => clearInterval(timer)
  }, [])
  return <Progress value={value} className="w-full max-w-sm" />
}
