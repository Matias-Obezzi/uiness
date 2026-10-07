import { TweetCard } from '@/components/ui/tweet-card'

export default function TweetCardDemo() {
  return (
    <div className="flex w-full items-center justify-center p-4">
      <TweetCard
        author={{
          name: 'Guillermo Rauch',
          handle: 'rauchg',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          verified: true,
        }}
        text="The fastest way to build modern web interfaces with pure animations and zero runtime weight: check @uiness at https://uiness.dev #webdev"
        createdAt="2026-10-07T08:30:00Z"
        metrics={{
          replies: 142,
          reposts: 890,
          likes: 4200,
          views: 95000,
        }}
        media={[
          {
            type: 'image',
            src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            alt: 'Abstract gradient art',
          },
        ]}
      />
    </div>
  )
}
