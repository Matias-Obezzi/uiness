import { Safari } from '@/components/ui/safari'

export default function SafariDemo() {
  return (
    <div className="flex w-full items-center justify-center p-6">
      <Safari
        url="uiness.dev"
        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80"
        alt="Safari Browser Screenshot"
      />
    </div>
  )
}
